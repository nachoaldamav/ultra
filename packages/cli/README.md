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

#### Vite React - TS
This is an example benchmark of a Vite project using `npm create vite@latest my-react-app -- --template react-ts`

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │        'SNPM install (with cache)'         │ '0.85 seconds'  │
│    1    │        'PNPM install (with cache)'         │ '2.68 seconds'  │
│    2    │ 'NPM install (with cache / with lockfile)' │ '4.96 seconds'  │
│    3    │  'NPM install (with cache / no lockfile)'  │ '7.26 seconds'  │
│    4    │         'PNPM install (no cache)'          │ '15.09 seconds' │
│    5    │         'SNPM install (no cache)'          │ '26.10 seconds' │
│    6    │   'NPM install (no cache / no lockfile)'   │ '33.00 seconds' │
└─────────┴────────────────────────────────────────────┴─────────────────┘
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
