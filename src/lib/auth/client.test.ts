const mockCreateAuthClient = jest.fn();
const mockMagicLinkClient = jest.fn(() => ({ id: "magic-link" }));
const mockInferAdditionalFields = jest.fn(() => ({
  id: "additional-fields",
}));

jest.mock("better-auth/react", () => ({
  createAuthClient: mockCreateAuthClient,
}));

jest.mock("better-auth/client/plugins", () => ({
  magicLinkClient: mockMagicLinkClient,
  inferAdditionalFields: mockInferAdditionalFields,
}));

jest.mock("./server", () => ({
  auth: {},
}));

describe("auth client", () => {
  const mockAuthClient = {
    signIn: jest.fn(),
    useSession: jest.fn(),
    signOut: jest.fn(),
    updateUser: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockCreateAuthClient.mockReturnValue(mockAuthClient);
  });

  it("uses only the client plugins required by the application", async () => {
    const clientModule = await import("./client");

    expect(mockCreateAuthClient).toHaveBeenCalledWith({
      plugins: [{ id: "magic-link" }, { id: "additional-fields" }],
    });
    expect(clientModule.authClient).toBe(mockAuthClient);
    expect(clientModule.signIn).toBe(mockAuthClient.signIn);
    expect(clientModule.useSession).toBe(mockAuthClient.useSession);
  });

  it("relies on the default same-origin auth base URL", async () => {
    await import("./client");

    expect(mockCreateAuthClient).toHaveBeenCalledWith(
      expect.not.objectContaining({
        baseURL: expect.anything(),
      }),
    );
  });
});
