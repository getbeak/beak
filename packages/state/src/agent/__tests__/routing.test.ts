import { describe, expect, it } from 'vitest';

import { decideRouting } from '../routing';

describe('decideRouting', () => {
	it('always routes via default on unsupported hosts', () => {
		for (const status of ['paired', 'unreachable', 'unpaired'] as const) {
			for (const routingMode of ['agent-when-available', 'agent-only', 'browser-only'] as const) {
				expect(decideRouting({ capability: 'unsupported', status, routingMode })).toBe('via-default');
			}
		}
	});

	it('returns force-fail when an agent is required but not paired', () => {
		for (const status of ['unreachable', 'unpaired', 'discovering'] as const) {
			expect(
				decideRouting({ capability: 'required', status, routingMode: 'agent-when-available' }),
			).toBe('force-fail');
		}
	});

	it('routes via agent when required and paired', () => {
		expect(
			decideRouting({ capability: 'required', status: 'paired', routingMode: 'agent-when-available' }),
		).toBe('via-agent');
	});

	it('respects browser-only even when paired', () => {
		expect(
			decideRouting({ capability: 'optional', status: 'paired', routingMode: 'browser-only' }),
		).toBe('via-default');
	});

	it('force-fails agent-only when not paired', () => {
		expect(
			decideRouting({ capability: 'optional', status: 'unreachable', routingMode: 'agent-only' }),
		).toBe('force-fail');
	});

	it('falls back to default when agent-when-available and not paired', () => {
		expect(
			decideRouting({ capability: 'optional', status: 'unreachable', routingMode: 'agent-when-available' }),
		).toBe('via-default');
	});

	it('routes via agent on optional + paired + agent-when-available', () => {
		expect(
			decideRouting({ capability: 'optional', status: 'paired', routingMode: 'agent-when-available' }),
		).toBe('via-agent');
	});
});
