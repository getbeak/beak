import Id from './id';
import Instance from './instance';
import Node from './node';
import { KSUID_PREFIXES, type KsuidKind } from './prefixes';

export type { KsuidKind };
export { Id, Instance, KSUID_PREFIXES, Node };

let internalNode: Node | undefined;
const node = (): Node => {
	if (!internalNode) internalNode = new Node();
	return internalNode;
};

export default {
	parse(input: string): Id {
		return Id.parse(input);
	},

	generate(resource: KsuidKind): Id {
		return node().generate(resource);
	},

	get environment(): string {
		return node().environment;
	},

	set environment(value: string) {
		node().environment = value;
	},

	get instance(): Instance {
		return node().instance;
	},

	set instance(value: Instance) {
		node().instance = value;
	},
};
