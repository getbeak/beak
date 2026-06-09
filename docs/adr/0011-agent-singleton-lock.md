# 0011 — Single-instance enforcement for the local agent

- **Status:** Accepted
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

ADR 0001 specifies one menu-bar agent per machine — port discovery
covers the range 47821..47840 so a second process can squeeze in if the
first is on 47821, but every other piece of the agent's design assumes
**exactly one** copy is running:

- `tokens.json` is a single shared file. Two agents writing to it race;
  the last writer wins and silently loses the other's records.
- The renderer's port-scan picks the first reachable agent — the second
  agent's UI is unreachable but is still consuming a port, a tray icon,
  and CPU on the approval sweep timer.
- A second tray icon in the menu bar is plainly wrong UX. Users have no
  reason to suspect there are two agents and no way to tell them apart.

Today a double-launch (double-clicking the binary, a `launchd` agent
overlapping a manual run, a developer starting one in a terminal while
another is already up) silently succeeds. `bindInRange` just walks to
the next free port. The user sees nothing wrong until tokens start
disappearing or `tokens.json` corrupts.

## Decision

The agent acquires an **exclusive non-blocking file lock** on
`<RuntimeDir>/beak-agent.lock` at startup, *before* token-store opens
or port-bind runs. Implementation: `github.com/gofrs/flock`'s `TryLock`
(BSD `flock` on Unix, `LockFileEx` on Windows). If the call returns
"not locked," the second process:

1. Reads the lock file body — a small JSON blob with the running PID,
   port, version, and start time — and prints a one-line user-visible
   message naming those fields.
2. **Exits with status 0.** The user's intent ("have an agent
   running") is satisfied. Status 0 also stops `launchd`/`systemd`
   supervisors from looping us into a restart storm.

The lock file body is written immediately after `ListenAndServe`
returns the bound port, so the next attempted start sees an accurate
URL. The file is `chmod 0600` for the same reason `tokens.json` is.

```
<RuntimeDir>/beak-agent.lock
  flock holder:    running agent process (released on FD reap)
  body:            { pid, port, version, startedAt }
  permissions:     0600 (owner-only)
```

## Why `flock` over a PID file with liveness check

- **No stale-lock recovery path.** `flock` is held by the file
  descriptor, not the file contents. When a process crashes, the OS
  releases the lock as part of FD reaping. A PID file would need a
  liveness check (`kill -0 $PID`) and a TOCTOU race window between
  read-PID and write-our-PID.
- **Atomic.** Two processes racing `TryLock` get a deterministic winner.
- **Cross-platform with one tiny dep.** `gofrs/flock` is ~200 LOC and
  wraps both `flock(2)` and `LockFileEx`. Rolling it ourselves with
  build tags is doable but is more code to maintain.

## Why exit 0, not 1

A non-zero exit triggers `launchd`'s `KeepAlive` behaviour — a constant
respawn loop, an autocorrect for "process crashed". Here the process
didn't crash: it correctly detected a duplicate and bowed out. The
exit code should reflect the user's intent (an agent IS running), not
the literal "we made no progress" interpretation.

## Consequences

- Double-launch is now a clear no-op with a useful message instead of a
  silent corruption hazard.
- Tray icon stays single. `tokens.json` writes stay race-free.
- The lock path is per-config-dir (`HOME` on macOS, `XDG_RUNTIME_DIR` on
  Linux). Tests that sandbox `HOME` (the e2e harness does) get their
  own lock and don't collide with a developer's running agent.
- `cmd/beak-agent/main.go` gains a `-no-tray` flag for the same
  integration harness so the test binary doesn't fight a real menu bar.

## Considered alternatives

- **PID-file + liveness check.** Rejected: TOCTOU race, manual stale
  cleanup, more code than the dependency.
- **First-port-binds-wins.** That's the *current* behaviour — it's
  exactly the bug we're fixing. Two agents on adjacent ports satisfy
  the "got a port" check but break everything downstream.
- **Refuse to launch unless a CLI flag is passed.** Bad UX: the binary
  is the user's entry point; expecting them to know an `--allow-second`
  flag exists defeats the purpose.

## Linked work

- Implementation: `apps-host/agent/internal/config/lock.go`
- Tests: `apps-host/agent/internal/config/lock_test.go`
- Spec scenarios: `docs/features/agent-control-plane.feature`
  → "A second agent process refuses to start" and "The first agent's
  crash releases the singleton lock"
