import js from '@eslint/js';
import { includeIgnoreFile } from "@eslint/compat";
import reactHooks from 'eslint-plugin-react-hooks';
import tsESlintPlugin from '@typescript-eslint/eslint-plugin';
import eslintPluginReact from 'eslint-plugin-react';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import tsEslintParser from '@typescript-eslint/parser';
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [
	includeIgnoreFile(gitignorePath),
	{
		"ignores": [
			"**/*.js",
		],
	},
	js.configs.recommended,
	{
		"files": ["**/*.ts", "**/*.tsx"],

		"languageOptions": {
			"parser": tsEslintParser,
			"parserOptions": {
				"project": [
					"tsconfig.json",
					"./packages/*/tsconfig.json"
				],

				"ecmaFeatures": {
					"impliedStrict": true,
					"jsx": true
				},
			},

			"ecmaVersion": 2018,
			"sourceType": "module",


			"globals": {
				...globals.browser,
				...globals.node,
				...globals.sharedNodeBrowser,
				...globals.es2017,
			}
		},

		"plugins": {
			'@typescript-eslint': tsESlintPlugin,
			'react': eslintPluginReact,
			'simple-import-sort': simpleImportSort,
			'unused-imports': eslintPluginUnusedImports
		},

		"settings": {
			"react": {
				"version": "detect"
			}
		},

		"rules": {
			"accessor-pairs": 1,
			"array-bracket-spacing": 1,
			"array-callback-return": 1,
			"arrow-body-style": 1,
			"arrow-parens": [1, "as-needed"],
			"arrow-spacing": 1,
			"block-scoped-var": 1,
			"block-spacing": 1,
			"brace-style": 1,
			"camelcase": "off",
			"comma-dangle": ["error", "always-multiline"],
			"comma-spacing": 1,
			"comma-style": 1,
			"computed-property-spacing": 1,
			"consistent-return": "error",
			"consistent-this": [1, "that"],
			"curly": [1, "multi-or-nest", "consistent"],
			"default-case": 1,
			"dot-notation": [1, { "allowPattern": "^[a-z]+(_[a-z]+)+$" }],
			"eol-last": ["error", "always"],
			"eqeqeq": [1, "allow-null"],
			"func-names": 1,
			"func-style": [1, "declaration", { "allowArrowFunctions": true }],
			"generator-star-spacing": [1, { "before": false, "after": true }],
			"global-require": 1,
			"guard-for-in": 1,
			"handle-callback-err": 1,
			"id-blacklist": [1, "err", "cb", "data"],
			"indent": "off",
			"jsx-quotes": ["error", "prefer-single"],
			"key-spacing": 1,
			"keyword-spacing": 1,
			"linebreak-style": 1,
			"lines-around-comment": 1,
			"max-depth": 1,
			"max-len": ["error", {
				"code": 120,
				"ignoreStrings": true,
				"ignoreTemplateLiterals": true,
				"ignoreTrailingComments": true,
				"ignoreUrls": true
			}],
			"max-nested-callbacks": [1, 3],
			"max-statements-per-line": 1,
			"new-parens": 1,
			"newline-per-chained-call": 1,
			"no-alert": 1,
			"no-array-constructor": "off",
			"no-await-in-loop": 1,
			"no-bitwise": 1,
			"no-caller": 1,
			"no-catch-shadow": 1,
			"no-confusing-arrow": 0,
			"no-console": ["error", { "allow": ["info", "warn", "error"] }],
			"no-div-regex": 1,
			"no-duplicate-imports": 1,
			"no-else-return": 1,
			"no-empty-function": 1,
			"no-eval": 1,
			"no-extend-native": 1,
			"no-extra-bind": 1,
			"no-extra-label": 1,
			"no-floating-decimal": 1,
			"no-implicit-coercion": 1,
			"no-implicit-globals": 1,
			"no-implied-eval": 1,
			"no-invalid-this": 0,
			"no-iterator": 1,
			"no-label-var": 1,
			"no-lone-blocks": 1,
			"no-lonely-if": 1,
			"no-loop-func": 1,
			"no-magic-numbers": 0,
			"no-mixed-requires": 1,
			"no-mixed-spaces-and-tabs": 1,
			"no-multi-spaces": 1,
			"no-multi-str": 1,
			"no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0, "maxBOF": 0 }],
			"no-native-reassign": 1,
			"no-negated-condition": 1,
			"no-nested-ternary": 1,
			"no-new-func": 1,
			"no-new-object": 1,
			"no-new-require": 1,
			"no-new-wrappers": 1,
			"no-new": 1,
			"no-octal-escape": 1,
			"no-param-reassign": ["error", { "props": true, "ignorePropertyModificationsFor": ["state"] }],
			"no-path-concat": 1,
			"no-plusplus": [1, { "allowForLoopAfterthoughts": true }],
			"no-process-env": 1,
			"no-process-exit": 1,
			"no-proto": 1,
			"no-return-assign": 1,
			"no-script-url": 1,
			"no-self-compare": 1,
			"no-sequences": 1,
			"no-shadow-restricted-names": 1,
			"no-spaced-func": 1,
			"no-sync": 1,
			"no-throw-literal": 1,
			"no-trailing-spaces": 1,
			"no-undef-init": 1,
			"no-undefined": 1,
			"no-unmodified-loop-condition": 1,
			"no-unneeded-ternary": 1,
			"no-unsafe-finally": 1,
			"no-unused-expressions": 1,
			"no-unused-vars": "off",
			"no-use-before-define": 0, // we rely on typescript-eslint own rule for this
			"no-useless-call": 1,
			"no-useless-catch": 0,
			"no-useless-computed-key": 1,
			"no-useless-concat": 1,
			"no-useless-constructor": 1,
			"no-useless-escape": 1,
			"no-var": 1,
			"no-warning-comments": 1,
			"no-whitespace-before-property": 1,
			"no-with": 1,
			"object-curly-spacing": [1, "always", { "arraysInObjects": true, "objectsInObjects": true }],
			"object-shorthand": 1,
			"one-var": [1, "never"],
			"operator-assignment": 1,
			"operator-linebreak": [1, "none"],
			"padded-blocks": [1, "never"],
			"padding-line-between-statements": [
				"error",
				{ "blankLine": "always", "prev": "*", "next": "return" },
				{ "blankLine": "always", "prev": ["const", "let", "var"], "next": "*" },
				{ "blankLine": "any", "prev": ["const", "let", "var"], "next": ["const", "let", "var"] }
			],
			"prefer-arrow-callback": 1,
			"prefer-const": 1,
			"prefer-rest-params": 1,
			"prefer-spread": 1,
			"prefer-template": 1,
			"quote-props": [1, "consistent-as-needed"],
			"quotes": "off",
			"radix": 1,
			"require-yield": 1,
			"semi": [1, "always"],
			"simple-import-sort/imports": ["error", { "groups": [["^react", "^@?\\w"]] }],
			"sort-imports": 0,
			"space-before-blocks": 1,
			"space-before-function-paren": [1, { "anonymous": "always", "named": "never" }],
			"space-in-parens": 1,
			"space-infix-ops": 1,
			"space-unary-ops": 1,
			"spaced-comment": "error",
			"template-curly-spacing": 1,
			"vars-on-top": 1,
			"wrap-iife": 1,
			"wrap-regex": 1,
			"yield-star-spacing": 1,
			"yoda": 1,

			"react/jsx-curly-brace-presence": ["error", "always"],
			"react/jsx-tag-spacing": 1,
			"react/jsx-uses-react": 1,
			"react/jsx-uses-vars": 1,
			"react/no-multi-comp": 0,
			"react/no-unsafe": [1, { "checkAliases": true }],
			"react/prop-types": 0,

			"unused-imports/no-unused-imports": "error",

			"@typescript-eslint/adjacent-overload-signatures": "error",
			"@typescript-eslint/array-type": "error",
			"@typescript-eslint/consistent-type-assertions": "error",
			// "member-delimiter-style": "error",
			"@typescript-eslint/member-naming": "off",
			"@typescript-eslint/naming-convention": ["error",
				{
					"selector": "variable",
					"format": ["camelCase", "UPPER_CASE", "PascalCase"]
				},
				{
					"selector": "parameter",
					"format": [],
					"leadingUnderscore": "allow"
				},
				{
					"selector": "property",
					"format": [],
					"leadingUnderscore": "allow"
				},
				{
					"selector": "function",
					"format": ["camelCase", "PascalCase"]
				},
				{
					"selector": "method",
					"format": ["camelCase"],
					"modifiers": ["private"],
					"leadingUnderscore": "allow"
				},
				{ "selector": "typeLike", "format": ["PascalCase"] }
			],
			"@typescript-eslint/no-array-constructor": "error",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/no-misused-new": "error",
			"@typescript-eslint/no-namespace": "error",
			"@typescript-eslint/parameter-properties": "error",
			"@typescript-eslint/triple-slash-reference": [1, { "path": "never", "types": "never", "lib": "never" }],
			"@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
			"@typescript-eslint/no-use-before-define": "off", // NOTE(afr): Un-useful rule for how we write components
			"@typescript-eslint/no-var-requires": "error",
			// "@typescript-eslint/quotes": ["error", "single", { "avoidEscape": true }],
			"@typescript-eslint/restrict-plus-operands": "error",
			// "@typescript-eslint/type-annotation-spacing": "error",

			"react-hooks/exhaustive-deps": 0 // NOTE(afr): Disabling this for now
		}
	},
];
