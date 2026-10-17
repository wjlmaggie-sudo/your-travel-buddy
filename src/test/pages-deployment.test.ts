import { describe, expect, it } from "vitest";
import { authRedirectUrl } from "@/lib/deployment";

describe("Pages confirmation redirects", () => {
  it("returns to the repository index instead of a server-only route", () => {
    expect(authRedirectUrl("https://wjlmaggie-sudo.github.io", "/your-travel-buddy/")).toBe(
      "https://wjlmaggie-sudo.github.io/your-travel-buddy/",
    );
  });
  it("also supports a root or custom-domain deployment", () => {
    expect(authRedirectUrl("https://travel.example.com", "/")).toBe("https://travel.example.com/");
  });
});
