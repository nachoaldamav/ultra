import { useEffect } from 'react';
import { useAnimation, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const normalClassname = 'h-7 rounded rounded-l-none bg-[#27272A]';
const ultraClassname = 'graph-gradient h-8 rounded rounded-l-none';

const data = [
  {
    name: 'Bun install (with cache / with lockfile)',
    value: 513.2528640000382,
    group: 3,
  },
  {
    name: 'ULTRA install (with cache / with lockfile)',
    value: 1805.003108999983,
    group: 3,
  },
  {
    name: 'ULTRA install (with cache / no lockfile)',
    value: 2087.2459210000234,
    group: 2,
  },
  {
    name: 'Bun install (with cache / no lockfile)',
    value: 4031.210407000035,
    group: 2,
  },
  {
    name: 'PNPM install (with cache / with lockfile)',
    value: 5278.861431999947,
    group: 3,
  },
  {
    name: 'Bun install (no cache / no lockfile)',
    value: 7681.229542999994,
    group: 1,
  },
  {
    name: 'PNPM install (with cache / no lockfile)',
    value: 8998.579411000013,
    group: 2,
  },
  {
    name: 'YARN install (with cache / with lockfile)',
    value: 10119.531701,
    group: 3,
  },
  {
    name: 'NPM install (with cache / with lockfile)',
    value: 14017.806435999984,
    group: 3,
  },
  {
    name: 'NPM install (with cache / no lockfile)',
    value: 20109.939749000012,
    group: 2,
  },
  {
    name: 'PNPM install (no cache / no lockfile)',
    value: 24090.706487999996,
    group: 1,
  },
  {
    name: 'YARN install (with cache / no lockfile)',
    value: 25640.13218299998,
    group: 2,
  },
  {
    name: 'ULTRA install (no cache / no lockfile)',
    value: 32699.450969999947,
    group: 1,
  },
  {
    name: 'YARN install (no cache / no lockfile)',
    value: 45361.97289099998,
    group: 1,
  },
  {
    name: 'NPM install (no cache / no lockfile)',
    value: 46014.098880000005,
    group: 1,
  },
];

export default function Graph({ group }: { group: number }) {
  const max =
    Math.max(...data.filter((i) => i.group === group).map((i) => i.value)) *
    1.6;
  const controls = useAnimation();

  useEffect(() => {
    controls.start('visible');
  }, [group]);

  return (
    <div className="mt-10 flex w-full max-w-2xl flex-col gap-2 relative">
      {data
        .filter((d) => d.group === group)
        .sort((a, b) => a.value - b.value)
        .map((item, index) => (
          <div className="flex flex-row items-center gap-2" key={index}>
            <Progress
              value={(item.value / max) * 100}
              time={item.value}
              className={
                item.name.includes('ULTRA') ? ultraClassname : normalClassname
              }
              name={item.name}
              controls={controls}
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
  controls,
}: {
  value: number;
  time: number;
  className: string;
  name: string;
  controls: any;
}) {
  const graphAnimation = {
    visible: { width: `${value}%`, transition: { duration: 2, delay: 0.25 } },
    hidden: { width: '0%' },
  };

  const [ref, inView] = useInView();
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <div className="h-8 w-full rounded-xl rounded-l-none bg-transparent flex flex-row items-center gap-1">
      <span className="text-sm font-semibold text-[#A1A1AA] w-14 lowercase">
        {name.split(' i')[0]}
      </span>
      {name.includes('ULTRA') ? (
        <motion.div
          className="relative h-7 rounded rounded-l-none"
          animate={controls}
          initial="hidden"
          variants={graphAnimation}
        >
          <div className="absolute rounded rounded-l-none ultra-graph-bg z-20" />
          <div className="absolute top-0 left-0 h-full w-full rounded rounded-l-none ultra-graph-border z-10" />
        </motion.div>
      ) : (
        <motion.div
          className={className}
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={graphAnimation}
          id={name}
        />
      )}
      <span
        className={
          !name.includes('ULTRA')
            ? 'text-sm font-semibold text-[#A1A1AA]'
            : 'text-sm font-semibold text-[#F44369]'
        }
      >
        {parseTime(time)}
      </span>
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
