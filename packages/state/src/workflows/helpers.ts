/**
 * Pure helpers for the workflow editor. Live here in `@beak/state` rather
 * than the renderer because they're plain TypeScript with no React/Redux —
 * easier to test and the rules apply uniformly across the editor canvas,
 * the properties panel, and (eventually) the flight orchestrator.
 *
 * This file is a barrel re-export. The implementation has been split into
 * focused sub-modules:
 *
 *   workflow-node-display.ts   — value-section preview, override badge text
 *   workflow-graph-analysis.ts — reachability, cycles, health snapshot
 *   workflow-execution.ts      — topological order, flight-from-node
 *   workflow-layout.ts         — node placement, auto-layout, bounds
 *   workflow-lookups.ts        — collection queries, tag helpers, stats
 *   workflow-health.ts         — connection validation, edge cleanup, issues
 *   workflow-search.ts         — node + workflow free-text search
 *   workflow-serialisation.ts  — duplicate, import/export, merge
 */
export * from './workflow-execution';
export * from './workflow-graph-analysis';
export * from './workflow-graph-traversal';
export * from './workflow-health';
export * from './workflow-layout';
export * from './workflow-lookups';
export * from './workflow-node-display';
export * from './workflow-search';
export * from './workflow-serialisation';
export * from './workflow-tags';
