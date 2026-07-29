import { getVisiblePageNumbers } from "./pagination";

describe("getVisiblePageNumbers", () => {
  it("starts at the first page near the beginning", () => {
    expect(getVisiblePageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(getVisiblePageNumbers(2, 10)).toEqual([1, 2, 3, 4, 5]);
  });

  it("centers the current page when possible", () => {
    expect(getVisiblePageNumbers(6, 10)).toEqual([4, 5, 6, 7, 8]);
  });

  it("ends at the final page near the end", () => {
    expect(getVisiblePageNumbers(9, 10)).toEqual([6, 7, 8, 9, 10]);
    expect(getVisiblePageNumbers(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });

  it("returns every page when the total is below the window size", () => {
    expect(getVisiblePageNumbers(2, 3)).toEqual([1, 2, 3]);
  });
});
