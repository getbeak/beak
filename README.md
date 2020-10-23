<p align="center">
	<img width="200" height="200" src="assets/logo.png" />
</p>

<p align="center">
	<img src="https://github.com/beak-app/beak/workflows/Beak/badge.svg" alt="Build Status" />
</p>

<h2 style="border-bottom: none" align="center">Beak</h1>

<p align="center">
	Snazzy cross-platform API development and research tool. Firstly in C#/XAML, now inTypescript/Electron. Vote opens for next rewrite soon, lol.
</p>

![Project view](assets/home.png)
<p align="center">still a little rough around the edges 🤷‍♀️</p>

## Getting started

1. Clone the git repo
1. Run `yarn`
1. Run `yarn start`
1. ???
1. profit

## Common issues

### A new `BrowserWindow` is instantiated but no window is created?

If you've been fucking with `chrome-sandbox`, trying to get it working through WSL, it'll end up totally fucked. I've added a quick workaround for this, just run `yarn unfuck` in the root of the repo and it'll clean up everything for you.
