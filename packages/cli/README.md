# FNPM (WIP)
FNPM is an "alternative" for NPM, it is faster and saves more space.

**DISCLAIMER 🚧**

This project was made to learn more about Package Managers, for now you should only use it to play with it.

## Requirements
- Node v16 or higher
- Linux or Mac OS (Working on Windows support [issue](https://github.com/nachoaldamav/snpm/issues/40))

## CLI
The FNPM CLI is used to install packages from the package.json of a project.

Its advantages are that it is faster than NPM and saves more space.

### Instalation
```bash
npm i @fnpm-io/cli -g
```

### Commands
- `fnpm install [pkg (optional), flags]` Installs packages
- `fnpm run <script> <params>` Run script from package.json
- `fnpm create <template> <arguments>` Create a project from a template (Similar to npm init)
- `fnpm benchmark` Tests SNPM against NPM and PNPM
- `fnpm clear` Remove .snpm-cache folder
- `fnpm ls <pkg>` Show versions installed by FNPM


### Todo
- [ ] Make it work in some JS Frameworks ([Follow progress here](https://github.com/nachoaldamav/fnpm/issues?q=is%3Aissue+is%3Aopen+label%3Aframeworks))
- [ ] Fix monorepos integration (WIP, degradated performance in some repos)

### Why is it faster?
SNPM uses the same installation system as PNPM, fetch dependency, download dependency. Without waiting for the rest of the dependencies.

Now you are probably wondering how that makes the space more efficient than in NPM.

Each dependency is a hard link to a common store inside `.fnpm-cache`, so all your projects use shared dependencies.

### It works?
Short answer, probably no, but in some cases it works. (For now)

I've selected some quickstart templates to test FNPM, and I'm working on make it work in all of them.

If you want to test a template, you can use Next or Vite, I've already tested them and it should work.

(If you want to test a template and it doesn't work, please open an issue)