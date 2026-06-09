package pairing

import (
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"testing"
	"time"
)

func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func TestPendingStore_ConsumeHappyPath(t *testing.T) {
	t.Parallel()
	store := NewPendingStore()
	verifier := "valid-verifier-with-enough-entropy-1234567890"
	store.Add(PendingPairing{
		Origin:        "https://beak.web",
		State:         "state-1",
		CodeChallenge: pkceChallenge(verifier),
		Code:          "code-1",
		ExpiresAt:     time.Now().Add(time.Minute),
	})

	got, err := store.Consume("code-1", verifier)
	if err != nil {
		t.Fatalf("Consume: %v", err)
	}
	if got.Origin != "https://beak.web" {
		t.Fatalf("origin=%q, want https://beak.web", got.Origin)
	}
	if !got.Consumed {
		t.Fatal("returned pairing should be flagged Consumed")
	}
}

func TestPendingStore_ConsumeIsSingleUse(t *testing.T) {
	t.Parallel()
	store := NewPendingStore()
	verifier := "single-use-verifier-xxxxxxxxxxxxxxxxxxxxx"
	store.Add(PendingPairing{
		Code:          "code-once",
		CodeChallenge: pkceChallenge(verifier),
		ExpiresAt:     time.Now().Add(time.Minute),
	})

	if _, err := store.Consume("code-once", verifier); err != nil {
		t.Fatalf("first Consume: %v", err)
	}
	// Second consume of the same code must fail. Note: Consume deletes
	// the entry on success, so the second attempt sees "not found"
	// rather than "already consumed" — both are correct refusals.
	_, err := store.Consume("code-once", verifier)
	if !errors.Is(err, ErrPendingNotFound) && !errors.Is(err, ErrPendingConsumed) {
		t.Fatalf("expected ErrPendingNotFound or ErrPendingConsumed, got %v", err)
	}
}

func TestPendingStore_ConsumeRejectsWrongVerifier(t *testing.T) {
	t.Parallel()
	store := NewPendingStore()
	correct := "correct-verifier-xxxxxxxxxxxxxxxxxxxxxxxx"
	store.Add(PendingPairing{
		Code:          "code-bad-verifier",
		CodeChallenge: pkceChallenge(correct),
		ExpiresAt:     time.Now().Add(time.Minute),
	})

	_, err := store.Consume("code-bad-verifier", "wrong-verifier")
	if !errors.Is(err, ErrVerifierMismatch) {
		t.Fatalf("expected ErrVerifierMismatch, got %v", err)
	}
	// Entry must NOT be deleted on a failed verifier check — the legitimate
	// renderer might retry. (Code single-use is enforced by Consumed flag,
	// not by clearing on mismatch.)
	if _, err := store.Consume("code-bad-verifier", correct); err != nil {
		t.Fatalf("retry with correct verifier should succeed, got %v", err)
	}
}

func TestPendingStore_ConsumeRejectsUnknownCode(t *testing.T) {
	t.Parallel()
	store := NewPendingStore()
	_, err := store.Consume("never-existed", "anything")
	if !errors.Is(err, ErrPendingNotFound) {
		t.Fatalf("expected ErrPendingNotFound, got %v", err)
	}
}

func TestPendingStore_ConsumeRejectsExpired(t *testing.T) {
	t.Parallel()
	store := NewPendingStore()
	verifier := "expired-verifier-xxxxxxxxxxxxxxxxxxxxxxxx"
	store.Add(PendingPairing{
		Code:          "code-expired",
		CodeChallenge: pkceChallenge(verifier),
		ExpiresAt:     time.Now().Add(-time.Second),
	})

	_, err := store.Consume("code-expired", verifier)
	if !errors.Is(err, ErrPendingExpired) {
		t.Fatalf("expected ErrPendingExpired, got %v", err)
	}
	// Expired entries are evicted on detection.
	if _, err := store.Consume("code-expired", verifier); !errors.Is(err, ErrPendingNotFound) {
		t.Fatalf("expired entry should be evicted; got %v", err)
	}
}

func TestPendingStore_SweepExpiredRemovesOnlyExpired(t *testing.T) {
	t.Parallel()
	store := NewPendingStore()
	verifier := "sweep-verifier-xxxxxxxxxxxxxxxxxxxxxxxxxx"

	store.Add(PendingPairing{
		Code:          "fresh",
		CodeChallenge: pkceChallenge(verifier),
		ExpiresAt:     time.Now().Add(time.Hour),
	})
	store.Add(PendingPairing{
		Code:          "stale",
		CodeChallenge: pkceChallenge(verifier),
		ExpiresAt:     time.Now().Add(-time.Hour),
	})

	store.SweepExpired()

	if _, err := store.Consume("fresh", verifier); err != nil {
		t.Fatalf("fresh entry should survive sweep, got %v", err)
	}
	if _, err := store.Consume("stale", verifier); !errors.Is(err, ErrPendingNotFound) {
		t.Fatalf("stale entry should be swept; got %v", err)
	}
}

func TestVerifyPKCE_RejectsTamperedChallenge(t *testing.T) {
	t.Parallel()
	verifier := "tampered-verifier-xxxxxxxxxxxxxxxxxxxxxxx"
	good := pkceChallenge(verifier)

	if !verifyPKCE(verifier, good) {
		t.Fatal("verifyPKCE should accept the canonical challenge for its verifier")
	}
	// Flip one character of the challenge and confirm the constant-time
	// comparison rejects it.
	tampered := []byte(good)
	tampered[0] ^= 0x01
	if verifyPKCE(verifier, string(tampered)) {
		t.Fatal("verifyPKCE accepted a tampered challenge")
	}
}
