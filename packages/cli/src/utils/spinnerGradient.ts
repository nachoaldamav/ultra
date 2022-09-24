import ora, { Ora } from "ora";
import chalk from "chalk";

const gradientColors = [
  "#F44369",
  "#C74174",
  "#B04079",
  "#993F7E",
  "#833E83",
  "#6C3D88",
  "#613D8B",
  "#553C8D",
  "#4A3C90",
  "#3E3B92",
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

function getIntroAnimFrames() {
  const frames = [];
  for (let end = 1; end <= gradientColors.length; end++) {
    const leadingSpacesArr = Array.from(
      new Array(Math.abs(gradientColors.length - end - 1)),
      () => " "
    );
    const gradientArr = gradientColors
      .slice(0, end)
      .map((g) => chalk.bgHex(g)(" "));
    frames.push([...leadingSpacesArr, ...gradientArr].join(""));
  }
  return frames;
}

export function spinnerGradient(text: string): Ora {
  const frames = getIntroAnimFrames();
  const intro = ora({
    spinner: {
      interval: 30,
      frames,
    },
    text: `${rocketAscii} ${text}`,
  });
  intro.start();
  intro.stop();
  const spinner = ora({
    spinner: {
      interval: 80,
      frames: getGradientAnimFrames(),
    },
    text: `${text}`,
  }).start();

  return spinner;
}
