# Beak update guide

This is the checklist to follow before releasing any Beak update!

## Beak checklist guide

### Ensure stability (main-release only)

- Ensure all tests, linting, and typechecking are passing
- Ensure common use-cases are working (httpbin examples cover most of these)

### Setup release tracking

- Setup GitHub release (in draft!)
- Write up release notes on Notion
- Update link to release notes inside `@beak/electron-host/src/updater.ts`

### Prepare release

- Update version in `@beak/electron-host/package.json`
- Commit the above
- Tag the release `vx.x.x`

### Watch along

- Ensure tag action passes, and code signing was complete
- Update local copy, ensure there are no issues


## Future work ideas

- Use rollouts (10%, rolling to 100% over 3 days)
- Have a CLI tool to manage aspects of release (tagging, version bump, rollout/back)
