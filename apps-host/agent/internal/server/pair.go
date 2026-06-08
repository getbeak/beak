package server

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

func (s *Server) handlePair(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query()
	origin := query.Get("origin")
	state := query.Get("state")
	codeChallenge := query.Get("code_challenge")
	method := query.Get("code_challenge_method")
	returnRaw := query.Get("return")

	if err := validatePairInit(origin, state, codeChallenge, method, returnRaw, r.Header.Get("Origin")); err != nil {
		http.Error(w, "invalid pair request: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Build the post-action target — the approval form posts back to
	// this URL with `?state=...` and `decision=allow|deny`.
	actionPath := wire.PairPath + "/decision"

	html := strings.ReplaceAll(approvalHTML, "{{Origin}}", htmlEscape(origin))
	html = strings.ReplaceAll(html, "{{ActionPath}}", htmlEscape(actionPath))
	html = strings.ReplaceAll(html, "{{State}}", htmlEscape(state))

	// Stash the pending request before we render — once the user clicks
	// Allow on /pair/decision we look it up by state.
	s.pendingInit.Store(state, pendingInit{
		origin:        origin,
		codeChallenge: codeChallenge,
		returnURL:     returnRaw,
		expiresAt:     time.Now().Add(pairing.PendingTTL),
	})

	// Tell the tray something is waiting.
	s.approvals.Submit(pairing.ApprovalRequest{State: state, Origin: origin}, 100*time.Millisecond)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write([]byte(html))
}

// handlePairDecision receives the form POST from the approval page.
// Translates the user's choice into an approval/deny on the queue
// and redirects to the renderer.
func (s *Server) handlePairDecision(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// The state nonce stops a drive-by page replaying a known state,
	// but it doesn't stop a malicious page that has *somehow* learned
	// the state from POSTing the user's decision. Require the request
	// to look like it came from the agent's own pair HTML page: either
	// no Origin (form posts may omit it depending on the browser /
	// referrer-policy) or the agent's own loopback origin. Also reject
	// any Sec-Fetch-Site that admits a cross-site origin outright.
	if !originAllowedForDecision(r, s.LoopbackOrigin()) {
		http.Error(w, "origin not allowed", http.StatusForbidden)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	state := r.URL.Query().Get("state")
	if state == "" {
		http.Error(w, "missing state", http.StatusBadRequest)
		return
	}
	decision := r.PostFormValue("decision")

	pi, ok := s.pendingInit.Load(state)
	if !ok {
		http.Error(w, "no pending pairing for state", http.StatusGone)
		return
	}
	s.pendingInit.Delete(state)

	if time.Now().After(pi.expiresAt) {
		http.Redirect(w, r, errorRedirect(pi.returnURL, state, "invalid_request"), http.StatusSeeOther)
		return
	}

	if decision != "allow" {
		http.Redirect(w, r, errorRedirect(pi.returnURL, state, "access_denied"), http.StatusSeeOther)
		return
	}

	code, err := generateRandomToken(24)
	if err != nil {
		http.Error(w, "internal error generating code", http.StatusInternalServerError)
		return
	}
	s.pending.Add(pairing.PendingPairing{
		Origin:        pi.origin,
		State:         state,
		CodeChallenge: pi.codeChallenge,
		Code:          code,
		ExpiresAt:     time.Now().Add(pairing.PendingTTL),
	})

	redirect := okRedirect(pi.returnURL, state, code)
	http.Redirect(w, r, redirect, http.StatusSeeOther)
}

func (s *Server) handlePairToken(w http.ResponseWriter, r *http.Request) {
	// /pair/token is renderer→agent, browser-fetched. Reflect the
	// requesting origin only if it's already paired OR is a fresh
	// pairing target — but during pairing we don't yet have a token.
	// TODO: tighten Origin policy — currently reflects any caller; should
	// match the pending pairing's Origin pre-token-issue, or the renderer
	// allowlist post-issue. Tracked separately from the /pair/decision
	// fix to keep that change small.
	origin := r.Header.Get("Origin")
	if origin != "" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body wire.PairTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writePairError(w, http.StatusBadRequest, "invalid_request", "malformed json")
		return
	}
	if body.Code == "" || body.CodeVerifier == "" {
		writePairError(w, http.StatusBadRequest, "invalid_request", "missing code or code_verifier")
		return
	}

	pending, err := s.pending.Consume(body.Code, body.CodeVerifier)
	if err != nil {
		writePairError(w, http.StatusBadRequest, "invalid_grant", err.Error())
		return
	}

	if origin != "" && origin != pending.Origin {
		writePairError(w, http.StatusBadRequest, "invalid_request", "origin mismatch")
		return
	}

	record, raw, err := s.tokens.Issue(pending.Origin, "Beak (web)")
	if err != nil {
		writePairError(w, http.StatusInternalServerError, "invalid_request", err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(wire.PairTokenResponse{Token: raw, TokenID: record.TokenID})
}

func validatePairInit(origin, state, codeChallenge, method, returnRaw, headerOrigin string) error {
	if origin == "" {
		return errors.New("missing origin")
	}
	if state == "" {
		return errors.New("missing state")
	}
	if codeChallenge == "" {
		return errors.New("missing code_challenge")
	}
	if method != "S256" {
		return errors.New("unsupported code_challenge_method")
	}
	if returnRaw == "" {
		return errors.New("missing return")
	}
	if _, err := url.Parse(returnRaw); err != nil {
		return errors.New("invalid return url")
	}
	if headerOrigin != "" && headerOrigin != origin {
		return errors.New("Origin header mismatch")
	}
	return nil
}

func okRedirect(returnRaw, state, code string) string {
	u, _ := url.Parse(returnRaw)
	q := u.Query()
	q.Set("state", state)
	q.Set("code", code)
	u.RawQuery = q.Encode()
	return u.String()
}

func errorRedirect(returnRaw, state, errCode string) string {
	u, _ := url.Parse(returnRaw)
	q := u.Query()
	q.Set("state", state)
	q.Set("error", errCode)
	u.RawQuery = q.Encode()
	return u.String()
}

func writePairError(w http.ResponseWriter, status int, code, description string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(wire.PairErrorResponse{Error: code, ErrorDescription: description})
}

func generateRandomToken(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func htmlEscape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", "\"", "&quot;", "'", "&#39;")
	return r.Replace(s)
}

// originAllowedForDecision enforces the rule documented on
// handlePairDecision: Origin must be unset OR match the agent's own
// loopback origin, and Sec-Fetch-Site must not announce a cross-site
// caller. Returning false means the request is treated as 403.
func originAllowedForDecision(r *http.Request, loopback string) bool {
	switch strings.ToLower(r.Header.Get("Sec-Fetch-Site")) {
	case "cross-site", "cross-origin":
		return false
	}
	origin := r.Header.Get("Origin")
	if origin == "" || strings.EqualFold(origin, "null") {
		// Some browsers omit Origin on same-origin form POSTs, or set
		// it to "null" when the page was opened via file:// or with a
		// no-referrer policy. Neither is a cross-site signal on its own.
		return true
	}
	if loopback == "" {
		// Defensive: if we don't know our own URL, the only safe answer
		// for an explicitly-set Origin is to reject. Runtime always knows
		// its own port; tests stub LoopbackOrigin via overrideLoopback.
		return false
	}
	return strings.EqualFold(origin, loopback)
}
