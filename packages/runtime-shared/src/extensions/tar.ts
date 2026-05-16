/**
 * Minimal POSIX-ustar reader. npm tarballs are well-behaved (no symlinks,
 * short filenames, deterministic ordering, regular-file entries only), so
 * the subset we implement is tiny. Reads enough to walk every file entry
 * and yield `{ name, bytes }` records.
 *
 * Reference: https://www.gnu.org/software/tar/manual/html_node/Standard.html
 */
export interface TarEntry {
	name: string;
	bytes: Uint8Array;
}

const BLOCK = 512;

export function* readTar(buffer: Uint8Array): Iterable<TarEntry> {
	let offset = 0;

	while (offset + BLOCK <= buffer.byteLength) {
		const header = buffer.subarray(offset, offset + BLOCK);

		if (isAllZero(header)) break;

		const name = readString(header, 0, 100);
		const sizeOctal = readString(header, 124, 12).trim();
		const size = sizeOctal ? parseInt(sizeOctal, 8) : 0;
		const typeFlag = String.fromCharCode(header[156]);

		// Honour `prefix` (ustar) so deep paths reassemble correctly.
		const prefix = readString(header, 345, 155);
		const fullName = prefix ? `${prefix}/${name}` : name;

		offset += BLOCK;

		const isRegularFile = typeFlag === '0' || typeFlag === '\0' || typeFlag === '';

		if (isRegularFile && fullName) {
			const bytes = buffer.subarray(offset, offset + size);
			yield { name: fullName, bytes };
		}

		// Advance past the file content, rounded up to the next 512-byte block.
		offset += Math.ceil(size / BLOCK) * BLOCK;
	}
}

export async function gunzip(input: Uint8Array): Promise<Uint8Array> {
	const decoder = new DecompressionStream('gzip');
	const stream = new Response(new Blob([input.buffer as ArrayBuffer]).stream().pipeThrough(decoder));
	const result = new Uint8Array(await stream.arrayBuffer());
	return result;
}

function readString(buf: Uint8Array, start: number, length: number): string {
	let end = start;
	const stop = start + length;

	while (end < stop && buf[end] !== 0) end += 1;

	return new TextDecoder().decode(buf.subarray(start, end));
}

function isAllZero(buf: Uint8Array): boolean {
	for (let i = 0; i < buf.length; i += 1) if (buf[i] !== 0) return false;
	return true;
}
