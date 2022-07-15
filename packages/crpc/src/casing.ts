const camelCaseRegex = /^[a-z][A-Za-z0-9]*$/;
const snakeCaseRegex = /^[a-z]+(?:_[a-z0-9]+)*$/;
const snakeCaptureRegex = /_(.)/g;

let compiledCamelSplitRegex: null | RegExp = null;
const complexTypes = ['[object Date]', '[object RegExp]', '[object Boolean]'];

// in the grass
export function snek(object: unknown) {
	if (typeof window === 'undefined')
		return snekNode(object);

	return snekBrowser(object);
}

// in the trees
export function desnek(object: unknown) {
	return processKeys(s => {
		if (!snakeCaseRegex.test(s))
			return s;

		return s.replace(snakeCaptureRegex, (_x, chr) => chr ? chr.toUpperCase() : '');
	}, object);
}

function snekBrowser(object: unknown) {
	const camelSplitFirstPassRegex = /([A-Z])/g;
	const camelSplitSecondPassRegex = /([a-zA-Z]{1})([0-9]{1})/g;

	return processKeys(s => {
		if (!camelCaseRegex.test(s))
			return s;

		return s
			.replace(camelSplitFirstPassRegex, ' $1')
			.split(' ')
			.map(_s => _s.replace(camelSplitSecondPassRegex, '$1 $2').split(' '))
			.flat()
			.join('_')
			.toLowerCase();
	}, object);
}

function snekNode(object: unknown) {
	if (!compiledCamelSplitRegex)
		compiledCamelSplitRegex = new RegExp('(?=[A-Z])|(?<=[a-z])(?=[0-9])', 'g');

	return processKeys(s => {
		if (!camelCaseRegex.test(s))
			return s;

		return s.split(compiledCamelSplitRegex!)
			.join('_')
			.toLowerCase();
	}, object);
}

function processKeys(convert: (s: string) => string, obj: unknown): unknown {
	if (obj !== Object(obj) || typeof obj === 'function')
		return obj;

	if (complexTypes.includes(Object.prototype.toString.call(obj)))
		return obj;

	if (Array.isArray(obj)) {
		const output = [];

		for (const item of obj)
			output.push(processKeys(convert, item));

		return output;
	}

	const output: Record<string, unknown> = {};
	const typedObject = obj as Record<string, unknown>;

	for (const key of Object.keys(typedObject))
		output[convert(key)] = processKeys(convert, typedObject[key]);

	return output;
}
