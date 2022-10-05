import { Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import Feature from "~/components/featureCard";
import Graph from "~/components/graph";
import Snippet from "~/components/snippet";

const GROUPS: {
  [key: number]: string;
} = {
  1: "No cache / No lockfile",
  2: "With cache / No lockfile",
  3: "With cache / With lockfile",
};

export default function Index() {
  const [group, setGroup] = useState(3);

  return (
    <div className="flex h-fit w-full flex-col bg-primary">
      <section
        id="hero"
        className="flex h-full min-h-screen w-full flex-1 flex-col items-center justify-center"
      >
        {/* <img className="w-64 h-64" src="/images/fnpm@3x.png" alt="logo" /> */}
        <h1 className="text-8xl font-bold text-center text-white font-azonix mb-5">
          VLTRA
        </h1>
        <p className="text-xl text-white">A really fast package manager</p>
        <Snippet />
      </section>
      <section
        id="features"
        className="mb-10 flex h-full w-full flex-1 flex-col items-center justify-start"
      >
        <h1 className="text-4xl font-bold text-white">Features</h1>
        <div className="mt-6 flex w-full flex-col md:flex-row flex-wrap justify-center gap-4 px-4">
          <Feature
            title="Fast"
            description="ULTRA is built with speed in mind."
          />
          <Feature
            title="Lightweight"
            description="ULTRA uses hardlinks to install packages, saving a lot of your disk space."
          />
          <Feature
            title="Edge caching"
            description="ULTRA registry uses edge caching thanks to Cloudflare."
          />
          <Feature
            title="Open Source"
            description="ULTRA is open source, so you can contribute to it."
          />
        </div>
      </section>
      <section
        id="comparison"
        className="flex h-full my-20 w-full flex-1 flex-col items-center justify-start gap-2 p-10"
      >
        <h1 className="text-4xl font-bold text-white">Comparison</h1>
        <p className="text-xl text-white">
          Here&apos;s a comparison between ULTRA and other package managers in a
          project with many dependencies.
        </p>
        <Graph group={group} />
        <div className="flex flex-row gap-2 mt-10">
          {[3, 2, 1].map((i) => (
            <button
              key={i}
              className={`${
                group === i ? "bg-white text-primary" : "bg-primary text-white"
              } px-4 py-2 rounded`}
              onClick={() => setGroup(i)}
            >
              {GROUPS[i]}
            </button>
          ))}
        </div>
      </section>
      <section
        id="get-started"
        className="flex w-full flex-1 flex-col items-center justify-center gap-2 p-10 bg-secondary"
      >
        <div className="flex flex-col items-center justify-center gap-10 py-24">
          <h1 className="text-4xl font-bold text-white">
            Do you want to know more?
          </h1>
          <Link
            to="/docs/get-started"
            className="text-2xl font-semibold text-white home-gradient px-6 py-3 rounded-lg transition duration-200 ease-in-out"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
