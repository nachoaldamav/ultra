<div align="center">
  <a href="https://ultra.vercel.app/">
  <img src="https://i.imgur.com/hhX5nO1.png" />
  </a>
  <p><h3><strong>⚡ <strong>ultra</strong> is an alternative for NPM, it is faster and saves more space</strong></h3></p>
  <a href="https://ultra.vercel.app/docs/get-started">📚 Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/nachoaldamav/ultra/tree/main/examples">📦 Examples</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#-benchmarks">⚡ Benchmarks</a>
  <br /><br />

</div>

## 🚀 Getting Started

> 🚧 This project was made to learn more about Package Managers, for now you should only use it to play with it.

You will need:

- 🍃 [Nodejs v16](https://nodejs.org/en/) or higher.
- 💻 Linux or Mac OS (Working on Windows support [issue](https://github.com/nachoaldamav/ultra/issues/40)).

### **Install:**

```bash
npm i ultrapkg -g
```

## 🔭 Commands

| Command                                | Description                                             |
| -------------------------------------- | ------------------------------------------------------- |
| `ultra install [pkg (optional), flags]` | Install packages.                                       |
| `ultra run <script> <params>`           | Run script from package.json                            |
| `ultra create <template> <arguments>`   | Create a project from a template (Similar to npm init). |
| `ultra benchmark`                       | Tests ULTRA against NPM and PNPM.                        |
| `ultra clear`                           | Remove .ultra-cache folder.                              |
| `ultra ls <pkg>`                        | Show versions installed by ULTRA.                        |

## 🗒️ Todo

- [ ] Make it work in some JS Frameworks ([Follow progress here](https://github.com/nachoaldamav/ultra/issues?q=is%3Aissue+is%3Aopen+label%3Aframeworks)).
- [ ] Fix monorepos integration (WIP, degradated performance in some repos).

## 🤔 FAQ

- **Why is it faster?**

ULTRA uses the same installation system as PNPM, fetch dependency, download dependency. Without waiting for the rest of the dependencies.

Now you are probably wondering how that makes the space more efficient than in NPM.

Each dependency is a hard link to a common store inside `.ultra-cache`, so all your projects use shared dependencies.

- **It works?**

Short answer, probably no, but in some cases it works. (For now)

I've selected some quickstart templates to test ULTRA, and I'm working on make it work in all of them.

If you want to test a template, you can use Next or Vite, I've already tested them and it should work.

(If you want to test a template and it doesn't work, please open an issue)

## ⚡ Benchmarks

- **▲ [Nextjs](https://nextjs.org/) with Typescript:**

This example is generated using `npx create-next-app --use-npm --ts`

WARNING: It works now, but some errors may appear.

```bash
  Node.js: v18.4.0
  OS: linux
  ULTRA version: 0.4.0
  Current project: ultra-next-test (0.1.0)

┌─────────┬────────────────────────────────────────────┬──────────┬───────┐
│ (index) │                    name                    │   time   │ group │
├─────────┼────────────────────────────────────────────┼──────────┼───────┤
│    0    │ 'Bun install (with cache / with lockfile)' │ '0.17s'  │   3   │
│    1    │  'Bun install (with cache / no lockfile)'  │ '3.83s'  │   2   │
│    2    │        'ULTRA install (with cache)'        │ '4.41s'  │   3   │
│    3    │        'PNPM install (with cache)'         │ '4.66s'  │   3   │
│    4    │        'YARN install (with cache)'         │ '5.56s'  │   3   │
│    5    │ 'NPM install (with cache / with lockfile)' │ '7.01s'  │   3   │
│    6    │  'NPM install (with cache / no lockfile)'  │ '8.30s'  │   2   │
│    7    │   'Bun install (no cache / no lockfile)'   │ '8.85s'  │   1   │
│    8    │    'YARN install (with cache, no lock)'    │ '10.57s' │   2   │
│    9    │         'ULTRA install (no cache)'         │ '19.59s' │   1   │
│   10    │   'NPM install (no cache / no lockfile)'   │ '25.20s' │   1   │
│   11    │   'YARN install (no cache, no lockfile)'   │ '30.00s' │   1   │
│   12    │         'PNPM install (no cache)'          │ '45.77s' │   1   │
└─────────┴────────────────────────────────────────────┴──────────┴───────┘
```

> The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files (ULTRA uses them too [npm/pacote](https://github.com/npm/pacote)) and also deletes the store folder for ULTRA.
