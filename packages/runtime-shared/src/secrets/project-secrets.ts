import type { ProjectEncryption } from '@beak/common/types/beak-project';
import type { ValueSections } from '@getbeak/types/values';
import type CredentialsProvider from '../ports/credentials';
import type AesProvider from '../ports/encryption-aes';

/**
 * Owns the per-project encryption surface. Both hosts (Electron and Web)
 * instantiate this with their own providers; the encryption logic itself is
 * identical across hosts.
 *
 * The `copyKeyToClipboard` clipboard write differs between hosts (Node
 * `electron.clipboard` vs `navigator.clipboard`), so callers supply the
 * callback rather than letting the class depend on a host-specific API.
 */
export default class ProjectSecrets {
	private readonly aes: AesProvider;
	private readonly credentials: CredentialsProvider;
	private readonly writeToClipboard: (text: string) => Promise<void>;

	constructor(aes: AesProvider, credentials: CredentialsProvider, writeToClipboard: (text: string) => Promise<void>) {
		this.aes = aes;
		this.credentials = credentials;
		this.writeToClipboard = writeToClipboard;
	}

	// ── Key management ────────────────────────────────────────────────────────

	/** Returns `true` if a project encryption record is present. */
	async checkStatus(projectId: string): Promise<boolean> {
		const encryption = await this.credentials.getProjectEncryption(projectId);

		return encryption !== null;
	}

	/** Store a caller-supplied key for the project. */
	async submitKey(projectId: string, key: string): Promise<void> {
		await this.credentials.setProjectEncryption(projectId, {
			key,
			algorithm: this.aes.aesAlgo,
		});
	}

	/**
	 * Destroy the project's current encryption key and replace it with a
	 * freshly generated one. Pre-existing encrypted values remain on disk but
	 * become unreadable until overwritten by the user.
	 */
	async resetKey(projectId: string): Promise<string> {
		const newKey = await this.aes.generateKey();

		await this.credentials.setProjectEncryption(projectId, {
			key: newKey,
			algorithm: this.aes.aesAlgo,
		});

		return newKey;
	}

	/** Generate a new random IV suitable for AES-256-CTR. */
	async generateIv(): Promise<string> {
		return this.aes.generateIv();
	}

	/** Look up the raw encryption record for a project. */
	async getEncryption(projectId: string): Promise<ProjectEncryption | null> {
		return this.credentials.getProjectEncryption(projectId);
	}

	// ── Encryption / decryption ───────────────────────────────────────────────

	/**
	 * Encrypt a UTF-8 string with the project's stored key.
	 * Returns an empty string if no key is configured.
	 */
	async encryptString(projectId: string, iv: string, plaintext: string): Promise<string> {
		const encryption = await this.credentials.getProjectEncryption(projectId);

		if (encryption === null) return '';

		return this.aes.encryptString(plaintext, encryption.key, iv);
	}

	/**
	 * Decrypt a ciphertext string with the project's stored key.
	 * Returns a human-readable sentinel if no key is configured.
	 */
	async decryptString(projectId: string, iv: string, ciphertext: string): Promise<string> {
		const encryption = await this.credentials.getProjectEncryption(projectId);

		if (encryption === null) return '[Encryption key missing]';

		return this.aes.decryptString(ciphertext, encryption.key, iv);
	}

	/**
	 * JSON-serialize `payload` and encrypt it with the project's stored key.
	 * Returns an empty string if no key is configured.
	 */
	async encryptObject(projectId: string, iv: string, payload: Record<string, unknown> | unknown[]): Promise<string> {
		const encryption = await this.credentials.getProjectEncryption(projectId);

		if (encryption === null) return '';

		return this.aes.encryptString(JSON.stringify(payload), encryption.key, iv);
	}

	/**
	 * Decrypt `ciphertext` and JSON-parse the result as `ValueSections`.
	 * Returns a sentinel array if no key is configured or the ciphertext is
	 * empty/unparseable.
	 */
	async decryptObject(projectId: string, iv: string, ciphertext: string): Promise<ValueSections> {
		const encryption = await this.credentials.getProjectEncryption(projectId);

		if (encryption === null) return ['[Encryption key missing]'];

		const decrypted = await this.aes.decryptString(ciphertext, encryption.key, iv);

		if (decrypted === '') return [];

		try {
			const parsed = JSON.parse(decrypted);

			if (Array.isArray(parsed)) return parsed;

			return [parsed];
		} catch {
			return [];
		}
	}

	// ── Clipboard ─────────────────────────────────────────────────────────────

	/**
	 * Write the project's raw encryption key to the system clipboard.
	 * No-ops silently if no key is configured.
	 */
	async copyKeyToClipboard(projectId: string): Promise<void> {
		const encryption = await this.credentials.getProjectEncryption(projectId);

		if (encryption === null) return;

		await this.writeToClipboard(encryption.key);
	}
}
