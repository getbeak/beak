package server

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func seedPending(t *testing.T, srv *Server, origin, code, verifier string) {
	t.Helper()
	srv.pending.Add(pairing.PendingPairing{
		Origin:        origin,
		State:         "state-" + code,
		CodeChallenge: pkceChallenge(verifier),
		Code:          code,
		ExpiresAt:     time.Now().Add(5 * time.Minute),
	})
}

func postPairToken(srv *Server, origin string, body wire.PairTokenRequest) *httptest.ResponseRecorder {
	raw, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, wire.PairTokenPath, strings.NewReader(string(raw)))
	req.Header.Set("Content-Type", "application/json")
	if origin != "" {
		req.Header.Set("Origin", origin)
	}
	rec := httptest.NewRecorder()
	srv.handlePairToken(rec, req)
	return rec
}

func TestPairToken_HappyPathReturnsTokenAndID(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	const origin = "https://beak.web"
	const verifier = "happy-verifier-xxxxxxxxxxxxxxxxxxxxxxxxxx"
	seedPending(t, srv, origin, "code-happy", verifier)

	rec := postPairToken(srv, origin, wire.PairTokenRequest{Code: "code-happy", CodeVerifier: verifier})
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var resp wire.PairTokenResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Token == "" || resp.TokenID == "" {
		t.Fatalf("expected token+tokenId, got %+v", resp)
	}
	// CORS headers should reflect the renderer origin (not "*") so the
	// browser actually exposes the response body.
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != origin {
		t.Fatalf("ACAO=%q, want %q", got, origin)
	}
}

func TestPairToken_OptionsPreflightAllowsRendererWithPending(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	// The preflight only sees CORS reflection when an origin already
	// has a live pending pair OR a paired token. Seed a pending so the
	// renderer can complete a fresh pairing.
	seedPending(t, srv, "https://beak.web", "preflight-code", "preflight-verifier-xxxxxxxxxxxxxxxxxxxxxxxxxx")
	req := httptest.NewRequest(http.MethodOptions, wire.PairTokenPath, nil)
	req.Header.Set("Origin", "https://beak.web")
	rec := httptest.NewRecorder()
	srv.handlePairToken(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("preflight status=%d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "https://beak.web" {
		t.Fatal("preflight must reflect Origin for an origin with a live pending pair")
	}
}

func TestPairToken_OptionsPreflightOmitsCORSForUnknownOrigin(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	// No pending entry, no paired token — the origin is a complete
	// stranger. Reflecting its Origin into ACAO would expose the
	// invalid_grant body as a code-existence oracle.
	req := httptest.NewRequest(http.MethodOptions, wire.PairTokenPath, nil)
	req.Header.Set("Origin", "https://attacker.example")
	rec := httptest.NewRecorder()
	srv.handlePairToken(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("preflight status=%d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected no ACAO for stranger origin, got %q", got)
	}
}

func TestPairToken_RejectsMalformedJSON(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	req := httptest.NewRequest(http.MethodPost, wire.PairTokenPath, strings.NewReader("{ not json"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.handlePairToken(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status=%d", rec.Code)
	}
	var err wire.PairErrorResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &err)
	if err.Error != "invalid_request" {
		t.Fatalf("error code=%q, want invalid_request", err.Error)
	}
}

func TestPairToken_RejectsMissingCodeOrVerifier(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)

	for _, body := range []wire.PairTokenRequest{
		{CodeVerifier: "v"},
		{Code: "c"},
		{},
	} {
		rec := postPairToken(srv, "", body)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("missing-field status=%d for %+v", rec.Code, body)
		}
	}
}

func TestPairToken_RejectsUnknownCodeAsInvalidGrant(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)

	rec := postPairToken(srv, "", wire.PairTokenRequest{Code: "never-existed", CodeVerifier: "any"})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var err wire.PairErrorResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &err)
	if err.Error != "invalid_grant" {
		t.Fatalf("error code=%q, want invalid_grant", err.Error)
	}
}

func TestPairToken_RejectsWrongVerifierAsInvalidGrant(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	seedPending(t, srv, "https://beak.web", "code-bad", "the-correct-verifier-xxxxxxxxxxxxxxxxxxxx")

	rec := postPairToken(srv, "", wire.PairTokenRequest{Code: "code-bad", CodeVerifier: "wrong"})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status=%d", rec.Code)
	}
	var err wire.PairErrorResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &err)
	if err.Error != "invalid_grant" {
		t.Fatalf("error code=%q, want invalid_grant", err.Error)
	}
}

func TestPairToken_RejectsOriginMismatch(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	const verifier = "origin-test-verifier-xxxxxxxxxxxxxxxxxxx"
	seedPending(t, srv, "https://beak.web", "code-origin", verifier)

	// Caller presents Origin: evil.example but the pending was bound
	// to beak.web. Must be invalid_request (origin mismatch), not a
	// successful issue.
	rec := postPairToken(srv, "https://evil.example", wire.PairTokenRequest{
		Code:         "code-origin",
		CodeVerifier: verifier,
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var err wire.PairErrorResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &err)
	if err.Error != "invalid_request" {
		t.Fatalf("error code=%q, want invalid_request", err.Error)
	}
	if !strings.Contains(err.ErrorDescription, "origin") {
		t.Fatalf("description should mention origin: %q", err.ErrorDescription)
	}
}

func TestPairToken_CodeIsSingleUse(t *testing.T) {
	t.Parallel()
	srv, _ := newTestServer(t)
	const verifier = "single-use-verifier-xxxxxxxxxxxxxxxxxxxxx"
	seedPending(t, srv, "https://beak.web", "code-once", verifier)

	first := postPairToken(srv, "https://beak.web", wire.PairTokenRequest{
		Code:         "code-once",
		CodeVerifier: verifier,
	})
	if first.Code != http.StatusOK {
		t.Fatalf("first attempt status=%d", first.Code)
	}

	second := postPairToken(srv, "https://beak.web", wire.PairTokenRequest{
		Code:         "code-once",
		CodeVerifier: verifier,
	})
	if second.Code != http.StatusBadRequest {
		t.Fatalf("second attempt status=%d (codes must be single-use)", second.Code)
	}
}

func TestValidatePairInit_AcceptsCanonicalRequest(t *testing.T) {
	t.Parallel()
	err := validatePairInit(
		"https://beak.web", "state-1", "challenge", "S256",
		"https://beak.web/callback", "https://beak.web",
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestValidatePairInit_FieldCoverage(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name   string
		origin string
		state  string
		ch     string
		method string
		ret    string
		hdr    string
		want   string
	}{
		{"no origin", "", "s", "c", "S256", "https://x/cb", "", "origin"},
		{"no state", "https://x", "", "c", "S256", "https://x/cb", "", "state"},
		{"no challenge", "https://x", "s", "", "S256", "https://x/cb", "", "challenge"},
		{"unsupported method", "https://x", "s", "c", "plain", "https://x/cb", "", "method"},
		{"no return", "https://x", "s", "c", "S256", "", "", "return"},
		{"origin header mismatch", "https://x", "s", "c", "S256", "https://x/cb", "https://evil", "Origin"},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			err := validatePairInit(tc.origin, tc.state, tc.ch, tc.method, tc.ret, tc.hdr)
			if err == nil {
				t.Fatal("expected validation error")
			}
			if !strings.Contains(strings.ToLower(err.Error()), strings.ToLower(tc.want)) {
				t.Fatalf("error %q should mention %q", err.Error(), tc.want)
			}
		})
	}
}
