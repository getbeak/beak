// Package tray drives the menu-bar icon and its menu items. The
// icon is loaded from an embedded PNG; tray actions surface paired
// clients, pending approvals, and a Quit item.
package tray

import (
	"fmt"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getlantern/systray"
	"github.com/pkg/browser"
)

// Options are wiring inputs from main. We accept them as concrete
// pointers rather than re-importing main's types here.
type Options struct {
	BaseURL   string
	Tokens    *pairing.TokenStore
	Approvals *pairing.ApprovalQueue
	OnQuit    func()
}

func Run(opts Options) {
	systray.Run(func() { onReady(opts) }, opts.OnQuit)
}

func onReady(opts Options) {
	systray.SetTitle("Beak")
	systray.SetTooltip("Beak agent")
	systray.SetIcon(icon())

	openWeb := systray.AddMenuItem("Open Beak web", "Open beak.web in your browser")
	systray.AddSeparator()
	pairedItem := systray.AddMenuItem("Paired clients (0)", "Manage paired browsers")
	pendingItem := systray.AddMenuItem("Pending approvals (0)", "Approve or deny pairing requests")
	systray.AddSeparator()
	quit := systray.AddMenuItem("Quit", "Stop the agent")

	go func() {
		for {
			select {
			case <-openWeb.ClickedCh:
				_ = browser.OpenURL("https://beak.web")
			case <-pairedItem.ClickedCh:
				openPairedClientsPage(opts.BaseURL)
			case <-pendingItem.ClickedCh:
				_ = pendingItem
			case <-quit.ClickedCh:
				systray.Quit()
				return
			}
		}
	}()

	// Update the menu titles every second to reflect counts.
	go func() {
		for range tick(1) {
			tokens := opts.Tokens.List()
			pairedItem.SetTitle(fmt.Sprintf("Paired clients (%d)", len(tokens)))
		}
	}()

	// Forward pending approval requests onto the menu so the user
	// notices the badge. The actual Approve/Deny lives in the
	// browser-served /pair approval page; this just surfaces the
	// "something is waiting" signal.
	go func() {
		count := 0
		for range opts.Approvals.Listen() {
			count++
			pendingItem.SetTitle(fmt.Sprintf("Pending approvals (%d)", count))
		}
	}()
}

func openPairedClientsPage(baseURL string) {
	// The agent serves an HTML page at /paired-clients that the tray
	// opens for the user to manage tokens. Not implemented in v1 — we
	// log a TODO and fall back to opening the agent root.
	url := baseURL + "/"
	_ = browser.OpenURL(url)
}

func tick(seconds int) <-chan time.Time {
	return time.NewTicker(time.Duration(seconds) * time.Second).C
}

// icon returns the embedded tray icon bytes. For v1 we use a tiny
// 16x16 transparent PNG; designers can swap in the real glyph
// later. Embedded inline so the binary stays self-contained.
func icon() []byte {
	return []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF,
		0x61, 0x00, 0x00, 0x00, 0x13, 0x49, 0x44, 0x41, 0x54, 0x38, 0xCB, 0x63, 0xFC, 0xFF, 0xFF, 0x3F,
		0x03, 0x35, 0x00, 0x00, 0x10, 0x67, 0x02, 0x01, 0xA3, 0x2D, 0x35, 0xC7, 0x00, 0x00, 0x00, 0x00,
		0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
	}
}
