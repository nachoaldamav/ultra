import ora, { Ora } from "ora";
import chalk from "chalk";

const gradientColors = [
  "#3E3B92",
  "#4A3C90",
  "#553C8D",
  "#613D8B",
  "#6C3D88",
  "#833E83",
  "#993F7E",
  "#B04079",
  "#C74174",
  "#F44369",
];

export const rocketAscii = "■■";

const referenceGradient = [
  ...gradientColors,
  ...[...gradientColors].reverse(),
  ...gradientColors,
];

function getGradientAnimFrames() {
  const frames = [];
  for (let start = 0; start < gradientColors.length * 2; start++) {
    const end = start + gradientColors.length - 1;
    frames.push(
      referenceGradient
        .slice(start, end)
        .map((g) => chalk.hex(g).bold(">"))
        .join("")
    );
  }
  return frames;
}

export function spinnerGradient(text: string): Ora {
  const spinner = ora({
    spinner: {
      interval: 80,
      frames: getGradientAnimFrames(),
    },
    text: `${text}`,
  }).start();

  return spinner;
}
