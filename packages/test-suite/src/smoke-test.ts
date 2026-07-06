import { describe, expect, it } from "vitest";
import { listChapters } from "@repo/content";
import { renderWelcomeEmail } from "@repo/email";

describe("M0 workspace smoke test", () => {
  it("loads the first chapter and renders the welcome email", async () => {
    const chapters = await listChapters();
    const html = await renderWelcomeEmail({
      name: "Samuel",
      chapterTitle: chapters[0]?.title ?? "Unknown chapter",
      chapterUrl: "http://localhost:3000/chapters/first-chapter",
    });

    expect(chapters[0]?.slug).toBe("first-chapter");
    expect(html).toContain("Welcome to Keel Academy");
    expect(html).toContain("The First Commit");
  });
});
