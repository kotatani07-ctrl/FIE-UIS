import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./formatDate";

describe("formatDate", () => {
  it("formats an ISO date in Indonesian, Asia/Jakarta", () => {
    expect(formatDate("2026-05-19")).toBe("19 Mei 2026");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatDate("bukan-tanggal")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("includes the time in Asia/Jakarta", () => {
    expect(formatDateTime("2026-11-12T09:00:00+07:00")).toContain("09.00");
  });
});
