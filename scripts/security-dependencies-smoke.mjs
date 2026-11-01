import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const consumers = {
  Jest: ["jest", "@jest/core", "jest-config"],
  "React Email": ["react-email", "@react-email/render", "html-to-text"],
};

// Resolve each consumer's transitive copy instead of adding a root dependency.
for (const [consumer, chain] of Object.entries(consumers)) {
  let require = createRequire(import.meta.url);
  for (const name of chain) {
    require = createRequire(require.resolve(name));
  }
  const entry = require.resolve("deepmerge");
  const packageRequire = createRequire(entry);
  const bundles = {
    CommonJS: require("deepmerge"),
    UMD: packageRequire("./umd.js"),
  };

  for (const [bundle, merge] of Object.entries(bundles)) {
    test(`${consumer} ${bundle} rejects prototype poisoning from either input`, () => {
      const poisoned = JSON.parse('{"safe":1,"__proto__":{"polluted":true}}');
      for (const [target, source] of [
        [poisoned, {}],
        [Object.create(null), poisoned],
        [{ nested: poisoned }, {}],
      ]) {
        const result = merge(target, source);
        const value = result.nested ?? result;
        assert.equal(Object.getPrototypeOf(value), Object.prototype);
        assert.equal(value.polluted, undefined);
        assert.equal(Object.hasOwn(value, "__proto__"), false);
        assert.equal(value.safe, 1);
      }
      assert.equal({}.polluted, undefined);
    });

    test(`${consumer} ${bundle} preserves normal nested, array and symbol merges`, () => {
      const symbol = Symbol("kept");
      const result = merge(
        { nested: { a: 1 }, items: [1], [symbol]: "value" },
        { nested: { b: 2 }, items: [2] },
      );
      assert.deepEqual(result.nested, { a: 1, b: 2 });
      assert.deepEqual(result.items, [1, 2]);
      assert.equal(result[symbol], "value");
    });
  }
}
