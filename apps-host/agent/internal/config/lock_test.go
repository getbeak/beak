package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestAcquireSingletonLock_FreshPathSucceeds(t *testing.T) {
	t.Parallel()
	path := filepath.Join(t.TempDir(), "beak-agent.lock")

	lock, running, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if running != nil {
		t.Fatalf("expected no running instance on a fresh path, got %+v", running)
	}
	if lock == nil {
		t.Fatal("expected a non-nil lock")
	}
	t.Cleanup(lock.Release)

	if _, err := os.Stat(path); err != nil {
		t.Fatalf("lock file should exist after acquire: %v", err)
	}
}

func TestAcquireSingletonLock_SecondAttemptReturnsRunning(t *testing.T) {
	t.Parallel()
	path := filepath.Join(t.TempDir(), "beak-agent.lock")

	first, _, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("first acquire: %v", err)
	}
	t.Cleanup(first.Release)

	if err := first.SetMetadata(47823, "9.9.9-test"); err != nil {
		t.Fatalf("set metadata: %v", err)
	}

	second, running, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("second acquire: %v", err)
	}
	if second != nil {
		t.Fatal("expected second acquire to fail, got a lock")
	}
	if running == nil {
		t.Fatal("expected running instance metadata")
	}
	if running.Port != 47823 {
		t.Fatalf("expected port 47823, got %d", running.Port)
	}
	if running.Version != "9.9.9-test" {
		t.Fatalf("expected version 9.9.9-test, got %q", running.Version)
	}
	if running.PID != os.Getpid() {
		t.Fatalf("expected PID %d, got %d", os.Getpid(), running.PID)
	}
}

func TestAcquireSingletonLock_AfterReleaseCanReacquire(t *testing.T) {
	t.Parallel()
	path := filepath.Join(t.TempDir(), "beak-agent.lock")

	first, _, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("first acquire: %v", err)
	}
	first.Release()

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("lock file should be removed after release; stat err=%v", err)
	}

	second, running, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("reacquire: %v", err)
	}
	if running != nil {
		t.Fatalf("expected no running instance after release, got %+v", running)
	}
	if second == nil {
		t.Fatal("expected to reacquire the lock cleanly")
	}
	second.Release()
}

func TestAcquireSingletonLock_GarbageMetadataDoesNotPanic(t *testing.T) {
	t.Parallel()
	path := filepath.Join(t.TempDir(), "beak-agent.lock")

	// Pre-seed the path with non-JSON content. flock still works
	// (the body has no semantic meaning to flock); the second acquire
	// should report a zero-valued RunningInstance rather than crash.
	if err := os.WriteFile(path, []byte("not json"), 0o600); err != nil {
		t.Fatalf("seed: %v", err)
	}

	first, _, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("first acquire: %v", err)
	}
	t.Cleanup(first.Release)

	second, running, err := AcquireSingletonLockAt(path)
	if err != nil {
		t.Fatalf("second acquire: %v", err)
	}
	if second != nil {
		t.Fatal("expected second acquire to fail")
	}
	if running == nil {
		t.Fatal("expected a (possibly empty) running instance")
	}
	if running.PID != 0 {
		t.Fatalf("expected zero-valued PID for garbage lock body, got %d", running.PID)
	}
}

func TestSetMetadata_NilReceiverIsNoOp(t *testing.T) {
	t.Parallel()
	var lock *SingletonLock
	if err := lock.SetMetadata(123, "x"); err != nil {
		t.Fatalf("nil-receiver SetMetadata should be nil-safe, got %v", err)
	}
}

func TestRelease_NilReceiverIsNoOp(t *testing.T) {
	t.Parallel()
	var lock *SingletonLock
	lock.Release() // must not panic
}
