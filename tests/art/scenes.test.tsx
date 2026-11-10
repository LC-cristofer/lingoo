import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StopIcon, type StopState } from "@/art/StopIcon";
import { Chest } from "@/art/scenes/Chest";
import { ForestBackdrop } from "@/art/scenes/ForestBackdrop";
import { Sticker } from "@/art/scenes/Sticker";
import { StoryScene } from "@/art/scenes/StoryScene";
import { sceneIdSchema, type Stop } from "@/domain/trail/schema";

const kinds: Stop["kind"][] = ["song", "lesson", "story", "challenge"];
const states: StopState[] = ["done", "current", "locked"];

describe("ForestBackdrop", () => {
  it.each(["map", "story"] as const)("fills its container in the %s variant", (variant) => {
    const { container } = render(<ForestBackdrop variant={variant} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
    expect(svg).toHaveAttribute("data-variant", variant);
  });

  it("gives every render its own gradient id", () => {
    const html = renderToStaticMarkup(
      <>
        <ForestBackdrop variant="map" />
        <ForestBackdrop variant="story" />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("StoryScene", () => {
  const hotspots = [
    { wordId: "spider" as const, x: 0.3, y: 0.3 },
    { wordId: "mouse" as const, x: 0.7, y: 0.75 },
  ];

  it("renders one English-labelled button per hotspot and reports the tapped word", () => {
    const onHotspot = vi.fn();
    render(<StoryScene scene="forest-web" hotspots={hotspots} onHotspot={onHotspot} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    const spider = screen.getByRole("button", { name: "spider" });
    expect(spider).toHaveAttribute("lang", "en");
    expect(spider).toHaveAttribute("type", "button");
    expect(spider).toHaveAttribute("data-hotspot", "spider");
    expect(spider.style.left).toBe("30%");
    expect(spider.style.top).toBe("30%");
    fireEvent.click(screen.getByRole("button", { name: "mouse" }));
    expect(onHotspot).toHaveBeenCalledWith("mouse");
  });

  it("makes every hotspot at least 88 px across", () => {
    render(<StoryScene scene="forest-bear" hotspots={[{ wordId: "bear", x: 0.68, y: 0.55 }]} onHotspot={() => {}} />);
    const bear = screen.getByRole("button", { name: "bear" });
    expect(bear.style.minWidth).toBe("88px");
    expect(bear.style.minHeight).toBe("88px");
  });

  it("makes only the glowId animal glow", () => {
    const { container } = render(<StoryScene scene="forest-web" hotspots={hotspots} onHotspot={() => {}} glowId="mouse" />);
    expect(container.querySelector('[data-art="mouse"]')).toHaveAttribute("data-glow", "true");
    expect(container.querySelector('[data-art="spider"]')).not.toHaveAttribute("data-glow");
  });

  it.each(sceneIdSchema.options)("draws the %s scene with the gatinho", (scene) => {
    const { container } = render(<StoryScene scene={scene} hotspots={[]} onHotspot={() => {}} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("data-scene", scene);
    expect(container.querySelector(".art-cat")).not.toBeNull();
  });

  it("shows a pond on forest-pond and a web and a cheese on forest-web", () => {
    const pond = render(<StoryScene scene="forest-pond" hotspots={[]} onHotspot={() => {}} />);
    expect(pond.container.querySelector('[data-prop="pond"]')).not.toBeNull();
    pond.unmount();
    const web = render(<StoryScene scene="forest-web" hotspots={[]} onHotspot={() => {}} />);
    expect(web.container.querySelector('[data-prop="web"]')).not.toBeNull();
    expect(web.container.querySelector('[data-prop="cheese"]')).not.toBeNull();
  });

  it("waves goodbye with a happy gatinho", () => {
    const { container } = render(<StoryScene scene="forest-goodbye" hotspots={[]} onHotspot={() => {}} />);
    expect(container.querySelector(".art-cat")).toHaveAttribute("data-expression", "happy");
  });

  it("never draws a word or letter", () => {
    const { container } = render(<StoryScene scene="forest-goodbye" hotspots={hotspots} onHotspot={() => {}} />);
    expect(container.querySelectorAll("text, tspan")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });
});

describe("Chest", () => {
  it("reports whether it is open", () => {
    const { container, rerender } = render(<Chest open={false} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("data-open", "false");
    rerender(<Chest open />);
    expect(container.firstElementChild).toHaveAttribute("data-open", "true");
  });
});

describe("Sticker", () => {
  it("is a grey silhouette until earned", () => {
    const { container, rerender } = render(<Sticker art="frog" earned={false} />);
    expect(container.firstElementChild).toHaveAttribute("data-earned", "false");
    expect(container.querySelector("[data-padlock]")).not.toBeNull();
    rerender(<Sticker art="frog" earned />);
    expect(container.firstElementChild).toHaveAttribute("data-earned", "true");
    expect(container.querySelector("[data-padlock]")).toBeNull();
  });

  it("names the animal in English", () => {
    render(<Sticker art="bear" earned />);
    expect(screen.getByRole("img", { name: "bear" })).toHaveAttribute("lang", "en");
  });
});

describe("StopIcon", () => {
  it.each(kinds.flatMap((kind) => states.map((state) => [kind, state] as const)))(
    "renders %s / %s",
    (kind, state) => {
      const { container } = render(<StopIcon kind={kind} state={state} />);
      const root = container.firstElementChild!;
      expect(root).toHaveAttribute("data-kind", kind);
      expect(root).toHaveAttribute("data-state", state);
      expect(container.querySelector("[data-badge='done']") !== null).toBe(state === "done");
      expect(container.querySelector(".art-stop-ring") !== null).toBe(state === "current");
      expect(container.querySelector("[data-padlock]") !== null).toBe(state === "locked");
    },
  );

  it("uses the stop colours", () => {
    const fill = (kind: Stop["kind"], state: StopState) => {
      const { container, unmount } = render(<StopIcon kind={kind} state={state} />);
      const value = container.querySelector("[data-disc]")!.getAttribute("fill");
      unmount();
      return value;
    };
    expect(fill("song", "done")).toBe("#FF7A6B");
    expect(fill("lesson", "current")).toBe("#FFC93C");
    expect(fill("story", "done")).toBe("#4AA8F0");
    expect(fill("challenge", "current")).toBe("#B57EDC");
    expect(fill("challenge", "locked")).toBe("#C9CCD3");
  });
});
