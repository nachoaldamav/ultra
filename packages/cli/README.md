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

### Benchmark
This is an example benchmark of a Vite project using `npm create vite@latest my-react-app -- --template react-ts`

```bash
SNPM install (with cache) took 0.71 seconds
NPM install (with cache / with lockfile) took 2.46 seconds
NPM install (with cache / no lockfile) took 3.17 seconds
SNPM install (no cache) took 7.45 seconds
NPM install (no cache / no lockfile) took 7.46 seconds
```
