export function defineCopyCatalog<
  const Entries extends readonly { id: string }[],
>(
  entries: Entries,
) {
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));

  return {
    entries,
    get(id: Entries[number]["id"]): Entries[number] {
      const entry = entryMap.get(id);

      if (!entry) {
        throw new Error(`Missing copy catalog entry for "${id}"`);
      }

      return entry as Entries[number];
    },
  };
}
