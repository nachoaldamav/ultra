import { useEffect } from "react";
import { useAnimation, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const data = [
  /*   {
    name: "Bun install (with cache / with lockfile)",
    value: 0.74,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  }, */
  {
    name: "FNPM install (with cache / with lockfile)",
    value: 3.76,
    className: "fnpm-gradient h-8 rounded rounded-l-none",
  },
  {
    name: "FNPM install (with cache / no lockfile)",
    value: 5.99,
    className: "fnpm-gradient h-8 rounded rounded-l-none",
  },
  /*   {
    name: "PNPM install (with cache / with lockfile)",
    value: 6.69,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "Bun install (with cache / no lockfile)",
    value: 9.41,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "Bun install (no cache / no lockfile)",
    value: 12.84,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "PNPM install (with cache / no lockfile)",
    value: 15.53,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  }, */
  {
    name: "NPM install (with cache / with lockfile)",
    value: 17.48,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "NPM install (with cache / no lockfile)",
    value: 22.49,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  /*   {
    name: "PNPM install (no cache / no lockfile)",
    value: 27.89,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  }, */
  {
    name: "YARN install (with cache / with lockfile)",
    value: 28.25,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "YARN install (with cache / no lockfile)",
    value: 105.6,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "FNPM install (no cache / no lockfile)",
    value: 122.4,
    className: "fnpm-gradient h-8 rounded rounded-l-none",
  },
  {
    name: "YARN install (no cache / no lockfile)",
    value: 127.8,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "NPM install (no cache / no lockfile)",
    value: 155.4,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
];

const max = Math.max(...data.map((d) => d.value));

export default function Graph() {
  return (
    <div className="mt-10 flex w-full max-w-2xl flex-col gap-2">
      {data
        .sort((a, b) => a.value - b.value)
        .map((item, index) => (
          <div className="flex flex-row items-center gap-2" key={index}>
            <Progress
              value={(item.value / max) * 100}
              secs={item.value}
              className={item.className}
              name={item.name}
            />
          </div>
        ))}
    </div>
  );
}

function Progress({
  value,
  secs,
  className,
  name,
}: {
  value: number;
  secs: number;
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
        {name} {secs}s
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
