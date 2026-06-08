package server

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
)

func newTestServer(t *testing.T) (*Server, string) {
	t.Helper()
	// We don't actually bind a port — handlePairDecision only cares
	// about LoopbackOrigin(), which we stub via overrideLoopback.
	tokens, err := pairing.OpenTokenStoreAt(filepath.Join(t.TempDir(), "tokens.json"))
	if err != nil {
		t.Fatalf("OpenTokenStoreAt: %v", err)
	}
	srv := &Server{
		tokens:          tokens,
		pending:         pairing.NewPendingStore(),
		approvals:       pairing.NewApprovalQueue(),
		lastTouched:     map[string]time.Time{},
		touchDebounceMs: 1000,
	}
	const loopback = "http://127.0.0.1:47821"
	srv.overrideLoopback = loopback
	return srv, loopback
}

// seedPendingInit stages a valid pendingInit so the handler reaches the
// decision branch — otherwise it would short-circuit on "no pending
// pairing for state" and we'd never test the Origin gate.
func seedPendingInit(srv *Server, state string) {
	srv.pendingInit.Store(state, pendingInit{
		origin:        "https://renderer.example",
		codeChallenge: "test-challenge",
		returnURL:     "https://renderer.example/callback",
		expiresAt:     time.Now().Add(5 * time.Minute),
	})
}

func postDecision(srv *Server, state, origin, secFetchSite string) *httptest.ResponseRecorder {
	form := url.Values{"decision": {"allow"}}
	req := httptest.NewRequest(http.MethodPost, "/pair/decision?state="+state, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if origin != "" {
		req.Header.Set("Origin", origin)
	}
	if secFetchSite != "" {
		req.Header.Set("Sec-Fetch-Site", secFetchSite)
	}
	rec := httptest.NewRecorder()
	srv.handlePairDecision(rec, req)
	return rec
}

func TestHandlePairDecision_RejectsCrossOriginPOST(t *testing.T) {
	srv, _ := newTestServer(t)
	seedPendingInit(srv, "state-evil")

	rec := postDecision(srv, "state-evil", "https://evil.example", "")
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for cross-origin POST, got %d (body=%q)", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "origin not allowed") {
		t.Fatalf("expected body to say 'origin not allowed', got %q", rec.Body.String())
	}
}

func TestHandlePairDecision_RejectsSecFetchSiteCrossSite(t *testing.T) {
	srv, _ := newTestServer(t)
	seedPendingInit(srv, "state-cross")

	rec := postDecision(srv, "state-cross", "", "cross-site")
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for Sec-Fetch-Site=cross-site, got %d", rec.Code)
	}
}

func TestHandlePairDecision_AcceptsOwnLoopbackOrigin(t *testing.T) {
	srv, loopback := newTestServer(t)
	seedPendingInit(srv, "state-good")

	rec := postDecision(srv, "state-good", loopback, "same-origin")
	if rec.Code != http.StatusSeeOther {
		t.Fatalf("expected 303 redirect on allow, got %d (body=%q)", rec.Code, rec.Body.String())
	}
	if loc := rec.Header().Get("Location"); !strings.Contains(loc, "code=") {
		t.Fatalf("expected redirect to include code param, got %q", loc)
	}
}

func TestHandlePairDecision_AcceptsMissingOrigin(t *testing.T) {
	srv, _ := newTestServer(t)
	seedPendingInit(srv, "state-bare")

	// Some browsers omit Origin on same-origin form POSTs. The handler
	// should treat absent Origin as benign.
	rec := postDecision(srv, "state-bare", "", "")
	if rec.Code != http.StatusSeeOther {
		t.Fatalf("expected 303 redirect with no Origin header, got %d", rec.Code)
	}
}

func TestHandlePairDecision_AcceptsNullOrigin(t *testing.T) {
	srv, _ := newTestServer(t)
	seedPendingInit(srv, "state-null")

	// "Origin: null" is what some browsers send for opaque origins or
	// strict referrer policies. Not a cross-site signal on its own.
	rec := postDecision(srv, "state-null", "null", "")
	if rec.Code != http.StatusSeeOther {
		t.Fatalf("expected 303 redirect with null Origin, got %d", rec.Code)
	}
}
