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
npm i fnpm -g
```

### Commands
- `fnpm install [pkg (optional), flags]` Installs packages
- `fnpm run <script> <params>` Run script from package.json
- `fnpm create <template> <arguments>` Create a project from a template (Similar to npm init)
- `fnpm benchmark` Tests SNPM against NPM and PNPM
- `fnpm clear` Remove .snpm-cache folder
- `fnpm ls <pkg>` Show versions installed by SNPM


### Todo
- [ ] Make it work in some JS Frameworks ([Follow progress here](https://github.com/nachoaldamav/snpm/issues?q=is%3Aissue+is%3Aopen+label%3Aframeworks))
- [ ] Fix monorepos integration (WIP, degradated performance in some repos)

### Why is it faster?
SNPM uses the same installation system as PNPM, fetch dependency, download dependency. Without waiting for the rest of the dependencies.

Now you are probably wondering how that makes the space more efficient than in NPM.

Each dependency is a hard link to a common store inside `.fnpm-cache`, so all your projects use shared dependencies.

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
│    2    │        'fnpm install (with cache)'         │ '4.94 seconds'  │
│    3    │   'Bun install (no cache / no lockfile)'   │ '9.90 seconds'  │
│    4    │        'PNPM install (with cache)'         │ '10.16 seconds' │
│    5    │ 'NPM install (with cache / with lockfile)' │ '27.29 seconds' │
│    6    │  'NPM install (with cache / no lockfile)'  │ '35.34 seconds' │
│    7    │        'YARN install (with cache)'         │ '43.62 seconds' │
│    8    │         'fnpm install (no cache)'          │ '1.02 minutes'  │
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
│    1    │        'FNPM install (with cache)'         │ '0.93 seconds'  │   3   │
│    2    │        'PNPM install (with cache)'         │ '2.87 seconds'  │   3   │
│    3    │        'YARN install (with cache)'         │ '3.91 seconds'  │   3   │
│    4    │  'Bun install (with cache / no lockfile)'  │ '4.73 seconds'  │   2   │
│    5    │ 'NPM install (with cache / with lockfile)' │ '4.82 seconds'  │   3   │
│    6    │   'Bun install (no cache / no lockfile)'   │ '4.84 seconds'  │   1   │
│    7    │  'NPM install (with cache / no lockfile)'  │ '6.38 seconds'  │   2   │
│    8    │         'PNPM install (no cache)'          │ '13.93 seconds' │   1   │
│    9    │    'YARN install (with cache, no lock)'    │ '21.48 seconds' │   2   │
│   10    │         'FNPM install (no cache)'          │ '27.03 seconds' │   1   │
│   11    │   'YARN install (no cache, no lockfile)'   │ '43.30 seconds' │   1   │
│   12    │   'NPM install (no cache / no lockfile)'   │ '44.94 seconds' │   1   │
└─────────┴────────────────────────────────────────────┴─────────────────┴───────┘
```

### Nextjs - TS
This example is generated using `npx create-next-app --use-npm --ts`

WARNING: It works now, but some errors may appear.

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┬───────┐
│ (index) │                    name                    │      time       │ group │
├─────────┼────────────────────────────────────────────┼─────────────────┼───────┤
│    0    │ 'Bun install (with cache / with lockfile)' │ '0.23 seconds'  │   3   │
│    1    │   'Bun install (no cache / no lockfile)'   │ '3.37 seconds'  │   1   │
│    2    │        'PNPM install (with cache)'         │ '3.47 seconds'  │   3   │
│    3    │  'Bun install (with cache / no lockfile)'  │ '3.79 seconds'  │   2   │
│    4    │        'FNPM install (with cache)'         │ '5.04 seconds'  │   3   │
│    5    │        'YARN install (with cache)'         │ '5.93 seconds'  │   3   │
│    6    │ 'NPM install (with cache / with lockfile)' │ '6.61 seconds'  │   3   │
│    7    │  'NPM install (with cache / no lockfile)'  │ '8.51 seconds'  │   2   │
│    8    │         'PNPM install (no cache)'          │ '15.87 seconds' │   1   │
│    9    │    'YARN install (with cache, no lock)'    │ '16.07 seconds' │   2   │
│   10    │         'FNPM install (no cache)'          │ '19.05 seconds' │   1   │
│   11    │   'NPM install (no cache / no lockfile)'   │ '22.20 seconds' │   1   │
│   12    │   'YARN install (no cache, no lockfile)'   │ '32.87 seconds' │   1   │
└─────────┴────────────────────────────────────────────┴─────────────────┴───────┘
```

### Remix - TS
Created using `npx create-remix`

|                   Name                   |  Time  | Group |
| :--------------------------------------: | :----: | :---: |
| Bun install (with cache / with lockfile) |  0.43s |   3   |
|         PNPM install (with cache)        |  2.09s |   3   |
|  Bun install (with cache / no lockfile)  |  6.30s |   2   |
|         FNPM install (with cache)        |  6.54s |   3   |
|         YARN install (with cache)        | 10.47s |   3   |
| NPM install (with cache / with lockfile) | 10.86s |   3   |
|   Bun install (no cache / no lockfile)   | 13.28s |   1   |
|  NPM install (with cache / no lockfile)  | 16.07s |   2   |
|          FNPM install (no cache)         | 25.12s |   1   |
|    YARN install (with cache, no lock)    | 29.42s |   2   |
|   YARN install (no cache, no lockfile)   | 48.50s |   1   |
|   NPM install (no cache / no lockfile)   | 52.56s |   1   |
|          PNPM install (no cache)         | 59.61s |   1   |

### Create React App - Craco

> Currently CRA is not compatible.


The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files (SNPM uses them too [npm/pacote](https://github.com/npm/pacote)) and also deletes the store folder for FNPM.

