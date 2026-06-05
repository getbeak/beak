package server

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/getbeak/beak/apps-host/agent/internal/pairing"
	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

// Server wires the agent's HTTP API onto a chosen loopback port.
type Server struct {
	tokens    *pairing.TokenStore
	pending   *pairing.PendingStore
	approvals *pairing.ApprovalQueue

	pendingInit pendingInitStore // /pair → /pair/decision continuation

	mu              sync.Mutex
	lastTouched     map[string]time.Time
	touchDebounceMs int

	httpServer *http.Server
	listener   net.Listener
}

type pendingInit struct {
	origin        string
	codeChallenge string
	returnURL     string
	expiresAt     time.Time
}

type pendingInitStore struct {
	mu      sync.Mutex
	entries map[string]pendingInit
}

func (p *pendingInitStore) Store(state string, entry pendingInit) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.entries == nil {
		p.entries = map[string]pendingInit{}
	}
	p.entries[state] = entry
}

func (p *pendingInitStore) Load(state string) (pendingInit, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	entry, ok := p.entries[state]
	return entry, ok
}

func (p *pendingInitStore) Delete(state string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.entries, state)
}

func New(tokens *pairing.TokenStore, approvals *pairing.ApprovalQueue) *Server {
	return &Server{
		tokens:          tokens,
		pending:         pairing.NewPendingStore(),
		approvals:       approvals,
		lastTouched:     map[string]time.Time{},
		touchDebounceMs: 1000,
	}
}

// ListenAndServe binds a port from the wire-contract range and starts
// the HTTP server. Returns the port that won the bind race.
func (s *Server) ListenAndServe(_ context.Context) (int, error) {
	port, listener, err := bindInRange()
	if err != nil {
		return 0, err
	}
	s.listener = listener

	mux := http.NewServeMux()
	mux.HandleFunc(wire.HealthzPath, s.handleHealthz)
	mux.HandleFunc(wire.PairPath, s.handlePair)
	mux.HandleFunc(wire.PairPath+"/decision", s.handlePairDecision)
	mux.HandleFunc(wire.PairTokenPath, s.handlePairToken)
	mux.HandleFunc(wire.FlightPath, s.handleFlight)

	s.httpServer = &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	go func() {
		if err := s.httpServer.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			fmt.Printf("[beak-agent] http server stopped: %v\n", err)
		}
	}()
	return port, nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.httpServer == nil {
		return nil
	}
	return s.httpServer.Shutdown(ctx)
}

// Approvals exposes the queue for the tray glue.
func (s *Server) Approvals() *pairing.ApprovalQueue {
	return s.approvals
}

// Tokens exposes the token store for the tray glue.
func (s *Server) Tokens() *pairing.TokenStore {
	return s.tokens
}

// SweepPending walks expired entries off the pairing store on a
// timer. Called from main.
func (s *Server) SweepPending() {
	s.pending.SweepExpired()
	s.pendingInit.mu.Lock()
	now := time.Now()
	for state, entry := range s.pendingInit.entries {
		if now.After(entry.expiresAt) {
			delete(s.pendingInit.entries, state)
		}
	}
	s.pendingInit.mu.Unlock()
}

func (s *Server) touchLastUsedDebounced(tokenID string) {
	now := time.Now()
	s.mu.Lock()
	last := s.lastTouched[tokenID]
	if now.Sub(last) < time.Duration(s.touchDebounceMs)*time.Millisecond {
		s.mu.Unlock()
		return
	}
	s.lastTouched[tokenID] = now
	s.mu.Unlock()
	s.tokens.TouchLastUsed(tokenID, now)
}

func bindInRange() (int, net.Listener, error) {
	for port := wire.PortRangeStart; port <= wire.PortRangeEnd; port++ {
		addr := fmt.Sprintf("127.0.0.1:%d", port)
		listener, err := net.Listen("tcp", addr)
		if err == nil {
			return port, listener, nil
		}
	}
	return 0, nil, fmt.Errorf("could not bind any port in %d..%d", wire.PortRangeStart, wire.PortRangeEnd)
}
