# SNPM CLI
[![SNPM CLI Benchmark](https://github.com/nachoaldamav/snpm/actions/workflows/tests.yml/badge.svg)](https://github.com/nachoaldamav/snpm/actions/workflows/tests.yml)

This is the CLI for SNPM, is a work in progress and shouldn't be used in production, just for fun.

## How it works

This CLI installs the dependencies in a single folder inside the disk. After that, it creates the symlinks for every dependency and sub-dependency.
In another project inside the same computer, it will use the same downloaded deps because all the dependencies are shared.

## It really works?
The answer is *sometimes*

Currently I tested with the frameworks bellow, and only Vite works, the others have some issues with the symlinks.

## It's faster?
Yes, with no-cache it's faster than NPM (no cache and no lock), with cache (a.k.a. shared folder) it should be always faster than NPM.

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
Check results in Pull Requests comments
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
│    4    │        'SNPM install (with cache)'         │ '5.04 seconds'  │   3   │
│    5    │        'YARN install (with cache)'         │ '5.93 seconds'  │   3   │
│    6    │ 'NPM install (with cache / with lockfile)' │ '6.61 seconds'  │   3   │
│    7    │  'NPM install (with cache / no lockfile)'  │ '8.51 seconds'  │   2   │
│    8    │         'PNPM install (no cache)'          │ '15.87 seconds' │   1   │
│    9    │    'YARN install (with cache, no lock)'    │ '16.07 seconds' │   2   │
│   10    │         'SNPM install (no cache)'          │ '19.05 seconds' │   1   │
│   11    │   'NPM install (no cache / no lockfile)'   │ '22.20 seconds' │   1   │
│   12    │   'YARN install (no cache, no lockfile)'   │ '32.87 seconds' │   1   │
└─────────┴────────────────────────────────────────────┴─────────────────┴───────┘
```

### Create React App - Craco

WARNING: Currently CRA doesn't work with symlinked dependencies.

```bash
Pending...
```

The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files (SNPM uses them too [npm/pacote](https://github.com/npm/pacote)) and also deletes the store folder for SNPM.
