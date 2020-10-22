const projectSchema = {
	type: 'object',
	additionalProperties: false,

	required: [
		'version',
		'name',
	],

	properties: {
		version: {
			type: 'string',
			minLength: 1,
		},

		name: {
			type: 'string',
			minLength: 1,
		},
	},
};

export default projectSchema;
