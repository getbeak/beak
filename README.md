# Beak

It'll be like Postman, but good. Firstly in C#/XAML, now in Typescript/Electron. Vote opens soon for next rewrite.

## Common issues

### A new `BrowserWindow` is instantiated but no window is created?

Normally because the `chrome-sandbox` installed by electron is a fucking waste of space and pretty useless. Especially if you've been fucking with it trying to get it working through WSL. I've added a quick workaround for this, just run `yarn unfuck` in the root of the repo and it'll clean up for you.
