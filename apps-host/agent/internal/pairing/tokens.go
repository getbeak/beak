// Package pairing implements the PKCE handshake state machine and the
// token store. Tokens are stored as sha256 hashes; the raw token is
// only ever returned to the renderer once (at issue time) and never
// persisted. See docs/adr/0001-local-agent-for-web-host.md Decision §5.
package pairing

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/config"
)

const tokensFilename = "tokens.json"

type TokenRecord struct {
	TokenID    string `json:"tokenId"`
	Origin     string `json:"origin"`
	TokenHash  string `json:"tokenHash"` // hex(sha256(rawToken))
	CreatedAt  string `json:"createdAt"`
	LastUsedAt string `json:"lastUsedAt,omitempty"`
	Label      string `json:"label,omitempty"`
}

type tokensFile struct {
	Tokens []TokenRecord `json:"tokens"`
}

// TokenStore is the agent's authoritative list of paired clients.
// Safe for concurrent use.
type TokenStore struct {
	mu      sync.RWMutex
	path    string
	tokens  []TokenRecord
	rawByID map[string]string // tokenId -> raw token. Empty after restart.
}

func OpenTokenStore() (*TokenStore, error) {
	dir, err := config.ConfigDir()
	if err != nil {
		return nil, err
	}
	return OpenTokenStoreAt(filepath.Join(dir, tokensFilename))
}

// OpenTokenStoreAt opens a TokenStore rooted at an explicit path. Used by
// the integration harness so tests don't write into the user's real
// Application Support directory.
func OpenTokenStoreAt(path string) (*TokenStore, error) {
	store := &TokenStore{path: path, rawByID: map[string]string{}}
	if err := store.load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	return store, nil
}

func (s *TokenStore) load() error {
	data, err := os.ReadFile(s.path)
	if err != nil {
		return err
	}
	var file tokensFile
	if err := json.Unmarshal(data, &file); err != nil {
		return err
	}
	s.tokens = file.Tokens
	return nil
}

func (s *TokenStore) flush() error {
	data, err := json.MarshalIndent(tokensFile{Tokens: s.tokens}, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0o600)
}

// Issue mints a new token bound to origin and returns both the
// persisted record and the raw token. The raw token is only ever
// returned here; subsequent reads only expose the hash.
func (s *TokenStore) Issue(origin, label string) (TokenRecord, string, error) {
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return TokenRecord{}, "", err
	}
	raw := base64.RawURLEncoding.EncodeToString(rawBytes)
	hash := sha256.Sum256([]byte(raw))

	idBytes := make([]byte, 16)
	if _, err := rand.Read(idBytes); err != nil {
		return TokenRecord{}, "", err
	}
	id := base64.RawURLEncoding.EncodeToString(idBytes)

	record := TokenRecord{
		TokenID:   id,
		Origin:    origin,
		TokenHash: hex.EncodeToString(hash[:]),
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
		Label:     label,
	}

	s.mu.Lock()
	s.tokens = append(s.tokens, record)
	s.rawByID[id] = raw
	if err := s.flush(); err != nil {
		s.tokens = s.tokens[:len(s.tokens)-1]
		delete(s.rawByID, id)
		s.mu.Unlock()
		return TokenRecord{}, "", err
	}
	s.mu.Unlock()
	return record, raw, nil
}

// Lookup returns the matching record (and its raw token if known
// in-process) for a presented bearer token. The raw token is only
// available for tokens issued in the current process lifetime —
// after a restart, lookups still succeed via the hash, but the
// HMAC-keyed healthz endpoint loses its key material (which is
// fine: HMAC checks happen client-side using the renderer's stored
// raw token; the agent re-derives via the same token text the
// renderer presents on each request).
func (s *TokenStore) Lookup(rawToken string) (TokenRecord, bool) {
	hash := sha256.Sum256([]byte(rawToken))
	target := []byte(hex.EncodeToString(hash[:]))

	s.mu.RLock()
	defer s.mu.RUnlock()
	// Walk every record and compare in constant time; never early-exit
	// on a match. `subtle.ConstantTimeCompare` returns 1 on equal byte
	// slices of the same length, 0 otherwise — both branches do the
	// same memory access pattern, so a side-channel observer can't
	// distinguish "match at index 0" from "no match at all".
	matchIdx := -1
	for i, t := range s.tokens {
		eq := subtle.ConstantTimeCompare([]byte(t.TokenHash), target)
		// `ConstantTimeSelect(c, a, b)` returns `a` when c==1, `b` when
		// c==0. The same idiom keeps the index assignment branch-free.
		matchIdx = subtle.ConstantTimeSelect(eq, i, matchIdx)
	}
	if matchIdx == -1 {
		return TokenRecord{}, false
	}
	return s.tokens[matchIdx], true
}

// Revoke deletes the record for tokenID. Returns true if a token was
// removed.
func (s *TokenStore) Revoke(tokenID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	idx := -1
	for i, t := range s.tokens {
		if t.TokenID == tokenID {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false
	}
	s.tokens = append(s.tokens[:idx], s.tokens[idx+1:]...)
	delete(s.rawByID, tokenID)
	_ = s.flush()
	return true
}

// TouchLastUsed updates lastUsedAt for the matching record. Debounced
// by the caller to avoid thrashing.
func (s *TokenStore) TouchLastUsed(tokenID string, now time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, t := range s.tokens {
		if t.TokenID == tokenID {
			s.tokens[i].LastUsedAt = now.UTC().Format(time.RFC3339)
			_ = s.flush()
			return
		}
	}
}

// List returns a copy of all current records (no raw tokens). Used by
// the paired-clients tray UI.
func (s *TokenStore) List() []TokenRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]TokenRecord, len(s.tokens))
	copy(out, s.tokens)
	return out
}

// PairedOrigins returns the set of origins that hold at least one
// active token. Used by the CORS layer.
func (s *TokenStore) PairedOrigins() map[string]struct{} {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string]struct{}, len(s.tokens))
	for _, t := range s.tokens {
		out[t.Origin] = struct{}{}
	}
	return out
}
