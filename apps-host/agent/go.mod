module github.com/getbeak/beak/apps-host/agent

// Pinned to a 1.25.x release that contains the fixes for the stdlib
// advisories surfaced by govulncheck on 1.24/1.25 pre-patch builds —
// notably GO-2026-4870 (crypto/tls KeyUpdate DoS), GO-2026-4918
// (HTTP/2 SETTINGS_MAX_FRAME_SIZE infinite loop), and several
// html/template escaper bugs. Bump deliberately, not opportunistically.
go 1.25.11

require (
	github.com/getlantern/systray v1.2.2
	github.com/gofrs/flock v0.13.0
	github.com/pkg/browser v0.0.0-20240102092130-5ac0b6a4141c
)

require (
	github.com/getlantern/context v0.0.0-20190109183933-c447772a6520 // indirect
	github.com/getlantern/errors v0.0.0-20190325191628-abdb3e3e36f7 // indirect
	github.com/getlantern/golog v0.0.0-20190830074920-4ef2e798c2d7 // indirect
	github.com/getlantern/hex v0.0.0-20190417191902-c6586a6fe0b7 // indirect
	github.com/getlantern/hidden v0.0.0-20190325191715-f02dbb02be55 // indirect
	github.com/getlantern/ops v0.0.0-20190325191751-d70cb0d6f85f // indirect
	github.com/go-stack/stack v1.8.0 // indirect
	github.com/oxtoacart/bpool v0.0.0-20190530202638-03653db5a59c // indirect
	golang.org/x/sys v0.37.0 // indirect
)
