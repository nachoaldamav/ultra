import { Link } from "@remix-run/react";
import Feature from "~/components/featureCard";
import Graph from "~/components/graph";
import Snippet from "~/components/snippet";

export default function Index() {
  return (
    <div className="flex h-fit w-full flex-col bg-primary">
      <section
        id="hero"
        className="flex h-full min-h-screen w-full flex-1 flex-col items-center justify-center"
      >
        <img className="w-64 h-64" src="/images/fnpm@3x.png" alt="logo" />
        <p className="text-xl text-white">A really fast package manager.</p>
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
            description="FNPM is built with speed in mind. It's blazing fast."
          />
          <Feature
            title="Lightweight"
            description="FNPM uses hardlinks to install packages, saving a lot of your disk space."
          />
          <Feature
            title="Edge caching"
            description="FNPM uses edge caching to make your packages even faster."
          />
          <Feature
            title="Open Source"
            description="FNPM is open source, so you can contribute to it."
          />
        </div>
      </section>
      <section
        id="comparison"
        className="flex h-full my-20 w-full flex-1 flex-col items-center justify-start gap-2 p-10"
      >
        <h1 className="text-4xl font-bold text-white">Comparison</h1>
        <p className="text-xl text-white">
          Here&apos;s a comparison between FNPM and other package managers in a
          project with many dependencies.
        </p>
        <Graph />
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
