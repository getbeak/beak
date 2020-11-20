const requestSchema = {
	type: 'object',
	additionalProperties: true,

	definitions: {
		valueParts: {
			type: 'array',

			items: [
				{
					type: 'string',
				},
				{
					type: 'object',
					additionalProperties: true,

					required: [
						'type',
						'payload',
					],

					properties: {
						type: {
							type: 'string',
							enum: ['variable_group_item'],
						},

						payload: {
							type: 'object',
							additionalProperties: true,

							required: [
								'itemId',
							],

							properties: {
								itemId: {
									type: 'string',
								},
							},
						},
					},
				},
			],
		},

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
					$ref: '#/definitions/valueParts',
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
				'pathname',
				'port',
				'query',
				'fragment',
			],

			properties: {
				protocol: {
					type: 'string',
				},

				hostname: {
					type: ['string', 'null'],
				},

				pathname: {
					type: ['string', 'null'],
				},

				port: {
					type: ['string', 'null'],
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
		'verb',
		'uri',
		'headers',
	],

	properties: {
		id: {
			type: 'string',
			minLength: 1,
		},

		verb: {
			type: 'string',
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
