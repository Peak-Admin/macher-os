import { describe, expect, it } from "vitest";
import { ausgehend } from "./ausgehend";

describe("ausgehend", () => {
  it("hängt utm_source an Links nach draußen", () => {
    expect(ausgehend("https://www.mission-mittelstand.de")).toBe("https://www.mission-mittelstand.de/?utm_source=peak-atlas.com");
    expect(ausgehend("https://www.vaillant.de/service")).toBe("https://www.vaillant.de/service?utm_source=peak-atlas.com");
  });

  it("behält bestehende Parameter und Anker", () => {
    expect(ausgehend("https://commons.wikimedia.org/w/index.php?curid=1#a")).toBe(
      "https://commons.wikimedia.org/w/index.php?curid=1&utm_source=peak-atlas.com#a",
    );
  });

  it("lässt interne, eigene und Nicht-Web-Links in Ruhe", () => {
    for (const url of ["/os/heute", "https://macher-os.de/preise", "mailto:a@b.de", "tel:+49123", "blob:abc", "https://x.de/?utm_source=andere"]) {
      expect(ausgehend(url)).toBe(url);
    }
  });
});
