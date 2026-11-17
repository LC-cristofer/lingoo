import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTENT_ZONE, generateStars, NightSky } from "@/components/trail/kit/NightSky";

describe("generateStars", () => {
  it("is deterministic: the same seed gives the same field", () => {
    expect(generateStars(7)).toEqual(generateStars(7));
    expect(generateStars(7)).not.toEqual(generateStars(8));
  });

  it("uses three sizes, two layers and stays inside the sky", () => {
    const { stars } = generateStars(7);
    expect(new Set(stars.map((s) => s.size))).toEqual(new Set([1, 2, 3]));
    expect(new Set(stars.map((s) => s.layer))).toEqual(new Set(["far", "near"]));
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(100);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the central content zone sparse (well under its share of the area)", () => {
    const { stars, glints } = generateStars(7);
    const inZone = (s: { x: number; y: number }) => s.x > CONTENT_ZONE.x0 && s.x < CONTENT_ZONE.x1 && s.y > CONTENT_ZONE.y0 && s.y < CONTENT_ZONE.y1;
    const area = ((CONTENT_ZONE.x1 - CONTENT_ZONE.x0) * (CONTENT_ZONE.y1 - CONTENT_ZONE.y0)) / 10000;
    expect(stars.filter(inZone).length / stars.length).toBeLessThan(area * 0.4);
    expect(glints.some(inZone)).toBe(false);
    expect(glints.length).toBeGreaterThanOrEqual(2);
    expect(glints.length).toBeLessThanOrEqual(3);
  });

  it("is clustered, not uniform: stars sit closer to a neighbour than a uniform field would", () => {
    const { stars } = generateStars(7);
    const mean = stars.reduce((acc, a) => acc + Math.min(...stars.filter((b) => b !== a).map((b) => Math.hypot(a.x - b.x, (a.y - b.y) * 0.5))), 0) / stars.length;
    const uniform = 0.5 * Math.sqrt((100 * 50) / stars.length);
    expect(mean).toBeLessThan(uniform * 0.8);
  });

  it("lighter variants keep fewer stars", () => {
    expect(generateStars(7, 0.55).stars.length).toBeLessThan(generateStars(7, 1).stars.length);
  });
});

function mockMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce"), media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));
}

describe("NightSky", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is a hidden, decorative backdrop with the variant on it", () => {
    mockMotion(false);
    const { container } = render(<NightSky variant="map" />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-variant", "map");
    expect(root.className).not.toContain("is-still");
  });

  it("start and map have a shooting star; lesson and quiet are calmer (fewer stars, none)", () => {
    mockMotion(false);
    const count = (v: "start" | "map" | "lesson" | "quiet") => {
      const { container, unmount } = render(<NightSky variant={v} />);
      const n = { stars: container.querySelectorAll(".ns-star").length, shoot: container.querySelectorAll(".ns-shoot").length };
      unmount();
      return n;
    };
    expect(count("map").shoot).toBe(1);
    expect(count("start").shoot).toBe(1);
    expect(count("lesson").shoot).toBe(0);
    expect(count("quiet").shoot).toBe(0);
    expect(count("lesson").stars).toBeLessThan(count("map").stars);
    expect(count("quiet").stars).toBeLessThan(count("lesson").stars);
  });

  it("renders the same stars on every render (deterministic markup)", () => {
    mockMotion(false);
    const a = render(<NightSky variant="map" />).container.innerHTML;
    const b = render(<NightSky variant="map" />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("freezes into a complete still under reduced motion: class, no shooting star, all stars kept", () => {
    mockMotion(false);
    const live = render(<NightSky variant="map" />).container;
    const liveStars = live.querySelectorAll(".ns-star").length;
    mockMotion(true);
    const { container } = render(<NightSky variant="map" />);
    expect(container.firstElementChild!.className).toContain("is-still");
    expect(container.querySelectorAll(".ns-shoot")).toHaveLength(0);
    expect(container.querySelectorAll(".ns-star")).toHaveLength(liveStars);
  });

  it("passes a scroll offset to the two layers as a gentle parallax (the far one moves less)", () => {
    mockMotion(false);
    const { container } = render(<NightSky variant="map" scroll={1000} />);
    const far = (container.querySelector(".ns-layer.is-far") as HTMLElement).style.transform;
    const near = (container.querySelector(".ns-layer.is-near") as HTMLElement).style.transform;
    const y = (t: string) => Math.abs(parseFloat(/translate3d\(0px, (-?[\d.]+)px/.exec(t)![1]));
    expect(y(near)).toBeGreaterThan(y(far));
    expect(y(far)).toBeGreaterThan(0);
  });
});
