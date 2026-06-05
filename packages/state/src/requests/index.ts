export {
	type BodyTransitionDeps,
	createEmptyBody,
	type TransitionOptions,
	transitionBody,
} from './body-type-transitions';
export { checkAssetIntegrity, checkProjectIntegrity, type IntegrityReport } from './integrity';
export type { AssetRef } from './introspection';
export { countAssetRefs, extractAssetRefs } from './introspection';
