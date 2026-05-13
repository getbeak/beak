/**
 * Active colour mode (light | dark). Used to seed Chakra's `_dark`
 * selectors through `next-themes`. The previous styled-components
 * `DesignSystem` + `UIColors` types are gone — all colours now resolve
 * through Chakra semantic tokens at runtime.
 */
export type Theme = 'light' | 'dark';
