export function attemptJsonStringFormat(json: string) {
	try {
		return JSON.stringify(JSON.parse(json), null, '\t');
	} catch {
		return json;
	}
}

export function attemptTextToJson(input: string) {
	try {
		return JSON.parse(input);
	} catch {
		return JSON.stringify(input);
	}
}
