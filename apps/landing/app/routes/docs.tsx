import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData, Outlet, Link, useLocation } from "@remix-run/react";
import styles from "highlight.js/styles/github-dark-dimmed.css";
import * as gettingStarted from "./docs/get-started.mdx";
import * as commands from "./docs/commands.mdx";
import * as comparison from "./docs/comparison.mdx";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

function docsFromModule(mod: any) {
  return {
    slug: mod.filename.replace(/\.mdx?$/, ""),
    ...mod.attributes.meta,
  };
}

export const loader: LoaderFunction = () => {
  return [
    docsFromModule(gettingStarted),
    docsFromModule(commands),
    docsFromModule(comparison),
  ];
};

export default function Docs() {
  const docs: DocInfo[] = useLoaderData();
  const location = useLocation();

  // Check if the current path is a doc
  const currentDoc = docs.find(
    (doc) => doc.slug === location.pathname.replace("/docs/", "")
  );

  return (
    <div className="flex h-fit min-h-screen pt-24 text-white w-full flex-col bg-primary relative">
      <nav className=" px-2 sm:px-4 py-2.5 bg-secondary fixed w-full z-20 top-0 left-0 border-b border-gray-600">
        <div className="container flex flex-wrap justify-between items-center mx-auto">
          <a href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-white font-azonix">VLTRA</h1>
          </a>
          <div className="flex md:order-2">
            <a
              href="https://github.com/nachoaldamav/ultra"
              target={"_blank"}
              rel="noopener noreferrer"
              className="text-white cursor-pointer bg-accent hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke="transparent"
                fill="white"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <button
              data-collapse-toggle="navbar-sticky"
              type="button"
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="navbar-sticky"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div
            className="hidden justify-between items-center w-full md:flex md:w-auto md:order-1"
            id="navbar-sticky"
          >
            {/* <ul className="flex flex-col p-4 mt-4 bg-gray-50 rounded-lg border border-gray-100 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a
                  href="#"
                  className="block py-2 pr-4 pl-3 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  Contact
                </a>
              </li>
            </ul> */}
          </div>
        </div>
      </nav>
      <main className="flex flex-row justify-start gap-4 px-10">
        <section className="w-1/5 h-fit min-h-screen">
          <ul className="flex flex-col gap-2 fixed w-1/6">
            {docs
              .sort((a, b) => a.order - b.order)
              .map((doc, index) => (
                <li
                  key={index}
                  className={
                    currentDoc?.slug !== doc.slug
                      ? "w-full bg-secondary py-2 px-4 rounded-lg border border-transparent transition duration-300 ease-in-out hover:bg-gray-700"
                      : "w-full py-2 px-4 rounded-lg bg-primary border border-white transition duration-300 ease-in-out hover:bg-secondary"
                  }
                >
                  <Link to={doc.slug} className="w-full block">
                    {doc.title}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
        <article className="mb-24 prose prose-lg prose-invert dark:prose-invert prose-pre:bg-transparent prose-h2:mt-8 prose-pre:m-0 prose-code:after:content-[''] prose-code:before:content-[''] prose-pre:p-0 w-4/5 h-fit min-h-screen">
          <Outlet />
        </article>
      </main>
    </div>
  );
}

type DocInfo = {
  slug: string;
  title: string;
  description: string;
  order: number;
};
