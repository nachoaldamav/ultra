# SNPM (WIP)
SNPM is an "alternative" for NPM, but it's not meant to replace NPM/Yarn/PNPM

**DISCLAIMER 🚧**

This project was made to learn more about Package Managers, for now you should only use it to play with it.

## CLI
The SNPM CLI is used to install packages from the package.json of a project.

Its advantages are that it is faster than NPM and saves more space.

### Instalation
```bash
npm i @snpm-io/cli -g
```

### Commands
- `snpm install [pkg (optional), flags]` Installs packages
- `snpm run <script> <params>` Run script from package.json
- `snpm benchmark` Tests SNPM against NPM and PNPM
- `snpm clear` Remove .snpm-cache folder
. `snpm ls <pkg>` Show versions installed by SNPM


### Todo
- [ ] Make it work in some JS Frameworks ([Follow progress here](https://github.com/nachoaldamav/snpm/issues?q=is%3Aissue+is%3Aopen+label%3Aframeworks))
- [ ] Fix monorepos integration (WIP, degradated performance in some repos)

### Why is it faster?
SNPM uses the same installation system as PNPM, fetch dependency, download dependency. Without waiting for the rest of the dependencies.

To resolve the dependencies, a dependency tree is generated as in NPM version 2, each dependency (or subdependency) has its own `node_modules`.

Now you are probably wondering how that makes the space more efficient than in NPM.

Each dependency is a hard link to a common store inside `.snpm-cache`, so all your projects use shared dependencies.

### It works?
Short answer, probably no, but in some cases it works. (For now)

I've selected some quickstart templates to test SNPM, and I'm working on make it work in all of them.

If you want to test a template, you can use Next or Vite, I've already tested them and it should work.

(If you want to test a template and it doesn't work, please open an issue)

[Full list](https://github.com/nachoaldamav/snpm/tree/main/packages/cli#readme)
