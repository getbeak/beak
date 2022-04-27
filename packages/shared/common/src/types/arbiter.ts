import Squawk from '../utils/squawk';

export interface ArbiterStatus {
	lastSuccessfulCheck: string;
	lastCheckError: Squawk | null;
	lastCheck: string;
	status: boolean;
}
