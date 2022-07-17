import Id from './id';
import Instance from './instance';
import Node from './node';

export { Id, Instance, Node };

let internalNode: Node | undefined;
const node = (): Node => internalNode ?? (internalNode = new Node());

export default {
	parse(input: string): Id {
		return Id.parse(input);
	},

	generate(resource: string): Id {
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
