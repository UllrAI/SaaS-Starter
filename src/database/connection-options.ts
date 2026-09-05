const utcTimestamp = {
  to: 1114,
  from: [1114],
  serialize: (value: Date | string) =>
    (value instanceof Date ? value : new Date(value))
      .toISOString()
      .replace("T", " ")
      .replace("Z", ""),
  parse: (value: string) => new Date(`${value.replace(" ", "T")}Z`),
};

export const utcConnectionOptions = {
  connection: {
    TimeZone: "UTC",
  },
  types: {
    utcTimestamp,
  },
};
