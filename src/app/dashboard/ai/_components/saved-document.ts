export interface SavedDocument {
  fileName: string;
  fileSize: number;
  url: string;
}

/**
 * Reads the file a successful `saveDocument` call produced.
 *
 * The tool reports business failures as `{ error }` on the same successful
 * output, so the shape has to be checked rather than assumed.
 */
export function readSavedDocument(output: unknown): SavedDocument | null {
  if (typeof output !== "object" || output === null) {
    return null;
  }

  const { fileName, fileSize, url } = output as Record<string, unknown>;
  if (
    typeof fileName !== "string" ||
    fileName.length === 0 ||
    typeof fileSize !== "number" ||
    !Number.isFinite(fileSize) ||
    typeof url !== "string"
  ) {
    return null;
  }

  // The URL is rendered as a link, so anything but HTTP(S) is dropped rather
  // than trusted: `javascript:` in an href would execute on click.
  try {
    const { protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") {
      return null;
    }
  } catch {
    return null;
  }

  return { fileName, fileSize, url };
}
