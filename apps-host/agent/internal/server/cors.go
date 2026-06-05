package server

import "net/http"

// applyHealthzCORS sets the open CORS headers used by the discovery
// endpoint. Discovery must work pre-pairing, so we can't restrict
// origin here.
func applyHealthzCORS(w http.ResponseWriter) {
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", "*")
	h.Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	h.Set("Access-Control-Max-Age", "86400")
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
