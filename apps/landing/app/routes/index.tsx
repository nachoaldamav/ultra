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
        <h1 className="text-4xl font-bold text-white">Welcome to </h1>
        <h1 className="mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-7xl font-extrabold text-transparent">
          SNPM
        </h1>
        <p className="text-xl text-white">A really fast package manager.</p>
        <Snippet />
      </section>
      <section
        id="features"
        className="mb-10 flex h-full w-full flex-1 flex-col items-center justify-start"
      >
        <h1 className="text-4xl font-bold text-white">Features</h1>
        <div className="mt-6 flex w-full flex-row flex-wrap justify-center gap-4">
          <Feature
            title="Fast"
            description="SNPM is built with speed in mind. It's blazing fast."
          />
          <Feature
            title="Lightweight"
            description="SNPM uses symlinks to install packages, saving a lot of your disk space."
          />
          <Feature
            title="For the future"
            description="It's built with new technologies to make it future proof."
          />
          <Feature
            title="Open Source"
            description="SNPM is open source, so you can contribute to it."
          />
        </div>
      </section>
      <section
        id="comparison"
        className="flex h-full min-h-screen w-full flex-1 flex-col items-center justify-start gap-2 p-10"
      >
        <h1 className="text-4xl font-bold text-white">Comparison</h1>
        <p className="text-xl text-white">
          Here&apos;s a comparison between SNPM and other package managers in a
          full cached install.
        </p>
        <Graph />
      </section>
    </div>
  );
}
