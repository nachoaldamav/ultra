import { useEffect } from "react";
import { useAnimation, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const data = [
  {
    name: "NPM (Cache / no lock)",
    value: 2.85,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "Yarn (Cache / no lock)",
    value: 3.82,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "PNPM (No cache)",
    value: 6.7,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "SNPM (No cache)",
    value: 6.22,
    className:
      "bg-gradient-to-r from-purple-400 to-pink-600 h-8 rounded rounded-l-none",
  },
  {
    name: "NPM (No cache)",
    value: 5.66,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "Yarn (No cache)",
    value: 8.02,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "Yarn (cache / lock)",
    value: 2.17,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "NPM (cache / lock)",
    value: 1.87,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "PNPM (cache / lock)",
    value: 1.53,
    className: "h-8 rounded rounded-l-none bg-blue-600",
  },
  {
    name: "SNPM (cache)",
    value: 1.46,
    className:
      "bg-gradient-to-r from-purple-400 to-pink-600 h-8 rounded rounded-l-none",
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
      <span className="absolute ml-4 text-xl font-semibold text-white">
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
