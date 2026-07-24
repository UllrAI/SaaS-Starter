import { Fragment, createElement, type ReactNode } from "react";

type RichTag = (chunks: ReactNode) => ReactNode;
type RichValue = ReactNode | Date | RichTag;
type RichValues = Record<string, RichValue>;
type IntlRichValue = string | number | Date | RichTag;
type IntlRichValues = Record<string, IntlRichValue>;

type IntlTranslator = {
  (key: string): string;
  has(key: string): boolean;
  rich(key: string, values?: IntlRichValues): ReactNode;
  raw(key: string): unknown;
};

export type AppTranslate = {
  (key: string, fallback: string): string;
  (key: string, fallback: string, values: RichValues): ReactNode;
};

function renderFallbackValue(value: RichValue | undefined): ReactNode {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === "function" ? value(null) : value;
}

function renderFallback(message: string, values: RichValues): ReactNode {
  const tokenPattern =
    /<([A-Za-z][A-Za-z0-9_]*)>([\s\S]*?)<\/\1>|\{([A-Za-z][A-Za-z0-9_]*)\}/;
  const match = tokenPattern.exec(message);
  if (!match || match.index === undefined) {
    return message;
  }

  const before = message.slice(0, match.index);
  const after = message.slice(match.index + match[0].length);
  const tagName = match[1];
  const argumentName = match[3];
  let replacement: ReactNode;

  if (tagName) {
    const value = values[tagName];
    const children = renderFallback(match[2] ?? "", values);
    replacement =
      typeof value === "function"
        ? value(children)
        : (renderFallbackValue(value) ?? children);
  } else {
    replacement = renderFallbackValue(values[argumentName]);
  }

  return createElement(
    Fragment,
    null,
    before,
    replacement,
    renderFallback(after, values),
  );
}

export function createAppTranslate(translator: unknown): AppTranslate {
  const intlTranslator = translator as IntlTranslator;

  function translate(key: string, fallback: string): string;
  function translate(
    key: string,
    fallback: string,
    values: RichValues,
  ): ReactNode;
  function translate(
    key: string,
    fallback: string,
    values?: RichValues,
  ): ReactNode {
    if (!intlTranslator.has(key)) {
      return values ? renderFallback(fallback, values) : fallback;
    }

    if (!values) {
      return intlTranslator(key);
    }

    const message = intlTranslator.raw(key);
    const richValues = Object.fromEntries(
      Object.entries(values).map(([name, value]) => [
        name,
        typeof value === "function" ||
        (typeof message === "string" && !message.includes(`<${name}>`))
          ? value
          : () => (value instanceof Date ? value.toISOString() : value),
      ]),
    ) as IntlRichValues;

    return intlTranslator.rich(key, richValues);
  }

  return translate;
}
