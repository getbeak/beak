import type { SendNotificationReq } from '@beak/common/ipc/notification';

/**
 * Port: Notification
 *
 * Abstracts OS/browser-level notification dispatch and the system beep so
 * that IPC handlers contain no platform knowledge.  Each shell supplies a
 * concrete adapter:
 *
 *   Electron  — apps-host/electron/src/adapters/notification.ts
 *   Web       — apps-host/web/src/adapters/notification.ts
 *
 * Behaviour contract:
 *   • `sendNotification` — fire-and-forget; silently skips when the
 *     platform cannot show notifications (e.g. permission denied, not
 *     supported).
 *   • `beep` — plays a system beep / audio cue.  A no-op is an acceptable
 *     implementation for hosts that lack audio access.
 */
export default abstract class NotificationPort {
	abstract sendNotification(payload: SendNotificationReq): Promise<void>;
	abstract beep(): Promise<void>;
}
