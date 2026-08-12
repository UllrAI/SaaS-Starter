import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import ts from "typescript";

const SRC_ROOT = path.join(process.cwd(), "src");
const CATALOG_PATHS = {
  en: path.join(SRC_ROOT, "messages", "en.json"),
  "zh-Hans": path.join(SRC_ROOT, "messages", "zh-Hans.json"),
} as const;
const HASH_KEY = /^[0-9a-f]{12}$/;

function readCatalog(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
}

function readRawCatalogKeys(file: string): string[] {
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line) => {
      const match = line.match(/^ {2}("(?:\\.|[^"])*"):/);
      return match ? [JSON.parse(match[1]!) as string] : [];
    });
}

function messageTokens(message: string): string[] {
  return [
    ...[...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?=\s*(?:,|\}))/g)].map(
      (match) => `icu:${match[1]}`,
    ),
    ...[...message.matchAll(/<\/?([A-Za-z][A-Za-z0-9_]*)>/g)].map(
      (match) => `tag:${match[1]}`,
    ),
  ].toSorted();
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    if (
      !/\.(?:ts|tsx)$/.test(entry.name) ||
      /\.test\.(?:ts|tsx)$/.test(entry.name)
    ) {
      return [];
    }
    return [target];
  });
}

function collectSourceTranslationKeys() {
  const translationKeys = new Set<string>();
  const translationValues: Array<{
    file: string;
    key: string;
    token: string;
  }> = [];
  const hashLiterals: Array<{ file: string; key: string }> = [];

  for (const file of sourceFiles(SRC_ROOT)) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) && HASH_KEY.test(node.text)) {
        hashLiterals.push({
          file: path.relative(process.cwd(), file),
          key: node.text,
        });
      }

      if (ts.isCallExpression(node)) {
        const isPlainTranslation =
          ts.isIdentifier(node.expression) && node.expression.text === "t";
        const isRichTranslation =
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === "t" &&
          node.expression.name.text === "rich";
        const keyArgument = node.arguments[0];

        if (
          (isPlainTranslation || isRichTranslation) &&
          keyArgument &&
          ts.isStringLiteral(keyArgument)
        ) {
          translationKeys.add(keyArgument.text);

          const valuesArgument = node.arguments[1];
          if (valuesArgument && ts.isObjectLiteralExpression(valuesArgument)) {
            for (const property of valuesArgument.properties) {
              if (
                !ts.isPropertyAssignment(property) &&
                !ts.isShorthandPropertyAssignment(property)
              ) {
                continue;
              }

              const name = property.name.getText(source);
              const value = ts.isShorthandPropertyAssignment(property)
                ? property.name
                : property.initializer;
              const isRichValue =
                ts.isArrowFunction(value) || ts.isFunctionExpression(value);

              translationValues.push({
                file: path.relative(process.cwd(), file),
                key: keyArgument.text,
                token: `${isRichValue ? "tag" : "icu"}:${name}`,
              });
            }
          }
        }
      }

      if (
        ts.isPropertyAssignment(node) &&
        node.name.getText(source) === "key" &&
        ts.isStringLiteral(node.initializer) &&
        ts.isObjectLiteralExpression(node.parent) &&
        node.parent.properties.some(
          (property) =>
            ts.isPropertyAssignment(property) &&
            property.name.getText(source) === "fallback",
        )
      ) {
        translationKeys.add(node.initializer.text);
      }

      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "MARKETING_CLIENT_MESSAGE_KEYS" &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        for (const element of node.initializer.elements) {
          if (ts.isStringLiteral(element)) translationKeys.add(element.text);
        }
      }

      ts.forEachChild(node, visit);
    }
    visit(source);
  }

  return { hashLiterals, translationKeys, translationValues };
}

describe("translation catalog integrity", () => {
  const catalogs = {
    en: readCatalog(CATALOG_PATHS.en),
    "zh-Hans": readCatalog(CATALOG_PATHS["zh-Hans"]),
  };

  it("keeps unique keys with exact locale parity", () => {
    for (const file of Object.values(CATALOG_PATHS)) {
      const rawKeys = readRawCatalogKeys(file);
      expect(new Set(rawKeys).size).toBe(rawKeys.length);
    }
    expect(Object.keys(catalogs["zh-Hans"]).toSorted()).toEqual(
      Object.keys(catalogs.en).toSorted(),
    );
  });

  it("keeps ICU placeholders and rich-text tags aligned", () => {
    for (const key of Object.keys(catalogs.en)) {
      expect(messageTokens(catalogs["zh-Hans"][key]!)).toEqual(
        messageTokens(catalogs.en[key]!),
      );
    }
  });

  it("rejects hash translation keys and missing call-site messages", () => {
    const { hashLiterals, translationKeys } = collectSourceTranslationKeys();
    expect(
      Object.keys(catalogs.en).filter((key) => HASH_KEY.test(key)),
    ).toEqual([]);
    expect(hashLiterals).toEqual([]);
    expect(
      [...translationKeys].filter((key) => catalogs.en[key] === undefined),
    ).toEqual([]);
  });

  it("uses ICU placeholders for primitives and rich tags for render functions", () => {
    const { translationValues } = collectSourceTranslationKeys();

    for (const { file, key, token } of translationValues) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        expect({
          file,
          key,
          locale,
          token,
          tokens: messageTokens(catalog[key]!),
        }).toEqual(
          expect.objectContaining({
            tokens: expect.arrayContaining([token]),
          }),
        );
      }
    }
  });
});
