describe("useHydrated", () => {
  afterEach(() => {
    jest.resetModules();
    jest.unmock("react");
  });

  it("passes stable subscribe and snapshot functions to useSyncExternalStore", async () => {
    const mockUseSyncExternalStore = jest.fn(
      (
        subscribe: (onStoreChange: () => void) => () => void,
        getSnapshot: () => boolean,
        getServerSnapshot: () => boolean,
      ) => {
        const unsubscribe = subscribe(() => {});

        expect(typeof unsubscribe).toBe("function");
        expect(unsubscribe()).toBeUndefined();
        expect(getSnapshot()).toBe(true);
        expect(getServerSnapshot()).toBe(false);

        return getSnapshot();
      },
    );

    jest.doMock("react", () => {
      const actual = jest.requireActual("react");

      return {
        ...actual,
        useSyncExternalStore: mockUseSyncExternalStore,
      };
    });

    const { useHydrated } = await import("./use-hydrated");

    expect(useHydrated()).toBe(true);
    expect(mockUseSyncExternalStore).toHaveBeenCalledTimes(1);
  });
});
