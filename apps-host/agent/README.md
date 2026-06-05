# @beak/apps-host-agent

Cross-platform local agent that lets the Beak **web host** fire HTTP
requests outside the browser sandbox. See
[`docs/adr/0001-local-agent-for-web-host.md`](../../docs/adr/0001-local-agent-for-web-host.md).

This is a Go module, sibling to the pnpm workspaces. pnpm does not
manage it; CI builds it with `go build ./...` from this directory.

## Build

```bash
cd apps-host/agent
go build -o ./bin/beak-agent ./cmd/beak-agent
./bin/beak-agent
```

Cross-compile per the matrix in the ADR:

```bash
GOOS=darwin  GOARCH=arm64 go build -o ./bin/beak-agent-darwin-arm64  ./cmd/beak-agent
GOOS=darwin  GOARCH=amd64 go build -o ./bin/beak-agent-darwin-amd64  ./cmd/beak-agent
GOOS=windows GOARCH=amd64 go build -o ./bin/beak-agent-windows-amd64.exe ./cmd/beak-agent
GOOS=windows GOARCH=arm64 go build -o ./bin/beak-agent-windows-arm64.exe ./cmd/beak-agent
GOOS=linux   GOARCH=amd64 go build -o ./bin/beak-agent-linux-amd64   ./cmd/beak-agent
GOOS=linux   GOARCH=arm64 go build -o ./bin/beak-agent-linux-arm64   ./cmd/beak-agent
```

## Layout

```
cmd/beak-agent/         main package + tray entry
internal/
  server/               HTTP server, route handlers, CORS
  pairing/              PKCE state, token store (tokens.json)
  requester/            HTTP client + body classification + SSE parsing
  tray/                 systray glue (mac/win/linux)
  config/               OS-appropriate config paths, runtime.json
  wire/                 hand-written structs mirroring packages/common/src/wire/agent
```

## Wire contract

The structs in `internal/wire/wire.go` mirror the Zod schemas at
[`packages/common/src/wire/agent/`](../../packages/common/src/wire/agent/).
Any change there needs a matching edit here. A `pnpm wire-gen` codegen
pipeline is planned (ADR Decision §2) but not wired yet; until then,
drift is by convention.
