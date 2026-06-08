package pairing

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"sync"
	"time"
)

// PendingPairing tracks an in-flight PKCE flow between the renderer
// hitting GET /pair and POST /pair/token. Five-minute expiry, single
// use.
type PendingPairing struct {
	Origin        string
	State         string
	CodeChallenge string
	Code          string
	ExpiresAt     time.Time
	Consumed      bool
}

const PendingTTL = 5 * time.Minute

var (
	ErrPendingNotFound  = errors.New("pending pairing not found")
	ErrPendingExpired   = errors.New("pending pairing expired")
	ErrPendingConsumed  = errors.New("pending pairing already consumed")
	ErrVerifierMismatch = errors.New("code_verifier does not match code_challenge")
)

// PendingStore is an in-memory store of in-flight pairings.
// Cleared on process exit by design — pairings that don't complete
// within five minutes are abandoned, which is the right behaviour.
type PendingStore struct {
	mu      sync.Mutex
	entries map[string]*PendingPairing // keyed by code
}

func NewPendingStore() *PendingStore {
	return &PendingStore{entries: map[string]*PendingPairing{}}
}

func (s *PendingStore) Add(p PendingPairing) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.entries[p.Code] = &p
}

func (s *PendingStore) Consume(code, codeVerifier string) (*PendingPairing, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.entries[code]
	if !ok {
		return nil, ErrPendingNotFound
	}
	if time.Now().After(p.ExpiresAt) {
		delete(s.entries, code)
		return nil, ErrPendingExpired
	}
	if p.Consumed {
		return nil, ErrPendingConsumed
	}
	if !verifyPKCE(codeVerifier, p.CodeChallenge) {
		return nil, ErrVerifierMismatch
	}
	p.Consumed = true
	delete(s.entries, code)
	return p, nil
}

// SweepExpired removes pending entries past their TTL. Called on a
// timer from main.
func (s *PendingStore) SweepExpired() {
	now := time.Now()
	s.mu.Lock()
	defer s.mu.Unlock()
	for code, p := range s.entries {
		if now.After(p.ExpiresAt) {
			delete(s.entries, code)
		}
	}
}

func verifyPKCE(codeVerifier, expectedChallenge string) bool {
	sum := sha256.Sum256([]byte(codeVerifier))
	got := base64.RawURLEncoding.EncodeToString(sum[:])
	return subtle.ConstantTimeCompare([]byte(got), []byte(expectedChallenge)) == 1
}
