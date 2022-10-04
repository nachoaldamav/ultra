import { useEffect } from "react";
import { useAnimation, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const normalClassname = "h-8 rounded rounded-l-none bg-[#40916c]";
const ultraClassname = "fnpm-gradient h-8 rounded rounded-l-none";

const data = [
  {
    name: "Bun install (with cache / with lockfile)",
    value: 590.2233690023422,
    group: 3,
  },
  {
    name: "⚡ULTRA install (with cache / with lockfile)",
    value: 1473.6944079995155,
    group: 3,
  },
  {
    name: "⚡ULTRA install (with cache / no lockfile)",
    value: 2239.2958200015128,
    group: 2,
  },
  {
    name: "Bun install (with cache / no lockfile)",
    value: 4271.9011339992285,
    group: 2,
  },
  {
    name: "PNPM install (with cache / with lockfile)",
    value: 6619.739090997726,
    group: 3,
  },
  {
    name: "Bun install (no cache / no lockfile)",
    value: 9589.16665700078,
    group: 1,
  },
  {
    name: "YARN install (with cache / with lockfile)",
    value: 15465.913534000516,
    group: 3,
  },
  {
    name: "PNPM install (with cache / no lockfile)",
    value: 15906.347776997834,
    group: 2,
  },
  {
    name: "NPM install (with cache / with lockfile)",
    value: 16611.494623001665,
    group: 3,
  },
  {
    name: "NPM install (with cache / no lockfile)",
    value: 22105.03495700285,
    group: 2,
  },
  {
    name: "PNPM install (no cache / no lockfile)",
    value: 26171.97581899911,
    group: 1,
  },
  {
    name: "⚡ULTRA install (no cache / no lockfile)",
    value: 28345.910946000367,
    group: 1,
  },
  {
    name: "YARN install (with cache / no lockfile)",
    value: 96689.2336240001,
    group: 2,
  },
  {
    name: "YARN install (no cache / no lockfile)",
    value: 110266.95983800292,
    group: 1,
  },
  {
    name: "NPM install (no cache / no lockfile)",
    value: 122614.15083800256,
    group: 1,
  },
];

export default function Graph({ group }: { group: number }) {
  const max = Math.max(
    ...data.filter((i) => i.group === group).map((i) => i.value)
  );

  return (
    <div className="mt-10 flex w-full max-w-2xl flex-col gap-2">
      {data
        .filter((d) => d.group === group)
        .sort((a, b) => a.value - b.value)
        .map((item, index) => (
          <div className="flex flex-row items-center gap-2" key={index}>
            <Progress
              value={(item.value / max) * 100}
              time={item.value}
              className={
                item.name.includes("ULTRA") ? ultraClassname : normalClassname
              }
              name={item.name}
            />
          </div>
        ))}
    </div>
  );
}

function Progress({
  value,
  time,
  className,
  name,
}: {
  value: number;
  time: number;
  className: string;
  name: string;
}) {
  const graphAnimation = {
    visible: { width: `${value}%`, transition: { duration: 2, delay: 0.25 } },
    hidden: { width: "0%" },
  };

  const controls = useAnimation();
  const [ref, inView] = useInView();
  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <div className="h-8 w-full rounded-xl rounded-l-none bg-transparent">
      <span className="absolute ml-4 text-xl font-semibold text-white inline-flex">
        {name.split(" i")[0]} {parseTime(time)}
      </span>
      <motion.div
        className={className}
        ref={ref}
        animate={controls}
        initial="hidden"
        variants={graphAnimation}
      />
    </div>
  );
}

function parseTime(ms: number) {
  // Keep ms if less than 1s, otherwise show s
  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  }

  return `${(ms / 1000).toFixed(2)} s`;
}
