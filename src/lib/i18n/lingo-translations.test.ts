const mockGetServerTranslations = jest.fn();

jest.mock("@lingo.dev/compiler/react/server", () => ({
  getServerTranslations: mockGetServerTranslations,
}));

import { loadLingoTranslations } from "./lingo-translations";

describe("loadLingoTranslations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads translations through the Lingo server API", async () => {
    mockGetServerTranslations.mockResolvedValue({
      translations: {
        "207b6bbb9a5c": "立即开始",
      },
    });

    await expect(loadLingoTranslations("zh-Hans")).resolves.toEqual({
      "207b6bbb9a5c": "立即开始",
    });

    expect(mockGetServerTranslations).toHaveBeenCalledWith({
      locale: "zh-Hans",
    });
  });

  it("returns an empty dictionary when Lingo has no translations", async () => {
    mockGetServerTranslations.mockResolvedValue({
      translations: {},
    });

    await expect(loadLingoTranslations("en")).resolves.toEqual({});
  });
});
