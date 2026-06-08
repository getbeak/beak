package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gofrs/flock"
)

// LockFilename is the name of the singleton-lock file inside RuntimeDir.
// Exported so tests can reason about it.
const LockFilename = "beak-agent.lock"

// SingletonLock represents the exclusive flock held by the running agent
// for its lifetime. Callers must invoke Release on graceful shutdown.
type SingletonLock struct {
	flock *flock.Flock
	path  string
}

// RunningInstance is the diagnostic metadata written into the lock file
// body. Returned to a *second* agent attempting to start so it can tell
// the user which process already holds the lock.
type RunningInstance struct {
	PID       int       `json:"pid"`
	Port      int       `json:"port"`
	Version   string    `json:"version"`
	StartedAt time.Time `json:"startedAt"`
}

// AcquireSingletonLock takes an exclusive, non-blocking flock on
// <RuntimeDir>/beak-agent.lock. It returns one of:
//
//   - (lock, nil, nil) on success — caller owns the lock, defer Release().
//   - (nil, info, nil) when another agent already holds the lock; info
//     carries whatever metadata is readable from the existing lock file.
//   - (nil, nil, err) on filesystem / permission errors.
//
// flock semantics mean a crashed process automatically releases the
// lock when the OS reaps its file descriptors, so there is no stale-lock
// recovery path to write.
func AcquireSingletonLock() (*SingletonLock, *RunningInstance, error) {
	dir, err := RuntimeDir()
	if err != nil {
		return nil, nil, err
	}
	return AcquireSingletonLockAt(filepath.Join(dir, LockFilename))
}

// AcquireSingletonLockAt is the path-injectable variant used by tests.
func AcquireSingletonLockAt(path string) (*SingletonLock, *RunningInstance, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, nil, fmt.Errorf("lock dir: %w", err)
	}

	fl := flock.New(path)
	locked, err := fl.TryLock()
	if err != nil {
		return nil, nil, fmt.Errorf("flock %s: %w", path, err)
	}
	if !locked {
		return nil, readRunningInstance(path), nil
	}
	return &SingletonLock{flock: fl, path: path}, nil, nil
}

// SetMetadata writes diagnostic info into the lock file body. Safe to
// call multiple times; later calls overwrite earlier ones.
func (s *SingletonLock) SetMetadata(port int, version string) error {
	if s == nil || s.flock == nil {
		return nil
	}
	state := RunningInstance{
		PID:       os.Getpid(),
		Port:      port,
		Version:   version,
		StartedAt: time.Now().UTC(),
	}
	bytes, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, bytes, 0o600)
}

// Release unlocks and removes the lock file. Safe to call on a nil
// receiver.
func (s *SingletonLock) Release() {
	if s == nil || s.flock == nil {
		return
	}
	_ = s.flock.Unlock()
	_ = os.Remove(s.path)
}

// Path exposes the lock file path for diagnostics. Empty if uninitialised.
func (s *SingletonLock) Path() string {
	if s == nil {
		return ""
	}
	return s.path
}

func readRunningInstance(path string) *RunningInstance {
	raw, err := os.ReadFile(path)
	if err != nil {
		return &RunningInstance{}
	}
	var inst RunningInstance
	if err := json.Unmarshal(raw, &inst); err != nil {
		return &RunningInstance{}
	}
	return &inst
}
