// The design-system package now exports a Chakra UI v3 theme + provider.
// The legacy styled-components-only `DesignSystemProvider` is kept as an
// alias for `BeakChakraProvider` so existing call sites continue to work
// during the migration window. Both names will resolve to the same
// Chakra-aware provider — pick `BeakChakraProvider` in new code.

export { BeakChakraProvider, BeakChakraProvider as DesignSystemProvider } from './provider';
export { system as chakraSystem } from './theme';
