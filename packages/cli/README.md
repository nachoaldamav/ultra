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
SNPM install (with cache) took 0.86 seconds
NPM install (with cache / with lockfile) took 2.33 seconds
NPM install (with cache / no lockfile) took 2.82 seconds
SNPM install (no cache) took 6.82 seconds
NPM install (no cache / no lockfile) took 7.14 seconds
```

### Nextjs - TS
This example is generated using `npx create-next-app --use-npm --ts`

WARNING: I'm currently fixing some errors related with the symlinks.

```bash
SNPM install (with cache) took 0.91 seconds
NPM install (with cache / with lockfile) took 6.44 seconds
NPM install (with cache / no lockfile) took 7.47 seconds
SNPM install (no cache) took 16.74 seconds
NPM install (no cache / no lockfile) took 21.41 seconds
```

### Create React App - Craco

WARNING: Currently CRA doesn't work with symlinked dependencies.

```
SNPM install (with cache) took 1.35 seconds
NPM install (with cache / with lockfile) took 15.19 seconds
NPM install (with cache / no lockfile) took 20.64 seconds
SNPM install (no cache) took 56.56 seconds
NPM install (no cache / no lockfile) took 66.27 seconds
```

The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files (SNPM uses them too [npm/pacote](https://github.com/npm/pacote)) and also deletes the store folder for SNPM.
