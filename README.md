# Beak

Snazzy cross-platform API development and research tool. Firstly in C#/XAML, now in Typescript/Electron. Vote opens for next rewrite soon, lol.

![Project view](assets/home.png)
<p align="center">still a little rough around the edges 🤷‍♀️</p>

## Getting started

1. Clone the git repo
1. Run yarn
1. Run yarn start
1. ???
1. profit

*You may have to run `yarn rebuild` to get NodeGit to work, depending on your system installed version of Node. tbh, It's safer to just always run it.*

## Common issues

### A new `BrowserWindow` is instantiated but no window is created?

If you've been fucking with `chrome-sandbox`, trying to get it working through WSL, it'll end up totally fucked. I've added a quick workaround for this, just run `yarn unfuck` in the root of the repo and it'll clean up everything for you.
