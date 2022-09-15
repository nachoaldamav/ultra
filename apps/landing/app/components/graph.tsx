import { useEffect } from "react";
import { useAnimation, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const data = [
  {
    name: "NPM (Cache / no lock)",
    value: 18.81,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "Yarn (Cache / no lock)",
    value: 110.4,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  /*   {
    name: "PNPM (No cache)",
    value: 33.39,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  }, */
  {
    name: "FNPM (No cache)",
    value: 55.46,
    className: "fnpm-gradient h-8 rounded rounded-l-none",
  },
  {
    name: "NPM (No cache)",
    value: 151.8,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "Yarn (No cache)",
    value: 123.6,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "Yarn (cache / lock)",
    value: 16.85,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  {
    name: "NPM (cache / lock)",
    value: 18.81,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  },
  /*   {
    name: "PNPM (cache / lock)",
    value: 7.75,
    className: "h-8 rounded rounded-l-none bg-[#40916c]",
  }, */
  {
    name: "FNPM (cache)",
    value: 15.69,
    className: "fnpm-gradient h-8 rounded rounded-l-none",
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
