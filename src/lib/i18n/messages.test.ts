import enMessages from "@/messages/en.json";
import zhHansMessages from "@/messages/zh-Hans.json";
import {
  MARKETING_CLIENT_MESSAGE_KEYS,
  loadMarketingMessages,
} from "./messages";

describe("marketing client messages", () => {
  it.each([
    ["en", enMessages],
    ["zh-Hans", zhHansMessages],
  ] as const)(
    "keeps the %s catalog complete and intentionally small",
    async (locale, catalog) => {
      const messages = await loadMarketingMessages(locale);

      expect(Object.keys(messages)).toEqual([...MARKETING_CLIENT_MESSAGE_KEYS]);
      expect(Object.keys(messages).length).toBeLessThan(
        Object.keys(catalog).length / 5,
      );

      for (const key of MARKETING_CLIENT_MESSAGE_KEYS) {
        expect(messages[key]).toBe(catalog[key]);
      }
    },
  );
});
