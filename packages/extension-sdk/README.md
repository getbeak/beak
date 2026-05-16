# `@getbeak/extension-sdk`

Public SDK for authoring [Beak](https://getbeak.app) extensions. Extensions are
npm packages that contribute one or more **variables** (timestamps, decoders,
mock data generators, signing helpers, etc.) to a Beak project.

## Authoring an extension

```ts
import { defineExtension, defineVariable } from '@getbeak/extension-sdk';

export default defineExtension({
  variables: [
    defineVariable<{ format: 'unix' | 'iso' }>({
      id: 'timestamp',
      name: 'Timestamp',
      description: 'Current time in the chosen format.',
      createDefaultPayload: () => ({ format: 'unix' }),
      getValue: (_extCtx, _varCtx, payload) =>
        payload.format === 'iso'
          ? new Date().toISOString()
          : String(Math.floor(Date.now() / 1000)),
    }),
  ],
});
```

## Publishing

Your `package.json` must declare `"beak": { "apiVersion": 1 }`, point `main`
at a **pre-bundled** script (e.g. via `esbuild --bundle --platform=node
--format=cjs`), and then `npm publish` like any other package. Beak fetches
straight from the npm registry — your users do not need Node, yarn, or
pnpm installed.

```jsonc
{
  "name": "@you/my-extension",
  "version": "1.0.0",
  "main": "dist/index.js",
  "beak": { "apiVersion": 1 }
}
```

See [`extension-variable-template`](https://github.com/getbeak/extension-variable-template)
for a working scaffold.

## What's in an extension

- **Variables** — declarative resolvers Beak runs while building a request.
  Each declares `id`, `name`, `description`, a `getValue` async function,
  and (optionally) an `editor` block for user-editable payloads.
- An `ExtensionContext` is passed as the first argument to every callback,
  exposing `extCtx.log(level, message)` and `extCtx.parseValueSections(varCtx, parts)`
  for recursing into nested values.
- Variables can also opt into binary content via `getAssetRef`, in which
  case Beak prefers the binary path for binary sinks (file body uploads,
  etc.) and falls back to `getValue` for string sinks.

## Versioning

`apiVersion: 1` is currently the only supported revision. Beak refuses to
load extensions whose `apiVersion` it does not understand — this is the
forward-compatibility seam, not a soft check. When the SDK introduces
breaking changes we'll bump to `apiVersion: 2`.

## Type-string format

Beak addresses each contributed variable internally as `external:<package-name>/<variable-id>`.
You only see this in serialised project files — when you reference a variable
in the editor, Beak prints the friendly name. The `id` is stable per
extension; renaming it is a breaking change for anyone using your extension
in their projects.

## Trust model

Extensions run in a sandbox: an isolated V8 context on the desktop app and
a Web Worker in the web app. They cannot read other extensions' state, the
DOM, or Beak's React store. They **can** issue `fetch()` and (in the web
app) read same-origin IndexedDB — keep that in mind before installing
anything you don't trust.
