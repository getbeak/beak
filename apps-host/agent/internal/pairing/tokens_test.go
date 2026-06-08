package pairing

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func newTokenStoreAt(t *testing.T, dir string) *TokenStore {
	t.Helper()
	store, err := OpenTokenStoreAt(filepath.Join(dir, "tokens.json"))
	if err != nil {
		t.Fatalf("OpenTokenStoreAt: %v", err)
	}
	return store
}

func TestTokenStore_IssueReturnsRawAndPersistsHash(t *testing.T) {
	t.Parallel()
	store := newTokenStoreAt(t, t.TempDir())

	rec, raw, err := store.Issue("https://beak.web", "main tab")
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}
	if raw == "" {
		t.Fatal("raw token should be non-empty")
	}
	if rec.TokenID == "" {
		t.Fatal("TokenID should be non-empty")
	}
	if rec.Origin != "https://beak.web" {
		t.Fatalf("origin=%q", rec.Origin)
	}
	if rec.Label != "main tab" {
		t.Fatalf("label=%q", rec.Label)
	}

	// The persisted hash must be hex(sha256(raw)). If this ever changes,
	// every paired client breaks — guard it explicitly.
	sum := sha256.Sum256([]byte(raw))
	want := hex.EncodeToString(sum[:])
	if rec.TokenHash != want {
		t.Fatalf("TokenHash=%q, want %q (hex(sha256(raw)))", rec.TokenHash, want)
	}
}

func TestTokenStore_LookupMatchesByHashNotRaw(t *testing.T) {
	t.Parallel()
	store := newTokenStoreAt(t, t.TempDir())
	rec, raw, err := store.Issue("https://beak.web", "")
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}

	got, ok := store.Lookup(raw)
	if !ok {
		t.Fatal("Lookup with the raw token should succeed")
	}
	if got.TokenID != rec.TokenID {
		t.Fatalf("Lookup returned a different record (id=%q vs %q)", got.TokenID, rec.TokenID)
	}
	if _, ok := store.Lookup("not-the-real-token"); ok {
		t.Fatal("Lookup with an arbitrary string should not match")
	}
}

func TestTokenStore_RevokeRemovesRecord(t *testing.T) {
	t.Parallel()
	store := newTokenStoreAt(t, t.TempDir())
	rec, raw, _ := store.Issue("https://beak.web", "")

	if !store.Revoke(rec.TokenID) {
		t.Fatal("Revoke should return true on a match")
	}
	if _, ok := store.Lookup(raw); ok {
		t.Fatal("Lookup after Revoke should fail")
	}
	if store.Revoke(rec.TokenID) {
		t.Fatal("Revoke should return false on second call")
	}
}

func TestTokenStore_ReopenSeesPersistedTokens(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	first := newTokenStoreAt(t, dir)
	_, raw, err := first.Issue("https://beak.web", "labelled")
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}

	// Simulate process restart: open a fresh store at the same path.
	second := newTokenStoreAt(t, dir)
	if err := second.load(); err != nil {
		t.Fatalf("load: %v", err)
	}
	got, ok := second.Lookup(raw)
	if !ok {
		t.Fatal("Lookup after restart should succeed via persisted hash")
	}
	if got.Label != "labelled" {
		t.Fatalf("label=%q, want labelled", got.Label)
	}
}

func TestTokenStore_FilePermissionsAre0600(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	store := newTokenStoreAt(t, dir)
	if _, _, err := store.Issue("https://beak.web", ""); err != nil {
		t.Fatalf("Issue: %v", err)
	}

	info, err := os.Stat(filepath.Join(dir, "tokens.json"))
	if err != nil {
		t.Fatalf("stat: %v", err)
	}
	// tokens.json contains *hashes* not raw tokens, but it still
	// reveals which origins are paired. Hard-pin the mode at 0600
	// (owner-only) — any drift is a regression.
	if mode := info.Mode().Perm(); mode != 0o600 {
		t.Fatalf("tokens.json mode=%v, want 0600", mode)
	}
}

func TestTokenStore_PairedOriginsDeduplicates(t *testing.T) {
	t.Parallel()
	store := newTokenStoreAt(t, t.TempDir())
	_, _, _ = store.Issue("https://beak.web", "tab a")
	_, _, _ = store.Issue("https://beak.web", "tab b")
	_, _, _ = store.Issue("https://localhost:5173", "dev")

	origins := store.PairedOrigins()
	if len(origins) != 2 {
		t.Fatalf("expected 2 unique origins, got %d (%v)", len(origins), origins)
	}
	if _, ok := origins["https://beak.web"]; !ok {
		t.Fatal("expected https://beak.web in paired origins")
	}
	if _, ok := origins["https://localhost:5173"]; !ok {
		t.Fatal("expected https://localhost:5173 in paired origins")
	}
}

func TestTokenStore_TouchLastUsedUpdatesRecord(t *testing.T) {
	t.Parallel()
	store := newTokenStoreAt(t, t.TempDir())
	rec, _, _ := store.Issue("https://beak.web", "")
	if rec.LastUsedAt != "" {
		t.Fatalf("freshly-issued token should have empty LastUsedAt, got %q", rec.LastUsedAt)
	}

	moment := time.Now().UTC()
	store.TouchLastUsed(rec.TokenID, moment)

	got := store.List()
	if len(got) != 1 {
		t.Fatalf("expected 1 token, got %d", len(got))
	}
	if got[0].LastUsedAt == "" {
		t.Fatal("LastUsedAt should be populated after Touch")
	}
}
