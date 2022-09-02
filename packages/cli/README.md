# SNPM CLI
This is the CLI for SNPM, is a work in progress and shouldn't be used in production, just for fun.

## How it works

This CLI installs the dependencies in a single folder inside the disk. After that, it creates the symlinks for every dependency and sub-dependency.
In another project inside the same computer, it will use the same downloaded deps because all the dependencies are shared.

## It really works?
The answer is *sometimes*

Currently I only tested with a Vite starter project and it works.

## It's faster?
Yes, with no-cache it's faster than NPM (no cache and no lock), with cache (a.k.a. shared folder) it should be always faster than NPM.

### Benchmarks

#### Vite React - TS
This is an example benchmark of a Vite project using `npm create vite@latest my-react-app -- --template react-ts`

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │        'SNPM install (with cache)'         │ '0.73 seconds'  │
│    1    │        'PNPM install (with cache)'         │ '1.41 seconds'  │
│    2    │ 'NPM install (with cache / with lockfile)' │ '2.54 seconds'  │
│    3    │  'NPM install (with cache / no lockfile)'  │ '3.20 seconds'  │
│    4    │         'PNPM install (no cache)'          │ '8.53 seconds'  │
│    5    │         'SNPM install (no cache)'          │ '8.54 seconds'  │
│    6    │   'NPM install (no cache / no lockfile)'   │ '10.14 seconds' │
└─────────┴────────────────────────────────────────────┴─────────────────┘
```

### Nextjs - TS
This example is generated using `npx create-next-app --use-npm --ts`

WARNING: I'm currently fixing some errors related with the symlinks.

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │        'SNPM install (with cache)'         │ '1.57 seconds'  │
│    1    │        'PNPM install (with cache)'         │ '4.70 seconds'  │
│    2    │ 'NPM install (with cache / with lockfile)' │ '8.98 seconds'  │
│    3    │  'NPM install (with cache / no lockfile)'  │ '11.49 seconds' │
│    4    │         'PNPM install (no cache)'          │ '27.55 seconds' │
│    5    │         'SNPM install (no cache)'          │ '31.67 seconds' │
│    6    │   'NPM install (no cache / no lockfile)'   │ '42.55 seconds' │
└─────────┴────────────────────────────────────────────┴─────────────────┘
```

### Create React App - Craco

WARNING: Currently CRA doesn't work with symlinked dependencies.

```bash
┌─────────┬────────────────────────────────────────────┬─────────────────┐
│ (index) │                    name                    │      time       │
├─────────┼────────────────────────────────────────────┼─────────────────┤
│    0    │        'SNPM install (with cache)'         │ '0.79 seconds'  │
│    1    │        'PNPM install (with cache)'         │ '6.70 seconds'  │
│    2    │ 'NPM install (with cache / with lockfile)' │ '15.48 seconds' │
│    3    │  'NPM install (with cache / no lockfile)'  │ '21.63 seconds' │
│    4    │         'PNPM install (no cache)'          │ '23.37 seconds' │
│    5    │         'SNPM install (no cache)'          │ '1.24 minutes'  │
│    6    │   'NPM install (no cache / no lockfile)'   │ '1.73 minutes'  │
└─────────┴────────────────────────────────────────────┴─────────────────┘
```

The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files (SNPM uses them too [npm/pacote](https://github.com/npm/pacote)) and also deletes the store folder for SNPM.
