package server

import (
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
	// Hold the first port in the range; bindInRange must return a
	// later one rather than failing.
	hold, err := net.Listen("tcp", "127.0.0.1:0") // not in range, but proves we can bind freely
	if err != nil {
		t.Skipf("cannot bind a placeholder port: %v", err)
	}
	defer hold.Close()

	first, ln1, err := bindInRange()
	if err != nil {
		t.Fatalf("first bind: %v", err)
	}
	defer ln1.Close()

	// Take a second slot — proves the loop advances past held ports.
	second, ln2, err := bindInRange()
	if err != nil {
		t.Fatalf("second bind: %v", err)
	}
	defer ln2.Close()

	if first == second {
		t.Fatalf("bindInRange returned the same port twice: %d", first)
	}
	if first < wire.PortRangeStart || second > wire.PortRangeEnd {
		t.Fatalf("ports out of range: first=%d second=%d", first, second)
	}
}
