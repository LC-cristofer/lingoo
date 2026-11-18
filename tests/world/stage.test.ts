import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ROUTES, type IslandStates } from "@/world/island";
import { createStage, type Stage } from "@/world/stage";

const states: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };
let host: HTMLDivElement;
let stage: Stage | null = null;

function mount(o: Partial<Parameters<typeof createStage>[1]> = {}) {
  stage = createStage(host, { scene: "island", states, threads: 1, farolLevel: 1, reduced: false, clock: "manual", ...o });
  stage.setViewport({ w: 390, h: 844, top: 108, bottom: 150 });
  return stage;
}
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  stage?.destroy();
  stage = null;
  host.remove();
});

describe("createStage (island)", () => {
  it("mounts four layers and frame(0) sets the island viewBox", () => {
    const s = mount();
    s.frame(0);
    expect(host.querySelectorAll("svg.stage-layer").length).toBe(4);
    const isl = host.querySelector("#Lisl")!;
    const vb = isl.getAttribute("viewBox")!.split(" ").map(Number);
    expect(vb).toHaveLength(4);
    expect(vb[2]).toBeCloseTo(390 / (390 / 1000 / s.cam.D), 1);
    expect(vb[0] + vb[2] / 2).toBeCloseTo(s.cam.X, 1);
  });

  it("night 1 sets the grade to 0.62 and the lights, stars, sun and moon opacity", () => {
    const s = mount();
    s.env.night = 1;
    s.frame(100);
    expect(host.querySelector("#nightGrade")!.getAttribute("opacity")).toBe("0.620");
    expect(host.querySelector("#lights")!.getAttribute("opacity")).toBe("1.000");
    expect(host.querySelector("#sun")!.getAttribute("opacity")).toBe("0.000");
    expect(host.querySelector("#moon")!.getAttribute("opacity")).toBe("1.000");
  });

  it("the daytime farol glow uses the island glow gradient", () => {
    mount();
    const c = host.querySelector("#farol circle#farol-glow-day")!;
    expect(c).toBeTruthy();
    expect(c.getAttribute("fill")).toBe("url(#glowGrad)");
  });

  it("drives .drift groups that live in the far and mid layers", () => {
    const s = mount();
    s.frame(4000);
    const drifts = [...host.querySelectorAll(".drift")];
    expect(drifts.length).toBeGreaterThanOrEqual(2);
    expect(drifts.every(d => d.getAttribute("transform")?.startsWith("translate("))).toBe(true);
  });

  it("reduced leaves ambient groups untouched and renders Nino static", () => {
    const s = mount({ reduced: true });
    s.frame(4000);
    const bf = () => [...host.querySelectorAll(".bfly")].map(b => b.getAttribute("transform"));
    const before = bf();
    expect(before.length).toBeGreaterThan(0);
    s.frame(5300);
    expect(bf()).toEqual(before);
    expect([...host.querySelectorAll(".drift, .sway, .bob")].every(d => !d.hasAttribute("transform"))).toBe(true);
    expect(host.querySelector("#Lfar")!.getAttribute("style") ?? "").not.toContain("blur");
  });

  it("pennants, threads and the boat follow fx", () => {
    const s = mount();
    s.fx.pennant = [1, 1, 1, 0, 0];
    s.fx.thread = [1, 1, 0.5, 0];
    s.fx.boatX = 0;
    s.frame(0);
    const pen = [...host.querySelectorAll(".pennant")];
    expect(pen.map(p => p.getAttribute("opacity"))).toEqual(["1.00", "1.00", "1.00", "0.00", "0.00"]);
    const th = [...host.querySelectorAll(".thread")];
    expect(th[2].getAttribute("stroke-dasharray")).toBe("80.0 400");
    expect(host.querySelector("#barco")!.getAttribute("transform")).toContain("translate(690.0");
  });

  it("moveNino converts the nest slot to world space and keeps the world position", () => {
    const s = mount();
    expect(s.nino.el.parentElement!.id).toBe("slotNest");
    const y0 = s.nino.st.y;
    s.moveNino("actors");
    expect(s.nino.el.parentElement!.id).toBe("slotActors");
    expect(s.nino.st.y).toBe(y0 - 190);
    // re-rendered right away: the root transform already carries the new y
    expect(s.nino.el.querySelector(".n-root")!.getAttribute("transform")).toContain(`${(y0 - 190).toFixed(2)}`);
    s.moveNino("nest");
    expect(s.nino.st.y).toBe(y0);
    s.moveNino("nest");
    expect(s.nino.st.y).toBe(y0);
  });

  it("walk resolves after the route duration and leaves Nino at the route end", async () => {
    const s = mount();
    s.moveNino("actors");
    s.nino.st.x = 590; s.nino.st.y = 934;
    let done = false;
    const p = s.walk("farol").then(() => (done = true));
    s.frame(0);
    s.frame(500);
    await flush();
    expect(done).toBe(false);
    expect(s.nino.st.walk).toBe(1);
    for (let t = 1000; t <= 8000 && !done; t += 250) { s.frame(t); await flush(); }
    await p;
    expect(done).toBe(true);
    expect(s.nino.st.x).toBeCloseTo(828, 3);
    expect(s.nino.st.y).toBeCloseTo(1158, 3);
    expect(s.nino.st.walk).toBe(0);
    expect(ROUTES.farol.endsWith("828 1158")).toBe(true);
  });

  it("walk(reverse) goes back to the route start", async () => {
    const s = mount();
    s.moveNino("actors");
    s.nino.st.x = 828; s.nino.st.y = 1158;
    let done = false;
    s.walk("farol", true).then(() => (done = true));
    for (let t = 0; t <= 9000 && !done; t += 250) { s.frame(t); await flush(); }
    expect(done).toBe(true);
    expect(s.nino.st.x).toBeCloseTo(590, 3);
    expect(s.nino.st.y).toBeCloseTo(934, 3);
  });

  it("onFrame callbacks run and can be removed; screenOf uses the camera", () => {
    const s = mount();
    const seen: number[] = [];
    const off = s.onFrame(t => seen.push(t));
    s.frame(10);
    off();
    s.frame(20);
    expect(seen).toEqual([10]);
    const [x, y] = s.screenOf(s.cam.X, s.cam.Y);
    expect(x).toBeCloseTo(195, 6);
    expect(y).toBeCloseTo(422, 6);
  });

  it("destroy removes the DOM and cancels the timeline", () => {
    const s = mount();
    s.destroy();
    expect(host.children.length).toBe(0);
    stage = null;
  });
});

describe("createStage (farol)", () => {
  it("mounts only the interior with Nino in the interior slot", () => {
    const s = mount({ scene: "farol", farolLevel: 3 });
    s.frame(0);
    expect(host.querySelectorAll("svg.stage-layer").length).toBe(1);
    expect(host.querySelector("#Lisl")).toBeNull();
    expect(s.nino.el.parentElement!.id).toBe("slotInterior");
    expect(host.querySelector("#bigLamp")!.getAttribute("opacity")).toBe("0.65");
    expect(host.querySelector("svg.stage-layer")!.getAttribute("viewBox")).toBeTruthy();
  });
});
