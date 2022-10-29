import { Link } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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
    <div className="flex h-fit w-full flex-col bg-[#18181B]">
      <section
        id="hero"
        className="flex h-full min-h-screen w-full flex-1 flex-col items-center justify-center z-[2]"
      >
        <div className="flex flex-col relative h-28 justify-center items-center">
          <AnimatePresence>
            <motion.h1
              className="font-extrabold text-8xl title-gradient text-center font-azonix mb-5 w-fit absolute z-20"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.75 }}
              id="ultra-pkg"
              layoutId="ultra-pkg"
            >
              VLTRA
            </motion.h1>
            <motion.h1
              className="font-extrabold text-8xl title-gradient-blurred text-center font-azonix mb-5 absolute z-10"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.75 }}
              id="ultra-pkg"
              layoutId="ultra-pkg"
            >
              VLTRA
            </motion.h1>
          </AnimatePresence>
        </div>
        <p className="text-xl text-[#A1A1AA]">A really fast package manager</p>
        <Snippet />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center mb-10">
          <div className="flex flex-col items-center justify-center">
            <a
              href="https://www.producthunt.com/posts/ultra-241a7c40-a06f-450e-abac-321f614e6bee?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-ultra&#0045;241a7c40&#0045;a06f&#0045;450e&#0045;abac&#0045;321f614e6bee"
              target="_blank"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=363463&theme=dark"
                alt="Ultra - Fast&#0032;JavaScript&#0032;package&#0032;manager | Product Hunt"
                style={{ width: "250px", height: "54px" }}
                width="250"
                height="54"
              />
            </a>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="mb-10 flex h-full w-full flex-1 flex-col items-center justify-start"
      >
        <div className="mt-6 flex w-full flex-col md:flex-row flex-wrap justify-center gap-4 px-4">
          <Feature
            title="Fast"
            description="ULTRA is developed with speed in mind."
          />
          <Feature
            title="Lightweight"
            description="ULTRA uses hardlinks to install packages, saving a lot of your disk space."
          />
          <Feature
            title="Open Source"
            description="ULTRA is open source, so you can contribute."
          />
        </div>
      </section>
      <section
        id="demo"
        className="flex h-full w-full flex-1 flex-col items-center justify-start mt-10"
      >
        <div className="flex flex-col items-left justify-center mb-4">
          <h2 className="text-xl font-bold text-white">How it works</h2>
          <p className="text-lg text-[#A1A1AA] text-center">
            This demo shows how shared dependencies are handled.
          </p>
        </div>
        <iframe
          src="https://player.vimeo.com/video/759983180?h=1ac1372daa&title=0&byline=0&portrait=0"
          style={{
            // position: "absolute",
            aspectRatio: "16/9",
            top: 0,
            left: 0,
            width: "65%",
            height: "100%",
            borderRadius: "10px",
            overflow: "hidden",
          }}
          className="shadow-xl"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen={true}
        ></iframe>
        <script src="https://player.vimeo.com/api/player.js"></script>
      </section>
      <section
        id="comparison"
        className="flex h-full my-10 w-full flex-1 flex-col items-center justify-start gap-2 p-10"
      >
        <div className="flex flex-col items-left justify-center">
          <h2 className="text-xl font-bold text-white">Comparison</h2>
          <p className="text-lg text-[#A1A1AA] text-center">
            Here&apos;s a comparison between{" "}
            <span className="text-[#FAFAFA] font-bold">ULTRA</span> and other
            package managers in a project with many dependencies.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mt-4">
          {[3, 2, 1].map((i) => (
            <button
              key={i}
              className={`${
                group === i
                  ? "text-white border border-transparent border-b-white"
                  : "text-[#71717A] border border-transparent border-b-[#27272A]"
              } px-4 py-2`}
              onClick={() => setGroup(i)}
            >
              {GROUPS[i]}
            </button>
          ))}
        </div>
        <Graph group={group} />
      </section>
      <section
        id="get-started"
        className="flex h-full w-full flex-1 flex-col items-center justify-start mt-10 min-h-[20vh]"
      >
        <div className="flex flex-col items-left justify-center mb-4 gap-6 w-1/2">
          <h2 className="text-xl font-bold text-white">
            Do you want to know more?
          </h2>
          <nav className="flex items-center gap-4">
            <Link
              to={"/docs/get-started"}
              className="get-started-button self-start"
            >
              <span className="get-started-text text-lg font-semibold">
                Get started
              </span>
            </Link>
            <a
              href="https://github.com/nachoaldamav/ultra"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 px-6 py-3 rounded-md text-neutral-400 text-lg"
            >
              View on Github
            </a>
          </nav>
        </div>
      </section>
      <footer className="w-full">
        <div className="w-full max-w-[65%] flex items-center justify-end mx-auto py-6">
          <p className="text-sm font-medium text-neutral-500">
            Designed by{" "}
            <a
              href="https://davidponc.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400"
            >
              davidponc
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
