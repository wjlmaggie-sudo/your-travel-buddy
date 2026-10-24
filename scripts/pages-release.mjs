/** One published product: only a clean build of the current GitHub main may replace Pages. */
export function assertPagesRelease({ head, main, dirty, release }) {
  if (head !== main)
    throw new Error(
      "Publishing blocked: this checkout is not the current GitHub main. Merge all changes into main and push before publishing.",
    );
  if (dirty)
    throw new Error(
      "Publishing blocked: commit your source changes, then rebuild from the clean main commit.",
    );
  if (!release || release.sourceCommit !== head || release.dirty !== false)
    throw new Error(
      "Publishing blocked: dist does not contain a clean build of this commit. Run the Pages build again after committing.",
    );
}
