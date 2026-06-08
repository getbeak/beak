package pairing

import (
	"testing"
	"time"
)

func TestApprovalQueue_AllowResolvesSubmitter(t *testing.T) {
	t.Parallel()
	q := NewApprovalQueue()

	resultCh := make(chan ApprovalDecision, 1)
	go func() {
		resultCh <- q.Submit(ApprovalRequest{State: "state-allow", Origin: "https://beak.web"}, time.Second)
	}()

	// Drain the listener channel so the tray's bookkeeping is realistic.
	select {
	case req := <-q.Listen():
		if req.State != "state-allow" {
			t.Fatalf("listener saw state=%q", req.State)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Submit should publish to the listener channel")
	}

	if !q.Approve("state-allow") {
		t.Fatal("Approve should report it resolved a pending request")
	}

	decision := <-resultCh
	if !decision.Allowed {
		t.Fatal("expected Allowed=true after Approve")
	}
}

func TestApprovalQueue_DenyResolvesSubmitter(t *testing.T) {
	t.Parallel()
	q := NewApprovalQueue()

	resultCh := make(chan ApprovalDecision, 1)
	go func() {
		resultCh <- q.Submit(ApprovalRequest{State: "state-deny"}, time.Second)
	}()
	<-q.Listen()

	if !q.Deny("state-deny") {
		t.Fatal("Deny should report it resolved a pending request")
	}
	decision := <-resultCh
	if decision.Allowed {
		t.Fatal("expected Allowed=false after Deny")
	}
}

func TestApprovalQueue_TimeoutDeniesAndCleansUp(t *testing.T) {
	t.Parallel()
	q := NewApprovalQueue()

	decision := q.Submit(ApprovalRequest{State: "state-timeout"}, 20*time.Millisecond)
	if decision.Allowed {
		t.Fatal("timeout must surface as Allowed=false")
	}

	// A late tray decision after timeout must not race-resolve a freed
	// channel. The map is cleared on defer, so Approve returns false.
	if q.Approve("state-timeout") {
		t.Fatal("Approve after timeout should report no pending request")
	}
}

func TestApprovalQueue_ApproveUnknownStateReturnsFalse(t *testing.T) {
	t.Parallel()
	q := NewApprovalQueue()
	if q.Approve("never-existed") {
		t.Fatal("Approve on unknown state should return false")
	}
	if q.Deny("never-existed") {
		t.Fatal("Deny on unknown state should return false")
	}
}
