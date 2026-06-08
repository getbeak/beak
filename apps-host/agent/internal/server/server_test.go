package server

import (
	"fmt"
	"net"
	"testing"

	"github.com/getbeak/beak/apps-host/agent/internal/wire"
)

func TestBindInRange_ReturnsListenerOnFreshHost(t *testing.T) {
	port, ln, err := bindInRange()
	if err != nil {
		t.Fatalf("bindInRange: %v", err)
	}
	defer ln.Close()

	if port < wire.PortRangeStart || port > wire.PortRangeEnd {
		t.Fatalf("port %d outside %d..%d", port, wire.PortRangeStart, wire.PortRangeEnd)
	}
	addr, ok := ln.Addr().(*net.TCPAddr)
	if !ok {
		t.Fatalf("expected *net.TCPAddr, got %T", ln.Addr())
	}
	if addr.Port != port {
		t.Fatalf("listener port=%d, returned port=%d (should match)", addr.Port, port)
	}
	if !addr.IP.IsLoopback() {
		t.Fatalf("listener bound non-loopback %v — must be 127.0.0.1", addr.IP)
	}
}

func TestBindInRange_SkipsHeldPorts(t *testing.T) {
	// Take the first port in the range so bindInRange has to walk past it.
	// If port 47821 is already held by an unrelated process on this box we
	// can't prove the walk; skip in that case rather than test the wrong
	// thing.
	held, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", wire.PortRangeStart))
	if err != nil {
		t.Skipf("cannot seed held port %d: %v", wire.PortRangeStart, err)
	}
	defer held.Close()

	port, ln, err := bindInRange()
	if err != nil {
		t.Fatalf("bindInRange: %v", err)
	}
	defer ln.Close()

	if port == wire.PortRangeStart {
		t.Fatalf("bindInRange should have skipped the held port %d", wire.PortRangeStart)
	}
	if port < wire.PortRangeStart || port > wire.PortRangeEnd {
		t.Fatalf("port %d outside %d..%d", port, wire.PortRangeStart, wire.PortRangeEnd)
	}
}
