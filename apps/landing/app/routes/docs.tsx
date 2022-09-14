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
            <img
              className="w-auto h-10"
              src="/images/navbar-fnpm.png"
              alt="FNPM"
            />
          </a>
          <div className="flex md:order-2">
            <button
              type="button"
              className="text-white bg-accent hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0"
            >
              Get started
            </button>
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
            <ul className="flex flex-col p-4 mt-4 bg-gray-50 rounded-lg border border-gray-100 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
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
            </ul>
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
