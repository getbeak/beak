// Command beak-agent runs the local agent menu-bar process. See
// docs/adr/0001-local-agent-for-web-host.md.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/config"
	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getbeak/beak/apps-host/agent/internal/server"
	"github.com/getbeak/beak/apps-host/agent/internal/tray"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

var noTray = flag.Bool("no-tray", false, "Skip the menu-bar tray. The HTTP server still runs — used by the integration test harness so it doesn't need a display.")

func main() {
	flag.Parse()
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "beak-agent: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	lock, running, err := config.AcquireSingletonLock()
	if err != nil {
		return fmt.Errorf("acquire singleton lock: %w", err)
	}
	if lock == nil {
		// Another agent already holds the lock. The user's intent
		// ("have an agent running") is satisfied — exit 0 so any
		// launchd/systemd supervisor doesn't loop us.
		describeRunningInstance(running)
		return nil
	}
	defer lock.Release()

	tokens, err := pairing.OpenTokenStore()
	if err != nil {
		return fmt.Errorf("open token store: %w", err)
	}

	approvals := pairing.NewApprovalQueue()
	srv := server.New(tokens, approvals)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	port, err := srv.ListenAndServe(ctx)
	if err != nil {
		return fmt.Errorf("listen: %w", err)
	}
	if err := lock.SetMetadata(port, wire.AgentSemver); err != nil {
		fmt.Fprintf(os.Stderr, "beak-agent: warn: could not update lock metadata: %v\n", err)
	}
	if err := config.WriteRuntime(port, wire.AgentSemver); err != nil {
		fmt.Fprintf(os.Stderr, "beak-agent: warn: could not write runtime.json: %v\n", err)
	}
	defer config.ClearRuntime()

	fmt.Printf("[beak-agent] listening on http://127.0.0.1:%d\n", port)

	// Sweep expired pending pairings every minute.
	go func() {
		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				srv.SweepPending()
			case <-ctx.Done():
				return
			}
		}
	}()

	// OS signals: gracefully shut down on Ctrl-C / SIGTERM.
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		shutdown(srv)
		cancel()
	}()

	if *noTray {
		// Drain the approvals channel so handlePair doesn't stall after
		// the first eight pending pairings (listener channel has cap 8).
		// In production the tray goroutine consumes them.
		go func() {
			for range approvals.Listen() {
				// discard — caller drives approvals via /pair/decision directly.
			}
		}()
		<-ctx.Done()
		return nil
	}

	tray.Run(tray.Options{
		BaseURL:   fmt.Sprintf("http://127.0.0.1:%d", port),
		Tokens:    tokens,
		Approvals: approvals,
		OnQuit: func() {
			shutdown(srv)
			cancel()
		},
	})

	return nil
}

func shutdown(srv *server.Server) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

func describeRunningInstance(running *config.RunningInstance) {
	if running == nil || running.PID == 0 {
		fmt.Fprintln(os.Stderr, "beak-agent: already running; check the menu-bar tray. Exiting.")
		return
	}
	url := ""
	if running.Port != 0 {
		url = fmt.Sprintf(" on http://127.0.0.1:%d", running.Port)
	}
	fmt.Fprintf(os.Stderr,
		"beak-agent: already running (PID %d, version %s, started %s%s); check the menu-bar tray. Exiting.\n",
		running.PID, running.Version, running.StartedAt.Format(time.RFC3339), url,
	)
}
