const requestSchema = {
	type: 'object',
	additionalProperties: true,

	definitions: {
		keyValuePair: {
			type: 'object',
			additionalProperties: true,

			required: [
				'name',
				'value',
				'enabled',
			],

			properties: {
				name: {
					type: 'string',
					minLength: 1,
				},

				value: {
					type: 'string',
					minLength: 1,
				},

				enabled: {
					type: 'boolean',
				},
			},
		},

		uri: {
			type: 'object',
			additionalProperties: true,

			required: [
				'protocol',
				'hostname',
				'path',
				'query',
				'fragment',
			],

			properties: {
				protocol: {
					type: 'string',
					minLength: 1,
				},

				hostname: {
					type: ['string', 'null'],
					minLength: 1,
				},

				path: {
					type: ['string', 'null'],
					minLength: 1,
				},

				query: {
					type: 'object',

					properties: {
						$ref: '#/definitions/keyValuePair',
					},
				},

				fragment: {
					type: ['string', 'null'],
				},
			},
		},

		body: {
			type: 'object',
			additionalProperties: true,

			required: [
				'type',
				'payload',
			],

			properties: {
				type: {
					type: 'string',
					enum: ['text', 'json', 'url-encoded-form'],
				},

				allOf: [{
					if: {
						properties: {
							type: {
								const: 'text',
							},
						},
					},
					then: {
						properties: {
							payload: {
								type: 'string',
							},
						},
					},
				}, {
					if: {
						properties: {
							type: {
								const: 'json',
							},
						},
					},
					then: {
						properties: {
							payload: {
								type: 'string',
							},
						},
					},
				}, {
					if: {
						properties: {
							type: {
								const: 'url-encoded-form',
							},
						},
					},
					then: {
						properties: {
							payload: {
								type: 'object',

								properties: {
									$ref: '#/definitions/keyValuePair',
								},
							},
						},
					},
				}],
			},
		},
	},

	required: [
		'id',
		'name',
		'verb',
		'uri',
		'headers',
	],

	properties: {
		id: {
			type: 'string',
			minLength: 1,
		},

		name: {
			type: 'string',
			minLength: 1,
		},

		verb: {
			type: 'string',
			minLength: 1,
		},

		uri: {
			$ref: '#/definitions/uri',
		},

		headers: {
			type: 'object',

			properties: {
				$ref: '#/definitions/keyValuePair',
			},
		},

		body: {
			$ref: '#/definitions/body',
		},
	},
};

export default requestSchema;
