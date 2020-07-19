# Beak

Snazzy cross-platform API development and research tool. Firstly in C#/XAML, now in Typescript/Electron. Vote opens soon for next rewrite.

## Getting started

1. Clone the git repo
1. Run yarn
1. Run yarn start
1. ???
1. profit

## Common issues

### A new `BrowserWindow` is instantiated but no window is created?

If you've been fucking with `chrome-sandbox`, trying to get it working through WSL, it'll end up totally fucked. I've added a quick workaround for this, just run `yarn unfuck` in the root of the repo and it'll clean up everything for you.

### The TS language server fails to detect electron being installed in the `beak-electron` package

idk...
