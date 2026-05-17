import Squawk from '@beak/common/utils/squawk';
import { describe, expect, it } from 'vitest';

import { makeFullyQualifiedType, packageNameFromType, variableIdFromType } from '../manifest-helpers';

describe('makeFullyQualifiedType', () => {
	it('joins package name + variable id with the external: prefix', () => {
		expect(makeFullyQualifiedType('acme-secrets', 'aws-credentials')).toBe('external:acme-secrets/aws-credentials');
	});

	it('preserves scoped package names', () => {
		expect(makeFullyQualifiedType('@scope/pkg', 'var')).toBe('external:@scope/pkg/var');
	});
});

describe('packageNameFromType', () => {
	it('extracts plain package names', () => {
		expect(packageNameFromType('external:acme-secrets/aws-credentials')).toBe('acme-secrets');
	});

	it('extracts scoped package names (uses the LAST slash to split)', () => {
		expect(packageNameFromType('external:@scope/pkg/var')).toBe('@scope/pkg');
	});

	it('throws a typed Squawk for non-external types', () => {
		expect(() => packageNameFromType('variable_set_item')).toThrowError(Squawk);
		expect(() => packageNameFromType('variable_set_item')).toThrowError(/not_an_external_variable_type/);
	});
});

describe('variableIdFromType', () => {
	it('extracts plain variable ids', () => {
		expect(variableIdFromType('external:acme-secrets/aws-credentials')).toBe('aws-credentials');
	});

	it('extracts the variable id from scoped types', () => {
		expect(variableIdFromType('external:@scope/pkg/var')).toBe('var');
	});

	it('throws for non-external types', () => {
		expect(() => variableIdFromType('variable_set_item')).toThrowError(/not_an_external_variable_type/);
	});

	it('returns empty when no slash exists after the prefix', () => {
		// `external:onlyname` — a degenerate FQN with no separator. The helper
		// returns an empty variable id rather than throwing so the caller can
		// decide whether to treat that as an error.
		expect(variableIdFromType('external:onlyname')).toBe('');
	});
});

describe('round-trip', () => {
	it('makeFullyQualifiedType + packageNameFromType + variableIdFromType is reversible', () => {
		const cases: Array<[string, string]> = [
			['simple', 'var'],
			['@scope/pkg', 'var'],
			['hyphenated-pkg', 'enum-var'],
		];
		for (const [pkg, id] of cases) {
			const fq = makeFullyQualifiedType(pkg, id);
			expect(packageNameFromType(fq)).toBe(pkg);
			expect(variableIdFromType(fq)).toBe(id);
		}
	});
});
