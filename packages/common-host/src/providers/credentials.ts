export default abstract class CredentialsProvider {
	protected readonly credentialKeys = {
		authEncryptionKey: 'app.getbeak.beak.auth-encryption-key',
		projectEncryptionPrefix: 'app.getbeak.beak.project-encryption',
	} as const;

	abstract readFromStore(key: string): Promise<string | null>;
	abstract writeToStore(key: string, value: string): Promise<void>;

	abstract setBeakAuthEncryptionKey(encryptionKey: string): Promise<void>;
	abstract getBeakAuthEncryptionKey(): Promise<[string, string] | null>;
	abstract getOrCreateBeakAuthEncryptionKey(key: string, iv: string): Promise<[string, string]>;

	abstract getProjectEncryptionKey(projectId: string): Promise<string | null>;
	abstract setProjectEncryptionKey(projectId: string, encryptionKey: string): Promise<void>;
}
