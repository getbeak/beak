export function attemptJsonStringFormat(json: string) {
	try {
		return JSON.stringify(JSON.parse(json), null, '\t');
	} catch {
		return json;
	}
}
