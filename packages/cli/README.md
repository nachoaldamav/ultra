# SNPM CLI
This is the CLI for SNPM, is a work in progress and shouldn't be used in production, just for fun.

## How it works

This CLI installs the dependencies in a single folder inside the disk. After that, it creates the symlinks for every dependency and sub-dependency.
In another project inside the same computer, it will use the same downloaded deps because all the dependencies are shared.

## It really works?
The answer is *NO*

I'm working on making it work in a Vite starting project, but it doesn't work probably because of the symlinks.

## It's faster?
Yes, with no-cache it's faster than NPM (no cache and no lock), with cache (a.k.a. shared folder) it should be always faster than NPM.
