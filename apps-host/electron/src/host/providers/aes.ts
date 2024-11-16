import AesProviderBase from '@beak/common-host/providers/encryption-aes';
import crypto, { Cipher, Decipher } from 'node:crypto';

export default class AesProvider extends AesProviderBase {
  async generateKey(): Promise<string> {
    const key = crypto.randomBytes(32);

    return key.toString('base64');
  }

  async generateIv(): Promise<string> {
    const iv = crypto.randomBytes(16);

    return iv.toString('base64');
  }

  async encrypt(payload: Uint8Array, key: string, iv: string): Promise<string> {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const cipher = crypto.createCipheriv(this.aesAlgo, keyBuffer, ivBuffer, void 0) as Cipher; // TODO(afr): fix key len issue
    const update = cipher.update(payload);
    const final = Buffer.concat([update, cipher.final()]);

    return final.toString('base64');
  }

  async decrypt(payload: Uint8Array, key: string, iv: string): Promise<string> {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipheriv(this.aesAlgo, keyBuffer, ivBuffer, void 0) as Decipher;
    const update = decipher.update(payload);
    const final = Buffer.concat([update, decipher.final()]);

    return final.toString('utf-8');
  }

  async encryptString(payload: string, key: string, iv: string): Promise<string> {
    const buf = Buffer.from(payload, 'utf-8');

    return await this.encrypt(buf, key, iv);
  }

  async decryptString(payload: string, key: string, iv: string): Promise<string> {
    if (payload === '')
      return '';

    const buf = Buffer.from(payload, 'base64');

    return await this.decrypt(buf, key, iv);
  }
}
