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

### Benchmarks

### PNPM Official benchmark (alotta-files)

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │ 'Bun install (with cache / with lockfile)' │ '0.70 seconds'  │
│    1    │  'Bun install (with cache / no lockfile)'  │ '1.17 seconds'  │
│    2    │        'SNPM install (with cache)'         │ '4.94 seconds'  │
│    3    │   'Bun install (no cache / no lockfile)'   │ '9.90 seconds'  │
│    4    │        'PNPM install (with cache)'         │ '10.16 seconds' │
│    5    │ 'NPM install (with cache / with lockfile)' │ '27.29 seconds' │
│    6    │  'NPM install (with cache / no lockfile)'  │ '35.34 seconds' │
│    7    │        'YARN install (with cache)'         │ '43.62 seconds' │
│    8    │         'SNPM install (no cache)'          │ '1.02 minutes'  │
│    9    │         'PNPM install (no cache)'          │ '1.24 minutes'  │
│   10    │   'YARN install (no cache, no lockfile)'   │ '1.68 minutes'  │
│   11    │    'YARN install (with cache, no lock)'    │ '2.13 minutes'  │
│   12    │   'NPM install (no cache / no lockfile)'   │ '2.36 minutes'  │
└─────────┴────────────────────────────────────────────┴─────────────────┘
```

#### Vite React - TS
This is an example benchmark of a Vite project using `npm create vite@latest my-react-app -- --template react-ts`

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┬───────┐
│ (index) │                    name                    │      time       │ group │
├─────────┼────────────────────────────────────────────┼─────────────────┼───────┤
│    0    │ 'Bun install (with cache / with lockfile)' │ '0.15 seconds'  │   3   │
│    1    │        'SNPM install (with cache)'         │ '0.93 seconds'  │   3   │
│    2    │        'PNPM install (with cache)'         │ '2.87 seconds'  │   3   │
│    3    │        'YARN install (with cache)'         │ '3.91 seconds'  │   3   │
│    4    │  'Bun install (with cache / no lockfile)'  │ '4.73 seconds'  │   2   │
│    5    │ 'NPM install (with cache / with lockfile)' │ '4.82 seconds'  │   3   │
│    6    │   'Bun install (no cache / no lockfile)'   │ '4.84 seconds'  │   1   │
│    7    │  'NPM install (with cache / no lockfile)'  │ '6.38 seconds'  │   2   │
│    8    │         'PNPM install (no cache)'          │ '13.93 seconds' │   1   │
│    9    │    'YARN install (with cache, no lock)'    │ '21.48 seconds' │   2   │
│   10    │         'SNPM install (no cache)'          │ '27.03 seconds' │   1   │
│   11    │   'YARN install (no cache, no lockfile)'   │ '43.30 seconds' │   1   │
│   12    │   'NPM install (no cache / no lockfile)'   │ '44.94 seconds' │   1   │
└─────────┴────────────────────────────────────────────┴─────────────────┴───────┘
```

### Nextjs - TS
This example is generated using `npx create-next-app --use-npm --ts`

WARNING: It works now, but some errors may appear.

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │        'SNPM install (with cache)'         │ '1.92 seconds'  │
│    1    │        'PNPM install (with cache)'         │ '6.42 seconds'  │
│    2    │ 'NPM install (with cache / with lockfile)' │ '7.40 seconds'  │
│    3    │  'NPM install (with cache / no lockfile)'  │ '10.02 seconds' │
│    4    │         'PNPM install (no cache)'          │ '20.61 seconds' │
│    5    │         'SNPM install (no cache)'          │ '20.98 seconds' │
│    6    │   'NPM install (no cache / no lockfile)'   │ '24.61 seconds' │
└─────────┴────────────────────────────────────────────┴─────────────────┘
```

### Create React App - Craco

WARNING: Currently CRA doesn't work with symlinked dependencies.

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │        'SNPM install (with cache)'         │ '2.02 seconds'  │
│    1    │        'PNPM install (with cache)'         │ '6.77 seconds'  │
│    2    │ 'NPM install (with cache / with lockfile)' │ '15.53 seconds' │
│    3    │  'NPM install (with cache / no lockfile)'  │ '22.59 seconds' │
│    4    │         'PNPM install (no cache)'          │ '30.41 seconds' │
│    5    │         'SNPM install (no cache)'          │ '1.03 minutes'  │
│    6    │   'NPM install (no cache / no lockfile)'   │ '1.49 minutes'  │
└─────────┴────────────────────────────────────────────┴─────────────────┘
```

The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files (SNPM uses them too [npm/pacote](https://github.com/npm/pacote)) and also deletes the store folder for SNPM.

