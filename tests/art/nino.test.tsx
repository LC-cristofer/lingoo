import { act, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let listener: ((speaking: boolean) => void) | null = null;
let speakingNow = false;
vi.mock("@/audio/narrator", () => ({
  narrator: {
    isSpeaking: () => speakingNow,
    onSpeakingChange: (l: (s: boolean) => void) => {
      listener = l;
      return () => {
        listener = null;
      };
    },
  },
}));

import { Cat } from "@/art/Cat";
import { Nino } from "@/art/nino/Nino";
import { ARM, poseState } from "@/art/nino/poses";
import { createNinoRig, ninoMarkup } from "@/art/nino/rig";

function setReduced(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: matches && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("Nino rig", () => {
  it("draws the same cat as Cat.tsx (every path and ellipse of the idle drawing)", () => {
    const cat = renderToStaticMarkup(<Cat expression="idle" />);
    const rig = ninoMarkup();
    const shapes = [
      ...cat.matchAll(/ d="([^"]+)"/g),
      ...cat.matchAll(/<ellipse[^>]*? cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g),
    ].map((m) => m[0]);
    expect(shapes.length).toBeGreaterThan(15);
    for (const s of shapes) {
      const needle = s.startsWith(" d=") ? s : `cx="${s.match(/cx="([\d.]+)"/)![1]}" cy="${s.match(/cy="([\d.]+)"/)![1]}" rx="${s.match(/rx="([\d.]+)"/)![1]}" ry="${s.match(/ry="([\d.]+)"/)![1]}"`;
      expect(rig, needle).toContain(needle);
    }
  });

  it("builds in jsdom and renders a frame", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const rig = createNinoRig(svg, { x: 100, y: 222, s: 1 });
    rig.render(1000, false);
    expect(svg.querySelector(".n-armL")!.getAttribute("d")).toMatch(/^M64\.0 158\.0 q/);
  });

  it("poseState('happy') raises both arms with a big smile and closed-happy eyes", () => {
    const p = poseState("happy");
    expect(p.eyes).toBe("happy");
    expect(p.mouth).toBe("big");
    expect(p.armL).toEqual([...ARM.upL]);
    expect(p.armR).toEqual([...ARM.upR]);
  });

  it("stretch and listen follow the brief", () => {
    expect(poseState("stretch")).toMatchObject({ eyes: "happy", mouth: "yawn", sy: 1.08, sx: 0.95, armL: [...ARM.stretchL], armR: [...ARM.stretchR] });
    expect(poseState("listen")).toMatchObject({ earL: -20, lookX: -3, lookY: -6 });
  });
});

describe("<Nino>", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReduced(false);
    listener = null;
    speakingNow = false;
  });
  afterEach(() => vi.useRealTimers());

  it("is an img named Nino with the world viewBox", () => {
    const { getByRole } = render(<Nino pose="idle" size={100} />);
    const svg = getByRole("img", { name: "Nino" });
    expect(svg).toHaveAttribute("viewBox", "-30 -40 260 300");
    expect(svg).toHaveAttribute("width", "100");
  });

  it("talks only while the narrator speaks", () => {
    const { getByRole } = render(<Nino pose="idle" size={100} speaks />);
    const svg = getByRole("img", { name: "Nino" });
    expect(svg).toHaveAttribute("data-talking", "false");
    act(() => {
      speakingNow = true;
      listener?.(true);
    });
    expect(svg).toHaveAttribute("data-talking", "true");
    act(() => {
      speakingNow = false;
      listener?.(false);
    });
    expect(svg).toHaveAttribute("data-talking", "false");
  });

  it("does not talk without the speaks prop", () => {
    const { getByRole } = render(<Nino pose="idle" size={100} />);
    expect(listener).toBeNull();
    expect(getByRole("img", { name: "Nino" })).toHaveAttribute("data-talking", "false");
  });

  it("a reaction shows for 1400 ms and then clears; a new n restarts it", () => {
    const { getByRole, rerender } = render(<Nino pose="idle" size={100} reaction={{ kind: "correct", n: 1 }} />);
    const svg = getByRole("img", { name: "Nino" });
    expect(svg).toHaveAttribute("data-reaction", "correct");
    act(() => void vi.advanceTimersByTime(1000));
    rerender(<Nino pose="idle" size={100} reaction={{ kind: "correct", n: 2 }} />);
    act(() => void vi.advanceTimersByTime(1000));
    expect(svg).toHaveAttribute("data-reaction", "correct");
    act(() => void vi.advanceTimersByTime(500));
    expect(svg).not.toHaveAttribute("data-reaction");
  });

  it("is static under prefers-reduced-motion", () => {
    setReduced(true);
    const { getByRole } = render(<Nino pose="happy" size={100} />);
    const svg = getByRole("img", { name: "Nino" });
    expect(svg).toHaveAttribute("data-reduced", "true");
    expect(svg.querySelector(".n-eyesHappy")).toHaveAttribute("display", "inline");
  });

  it("animates frame by frame with the rAF loop otherwise", () => {
    const { getByRole } = render(<Nino pose="idle" size={100} />);
    const body = getByRole("img", { name: "Nino" }).querySelector(".n-body")!;
    const before = body.getAttribute("transform");
    act(() => void vi.advanceTimersByTime(900));
    expect(body.getAttribute("transform")).not.toBe(before);
  });
});
