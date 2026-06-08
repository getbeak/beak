package server

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

func newHealthzServer(t *testing.T) *Server {
	t.Helper()
	tokens, err := pairing.OpenTokenStoreAt(filepath.Join(t.TempDir(), "tokens.json"))
	if err != nil {
		t.Fatalf("OpenTokenStoreAt: %v", err)
	}
	return &Server{
		tokens:          tokens,
		pending:         pairing.NewPendingStore(),
		approvals:       pairing.NewApprovalQueue(),
		lastTouched:     map[string]time.Time{},
		touchDebounceMs: 1000,
	}
}

func TestHealthz_AnonymousResponseShape(t *testing.T) {
	t.Parallel()
	srv := newHealthzServer(t)

	req := httptest.NewRequest(http.MethodGet, wire.HealthzPath, nil)
	rec := httptest.NewRecorder()
	srv.handleHealthz(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("content-type=%q", ct)
	}

	var got wire.HealthzResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if got.Agent != wire.FingerprintName {
		t.Fatalf("agent=%q, want %q", got.Agent, wire.FingerprintName)
	}
	if got.Version != wire.AgentSemver {
		t.Fatalf("version=%q, want %q", got.Version, wire.AgentSemver)
	}
	if len(got.Supports) == 0 {
		t.Fatal("supports must list at least one capability")
	}
	sawProtocol := false
	sawSse := false
	for _, c := range got.Supports {
		if c == wire.ProtocolVersion {
			sawProtocol = true
		}
		if c == "sse" {
			sawSse = true
		}
	}
	if !sawProtocol {
		t.Fatalf("supports missing %q: %v", wire.ProtocolVersion, got.Supports)
	}
	if !sawSse {
		t.Fatalf("supports missing 'sse': %v", got.Supports)
	}
	if got.Nonce != nil || got.Signature != nil {
		t.Fatalf("anonymous response must not include nonce/signature; got %+v / %+v", got.Nonce, got.Signature)
	}
}

func TestHealthz_OptionsPreflightReturns204(t *testing.T) {
	t.Parallel()
	srv := newHealthzServer(t)

	req := httptest.NewRequest(http.MethodOptions, wire.HealthzPath, nil)
	req.Header.Set("Origin", "https://beak.web")
	rec := httptest.NewRecorder()
	srv.handleHealthz(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("OPTIONS status=%d, want 204", rec.Code)
	}
}

func TestHealthz_PostRejected(t *testing.T) {
	t.Parallel()
	srv := newHealthzServer(t)

	req := httptest.NewRequest(http.MethodPost, wire.HealthzPath, nil)
	rec := httptest.NewRecorder()
	srv.handleHealthz(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("POST status=%d, want 405", rec.Code)
	}
}

func TestHealthz_HMACChallengeSignsWithRawToken(t *testing.T) {
	t.Parallel()
	srv := newHealthzServer(t)
	_, raw, err := srv.tokens.Issue("https://beak.web", "test")
	if err != nil {
		t.Fatalf("Issue: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, wire.HealthzPath+"?nonce=ping-123", nil)
	req.Header.Set("Authorization", "Bearer "+raw)
	rec := httptest.NewRecorder()
	srv.handleHealthz(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d", rec.Code)
	}
	var got wire.HealthzResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if got.Nonce == nil || *got.Nonce != "ping-123" {
		t.Fatalf("nonce missing or mismatched: %+v", got.Nonce)
	}
	if got.Signature == nil {
		t.Fatal("signature missing")
	}
	// Verify the signature is HMAC-SHA256(rawToken, nonce) — base64url.
	mac := hmac.New(sha256.New, []byte(raw))
	mac.Write([]byte("ping-123"))
	want := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if *got.Signature != want {
		t.Fatalf("signature=%q, want %q", *got.Signature, want)
	}
}

func TestHealthz_NonceWithoutBearerNoSignature(t *testing.T) {
	t.Parallel()
	srv := newHealthzServer(t)

	req := httptest.NewRequest(http.MethodGet, wire.HealthzPath+"?nonce=abc", nil)
	rec := httptest.NewRecorder()
	srv.handleHealthz(rec, req)

	var got wire.HealthzResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &got)
	if got.Nonce != nil || got.Signature != nil {
		t.Fatalf("nonce-only requests must not return signature; got %+v", got)
	}
}

func TestHealthz_UnknownTokenNoSignature(t *testing.T) {
	t.Parallel()
	srv := newHealthzServer(t)

	req := httptest.NewRequest(http.MethodGet, wire.HealthzPath+"?nonce=abc", nil)
	req.Header.Set("Authorization", "Bearer never-issued-token")
	rec := httptest.NewRecorder()
	srv.handleHealthz(rec, req)

	var got wire.HealthzResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &got)
	if got.Signature != nil {
		t.Fatal("unknown bearer must NOT receive a signature (would enable token confirmation)")
	}
}
