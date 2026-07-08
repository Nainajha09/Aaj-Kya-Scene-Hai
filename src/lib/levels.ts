export const LEVELS = [
  { min: 0, name: "Scene Lurker" },
  { min: 50, name: "Scene Starter" },
  { min: 150, name: "Scene Regular" },
  { min: 300, name: "Scene Connector" },
  { min: 600, name: "Scene Legend" },
];

export function levelFor(score: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (score >= lvl.min) current = lvl;
  }
  return current;
}

export function nextLevel(score: number) {
  return LEVELS.find((lvl) => lvl.min > score) ?? null;
}
