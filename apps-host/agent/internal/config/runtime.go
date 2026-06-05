package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

// RuntimeState is the JSON shape written to runtime.json. The
// renderer never reads this — it's there for `beak-agent status` and
// crash diagnostics.
type RuntimeState struct {
	PID       int    `json:"pid"`
	Port      int    `json:"port"`
	Version   string `json:"version"`
	StartedAt string `json:"startedAt"`
}

const runtimeFilename = "runtime.json"

func WriteRuntime(port int, version string) error {
	dir, err := RuntimeDir()
	if err != nil {
		return err
	}
	state := RuntimeState{
		PID:       os.Getpid(),
		Port:      port,
		Version:   version,
		StartedAt: time.Now().UTC().Format(time.RFC3339),
	}
	bytes, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, runtimeFilename), bytes, 0o600)
}

func ClearRuntime() {
	dir, err := RuntimeDir()
	if err != nil {
		return
	}
	_ = os.Remove(filepath.Join(dir, runtimeFilename))
}
