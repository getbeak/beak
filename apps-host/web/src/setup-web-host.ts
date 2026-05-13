import { Buffer } from 'buffer';

// Polyfill Node-style `Buffer` for libraries that don't ship browser builds
// (isomorphic-git in particular reaches for it during commit / index ops).
// Must run before any IPC service that may invoke project.create.
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

window.embeddedIndicator = false;

import './ipc/app-service';
import './ipc/beak-hub-service';
