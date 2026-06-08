package server

import (
	"net/http"
	"net/url"
	"strings"
)

// healthzOriginAllowed reports whether the requesting Origin may read
// the healthz response. The healthz endpoint must work pre-pairing
// (the renderer doesn't yet know the agent will accept it), so we
// can't gate on the paired-origins map — but we don't want arbitrary
// pages on the internet fingerprinting the agent + version + supports
// fields either. The compromise is a small allowlist of Beak-owned
// and developer-local origins.
//
// Empty Origin (same-origin requests, native, curl, etc.) is allowed
// — browsers don't send an Origin header for those.
func healthzOriginAllowed(origin string) bool {
	if origin == "" {
		return true
	}
	// Beak's production web shell.
	if origin == "https://beak.web" {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}
	host := parsed.Hostname()
	// Dev shells (vite, electron renderer in dev, beak.web local mirror).
	// Match by hostname, not URL — ports vary across dev configurations.
	if host == "localhost" || host == "127.0.0.1" || strings.HasSuffix(host, ".localhost") {
		return true
	}
	return false
}

// applyHealthzCORS sets CORS headers on the discovery endpoint. The
// renderer's Origin must be on the discovery allowlist (Beak's own
// origins + developer-local). Browsers will block other pages from
// reading the response — the agent's existence + fingerprint can't
// be enumerated by an arbitrary drive-by page.
//
// Returns false if the origin is rejected; the caller should still
// serve the response body (no point pretending the agent isn't
// listening — TCP RST already gives that away), but the browser will
// hide it from the calling JS.
func applyHealthzCORS(w http.ResponseWriter, origin string) bool {
	if !healthzOriginAllowed(origin) {
		// Deliberately don't set ACAO. Browsers block the JS read; the
		// server response still flows.
		return false
	}
	h := w.Header()
	if origin == "" {
		h.Set("Access-Control-Allow-Origin", "*")
	} else {
		h.Set("Access-Control-Allow-Origin", origin)
		h.Set("Vary", "Origin")
	}
	h.Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	h.Set("Access-Control-Max-Age", "86400")
	return true
}

// applyAuthenticatedCORS reflects the Origin only when it's a paired
// origin. Browsers reject any other case as a CORS failure.
func applyAuthenticatedCORS(w http.ResponseWriter, origin string, pairedOrigins map[string]struct{}) bool {
	if origin == "" {
		return false
	}
	if _, ok := pairedOrigins[origin]; !ok {
		return false
	}
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", origin)
	h.Set("Access-Control-Allow-Credentials", "true")
	h.Set("Vary", "Origin")
	h.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	h.Set("Access-Control-Max-Age", "86400")
	return true
}
