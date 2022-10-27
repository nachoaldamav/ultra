<div align="center">
  <a href="https://ultrapkg.dev">
  <img width="480" src="https://ultrapkg.dev/images/banner_gh.svg" />
  </a>
  <p><h3><strong>⚡ <strong>Ultra</strong> is a faster and lightweight alternative for NPM</strong></h3></p>
  <a href="https://ultrapkg.dev/docs/get-started">📚 Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/nachoaldamav/ultra/tree/main/examples">📦 Examples</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#-benchmarks">⚡ Benchmarks</a>
  <br /><br />
</div>

## 🚀 Getting Started

> 🚧 This project still in an early stage of development, for now you should only use it to test it.

You will need:

- 🍃 [Node.js v16](https://nodejs.org/en/) or higher.
- 💻 Linux or Mac OS (Partial support for Windows).

### **Install:**

```bash
npm i ultra-pkg -g
```

## 🔭 Commands

| Command                                 | Description                                                             |
| --------------------------------------- | ------------------------------------------------------------------------|
| `ultra install [pkg (optional), flags]` | Install packages.                                                       |
| `ultra run <script> <params>`           | Run script from package.json                                            |
| `ultra create <template> <arguments>`   | Create a project from a template (Similar to npm create).               |
| `ultra benchmark`                       | Tests ULTRA against NPM and PNPM.                                       |
| `ultra clear`                           | Remove .ultra-cache and manifests cache, node_modules and `ultra.lock`. |
| `ultra ls <pkg>`                        | Show versions installed by ULTRA.                                       |
| `ultra remove <pkg>`                    | Remove a dependency from the `package.json`                             |
| `ultra set registry <url>`              | Set default registry                                                    |
| `ultra ci`                              | Installs dependencies from `ultra.lock` without cache (WIP)             |

## 🗒️ Todo

- [ ] Make it work in some JS Frameworks ([Follow progress here](https://github.com/nachoaldamav/ultra/issues?q=is%3Aissue+is%3Aopen+label%3Aframeworks)).
- [ ] Fix monorepos integration (WIP, degradated performance in some repos).

## 🤔 FAQ

- **Why is it faster?**

ULTRA uses the same installation system as PNPM, fetch dependency, download dependency. Without waiting for the rest of the dependencies.

Now you are probably wondering how that makes the space more efficient than in NPM.

Each dependency is a hard link to a common store inside `.ultra-cache`, so all your projects use shared dependencies.

- **It works?**

I've selected some quickstart templates to test ULTRA, and I'm working on make it work in all of them.

If you want to test a template, you can use Next or Vite for example, I've already tested them and it should work.

(If you want to test a template and it doesn't work, please open an issue)

## ⚡ Benchmarks

- **▲ [Next.js](https://nextjs.org/) with TypeScript:**

This example is generated using `npx create-next-app --use-npm --ts`

```bash
  Node.js: v18.10.0
  OS: linux
  ULTRA version: 0.6.9
  Current project: next-ultra (0.1.0)

┌─────────┬─────────────────────────────────────────────────┬──────────┬───────┐
│ (index) │                      name                       │   time   │ group │
├─────────┼─────────────────────────────────────────────────┼──────────┼───────┤
│    0    │   'Bun install (with cache / with lockfile)'    │ '0.17s'  │   3   │
│    1    │   'ULTRA install (with cache / with lockfile)'  │ '0.92s'  │   3   │
│    2    │    'ULTRA install (with cache / no lockfile)'   │ '1.12s'  │   2   │
│    3    │   'PNPM install (with cache / with lockfile)'   │ '3.34s'  │   3   │
│    4    │    'PNPM install (with cache / no lockfile)'    │ '4.58s'  │   2   │
│    5    │   'YARN install (with cache / with lockfile)'   │ '5.12s'  │   3   │
│    6    │   'NPM install (with cache / with lockfile)'    │ '6.02s'  │   3   │
│    7    │    'Bun install (with cache / no lockfile)'     │ '6.74s'  │   2   │
│    8    │    'NPM install (with cache / no lockfile)'     │ '7.81s'  │   2   │
│    9    │     'Bun install (no cache / no lockfile)'      │ '17.12s' │   1   │
│   10    │     'ULTRA install (no cache / no lockfile)'    │ '17.83s' │   1   │
│   11    │     'PNPM install (no cache / no lockfile)'     │ '18.45s' │   1   │
│   12    │    'YARN install (with cache / no lockfile)'    │ '21.30s' │   2   │
│   13    │     'NPM install (no cache / no lockfile)'      │ '24.26s' │   1   │
│   14    │     'YARN install (no cache / no lockfile)'     │ '49.79s' │   1   │
└─────────┴─────────────────────────────────────────────────┴──────────┴───────┘
```

- **[Vite](https://vitejs.dev/) with TypeScript:**

This example is generated using `npx create-vite-app --template react-ts`

```bash
Node.js: v18.10.0
OS: linux
ULTRA version: 0.6.9
Current project: fnpm-vite-demo (0.0.0)

┌─────────┬─────────────────────────────────────────────────┬──────────┬───────┐
│ (index) │                      name                       │   time   │ group │
├─────────┼─────────────────────────────────────────────────┼──────────┼───────┤
│    0    │   'Bun install (with cache / with lockfile)'    │ '0.05s'  │   3   │
│    1    │    'ULTRA install (with cache / no lockfile)'   │ '0.52s'  │   2   │
│    2    │   'ULTRA install (with cache / with lockfile)'  │ '0.56s'  │   3   │
│    3    │   'YARN install (with cache / with lockfile)'   │ '1.35s'  │   3   │
│    4    │   'PNPM install (with cache / with lockfile)'   │ '1.43s'  │   3   │
│    5    │   'NPM install (with cache / with lockfile)'    │ '2.24s'  │   3   │
│    6    │    'NPM install (with cache / no lockfile)'     │ '2.88s'  │   2   │
│    7    │     'Bun install (no cache / no lockfile)'      │ '3.23s'  │   1   │
│    8    │    'PNPM install (with cache / no lockfile)'    │ '3.60s'  │   2   │
│    9    │    'Bun install (with cache / no lockfile)'     │ '3.62s'  │   2   │
│   10    │    'YARN install (with cache / no lockfile)'    │ '6.35s'  │   2   │
│   11    │     'PNPM install (no cache / no lockfile)'     │ '6.58s'  │   1   │
│   12    │     'ULTRA install (no cache / no lockfile)'    │ '7.75s'  │   1   │
│   13    │     'YARN install (no cache / no lockfile)'     │ '11.51s' │   1   │
│   14    │     'NPM install (no cache / no lockfile)'      │ '16.38s' │   1   │
└─────────┴─────────────────────────────────────────────────┴──────────┴───────┘
```

> The commands with no-cache executes `npm cache clean -f` to delete NPM Cache files and runs `ultra clear` to remove Ultra cache folders.

## 🧑‍🤝‍🧑 Contributors

<a href="https://github.com/nachoaldamav/ultra/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nachoaldamav/ultra" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
