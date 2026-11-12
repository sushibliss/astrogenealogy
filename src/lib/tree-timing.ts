/** Shared between the star chart and the pages that wait for it to finish drawing. */
export const MAX_GEN = 4;
/** seconds of sky-drawing before the first generation appears */
export const PRELUDE = 1.5;
/** seconds between one generation and the next */
export const STEP = 1.15;

/** How long the tree takes to draw itself for these pedigree paths. */
export function unveilSeconds(paths: string[]) {
  const maxGen = Math.max(2, ...paths.filter((p) => p.length <= MAX_GEN).map((p) => p.length));
  return PRELUDE + (maxGen + 1) * STEP + 1.4;
}
