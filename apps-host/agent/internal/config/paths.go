// Package config resolves OS-appropriate config + runtime directories.
package config

import (
	"os"
	"path/filepath"
	"runtime"
)

// ConfigDir returns the per-user directory the agent uses for tokens.json
// and similar long-lived state. Created on first use.
//
//	macOS:   ~/Library/Application Support/beak-agent
//	Linux:   $XDG_CONFIG_HOME/beak-agent  (default ~/.config/beak-agent)
//	Windows: %APPDATA%/beak-agent
func ConfigDir() (string, error) {
	dir, err := osConfigDir()
	if err != nil {
		return "", err
	}
	full := filepath.Join(dir, "beak-agent")
	if err := os.MkdirAll(full, 0o700); err != nil {
		return "", err
	}
	return full, nil
}

// RuntimeDir returns the per-user directory the agent uses for the
// runtime-state file. On Linux this prefers $XDG_RUNTIME_DIR so the
// file is in tmpfs and survives a reboot cleanly; on mac/windows it
// matches ConfigDir.
func RuntimeDir() (string, error) {
	if runtime.GOOS == "linux" {
		if xdg := os.Getenv("XDG_RUNTIME_DIR"); xdg != "" {
			full := filepath.Join(xdg, "beak-agent")
			if err := os.MkdirAll(full, 0o700); err == nil {
				return full, nil
			}
		}
	}
	return ConfigDir()
}

func osConfigDir() (string, error) {
	if dir, err := os.UserConfigDir(); err == nil {
		return dir, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config"), nil
}
