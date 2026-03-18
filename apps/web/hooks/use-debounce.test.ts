import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls callback with value after delay", () => {
    const callback = vi.fn();
    renderHook(() => useDebounce("hello", 1000, callback));

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("hello");
  });

  it("resets timer when value changes", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay, callback),
      { initialProps: { value: "first", delay: 1000 } }
    );

    vi.advanceTimersByTime(500);
    rerender({ value: "second", delay: 1000 });
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("second");
  });

  it("does not call callback on unmount before delay", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useDebounce("x", 1000, callback));
    unmount();
    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });
});
