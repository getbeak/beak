package server

import (
	"net/http/httptest"
	"testing"
)

func TestHealthzOriginAllowed(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name   string
		origin string
		want   bool
	}{
		{"empty origin (no-CORS, curl, native)", "", true},
		{"production beak.web", "https://beak.web", true},
		{"localhost dev shell", "http://localhost:5173", true},
		{"localhost https", "https://localhost:8080", true},
		{"127.0.0.1 dev shell", "http://127.0.0.1:5173", true},
		{"subdomain of .localhost", "http://shell.localhost:5173", true},
		{"random https origin", "https://evil.com", false},
		{"http production", "http://beak.web", false},
		{"subdomain spoof", "https://beak.web.evil.com", false},
		{"www subdomain", "https://www.beak.web", false},
		{"data URL", "data:text/html,foo", false},
		{"file URL", "file:///etc/passwd", false},
		{"malformed URL", "://broken", false},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := healthzOriginAllowed(tc.origin)
			if got != tc.want {
				t.Fatalf("healthzOriginAllowed(%q) = %v, want %v", tc.origin, got, tc.want)
			}
		})
	}
}

func TestApplyHealthzCORS_AllowedOrigin(t *testing.T) {
	t.Parallel()
	w := httptest.NewRecorder()
	ok := applyHealthzCORS(w, "https://beak.web")
	if !ok {
		t.Fatal("expected allowed origin to return true")
	}
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://beak.web" {
		t.Fatalf("ACAO = %q, want https://beak.web", got)
	}
	if got := w.Header().Get("Vary"); got != "Origin" {
		t.Fatalf("Vary = %q, want Origin", got)
	}
}

func TestApplyHealthzCORS_RejectedOrigin(t *testing.T) {
	t.Parallel()
	w := httptest.NewRecorder()
	ok := applyHealthzCORS(w, "https://evil.com")
	if ok {
		t.Fatal("expected disallowed origin to return false")
	}
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("ACAO = %q, want empty (no CORS headers set)", got)
	}
}

func TestApplyHealthzCORS_EmptyOrigin(t *testing.T) {
	t.Parallel()
	w := httptest.NewRecorder()
	ok := applyHealthzCORS(w, "")
	if !ok {
		t.Fatal("expected empty origin (same-origin / native) to return true")
	}
	// Empty origin gets ACAO:* — there's no Origin to reflect.
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("ACAO = %q, want *", got)
	}
}
