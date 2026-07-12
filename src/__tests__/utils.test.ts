import { describe, it, expect } from "vitest";
import { cn, formatPrice, slugify, truncate, generateOrderNumber, calculateDiscount, getInitials } from "@/lib/utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("formatPrice", () => {
  it("should format price as currency", () => {
    const result = formatPrice(29.99);
    expect(result).toContain("29.99");
    expect(result).toContain("$");
  });

  it("should format zero", () => {
    const result = formatPrice(0);
    expect(result).toContain("0.00");
  });

  it("should handle string input", () => {
    const result = formatPrice("49.99");
    expect(result).toContain("49.99");
  });
});

describe("slugify", () => {
  it("should convert to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("test slug")).toBe("test-slug");
  });

  it("should remove special characters", () => {
    expect(slugify("hello!@#$ world")).toBe("hello-world");
  });

  it("should handle multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });
});

describe("truncate", () => {
  it("should truncate long strings", () => {
    const result = truncate("Hello World This Is Long", 10);
    expect(result).toBe("Hello Worl...");
  });

  it("should not truncate short strings", () => {
    const result = truncate("Short", 10);
    expect(result).toBe("Short");
  });
});

describe("generateOrderNumber", () => {
  it("should generate a string", () => {
    const result = generateOrderNumber();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should start with SN", () => {
    const result = generateOrderNumber();
    expect(result.startsWith("SN-")).toBe(true);
  });
});

describe("calculateDiscount", () => {
  it("should calculate correct percentage", () => {
    const result = calculateDiscount(80, 100);
    expect(result).toBe(20);
  });

  it("should return null if no compare price", () => {
    const result = calculateDiscount(80, null);
    expect(result).toBeNull();
  });

  it("should return null if compare price <= price", () => {
    const result = calculateDiscount(100, 80);
    expect(result).toBeNull();
  });
});

describe("getInitials", () => {
  it("should get initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("should handle single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("should be uppercase", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});
