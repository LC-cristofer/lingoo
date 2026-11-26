import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "@/domain/trail/progress";
import { defaultSettings, type Settings } from "@/domain/nestoy/settings";
import { dateKey } from "@/domain/trail/progress";

const push = vi.fn();
const replace = vi.fn();
const update = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: vi.fn(() => true) },
}));
const ambience = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn(), current: vi.fn(() => null) }));
vi.mock("@/audio/ambience", () => ({ ambience }));
let progress: Progress;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated: true, finishStop: vi.fn(), markToday: vi.fn() }),
}));
let settings: Settings;
vi.mock("@/components/nestoy/SettingsProvider", () => ({
  useSettings: () => ({ settings, update, hydrated: true }),
}));

import { IslandScreen } from "@/components/island/IslandScreen";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import type { Stage } from "@/world/stage";

const empty = (): Progress => ({ completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null });
const NAMES = ["Ninho do Nino", "Farol das Línguas", "Árvore das Letras", "Torre dos Números", "Jardim das Cores", "Lago das Descobertas"];
const pin = (name: string) => screen.getByRole("button", { name });
const card = () => screen.getByTestId("nino-card");

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  update.mockClear();
  sessionStorage.clear();
  ambience.play.mockClear();
  vi.mocked(narrator.playNarration).mockClear();
  vi.mocked(narrator.playSfx).mockClear();
  progress = empty();
  settings = { ...defaultSettings(), motion: "reduzir" };
});

describe("IslandScreen", () => {
  it("shows the six places as pins with their names, the card inviting to explore", () => {
    render(<IslandScreen mode="explore" />);
    for (const n of NAMES) expect(pin(n)).toBeInTheDocument();
    expect(card()).toHaveTextContent("Vamos explorar?");
    expect(card()).toHaveTextContent("Toque num lugar da ilha.");
  });

  it("leaving the island (unmount, or the route hidden) stops the narration and the ambience", () => {
    const { unmount } = render(<IslandScreen mode="explore" />);
    vi.mocked(narrator.stop).mockClear();
    ambience.stop.mockClear();
    unmount();
    expect(narrator.stop).toHaveBeenCalled();
    expect(ambience.stop).toHaveBeenCalled();
  });

  it("carries the launch states on the pins: farol, ninho and the tree ready, the rest soon", () => {
    render(<IslandScreen mode="explore" />);
    expect(pin("Árvore das Letras")).toHaveAttribute("data-state", "pronto");
    expect(pin("Torre dos Números")).toHaveAttribute("data-state", "futuro");
    expect(pin("Jardim das Cores")).toHaveAttribute("data-state", "futuro");
    expect(pin("Lago das Descobertas")).toHaveAttribute("data-state", "futuro");
    expect(pin("Farol das Línguas")).toHaveAttribute("data-state", "pronto");
    expect(pin("Ninho do Nino")).toHaveAttribute("data-state", "pronto");
  });

  it("the tree: chip Pronto, its branch on the card, and entering pushes /arvore", async () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Árvore das Letras"));
    expect(card()).toHaveTextContent("Pronto");
    expect(card()).toHaveTextContent("Inglês · Galho 1: ABC: A a M");
    const enter = await screen.findByRole("button", { name: "Entrar na árvore" });
    expect(screen.queryByRole("button", { name: "Entrar no farol" })).not.toBeInTheDocument();
    fireEvent.click(enter);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/arvore"));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("a future place says soon and plays the soon line", () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Torre dos Números"));
    expect(card()).toHaveTextContent("Em breve");
    expect(card()).toHaveTextContent("Um lugar novo vai nascer aqui.");
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().soonUnit);
  });

  it("the farol: chip Pronto, the action Entrar no farol, and entering pushes /farol", async () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Farol das Línguas"));
    expect(card()).toHaveTextContent("Pronto");
    expect(card()).toHaveTextContent("Inglês · Unidade 1: Animais da floresta");
    const enter = await screen.findByRole("button", { name: "Entrar no farol" });
    await waitFor(() => expect(narrator.playNarration).toHaveBeenCalledWith(getLines().placeFarol));
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(enter);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/farol"));
    expect(narrator.playSfx).toHaveBeenCalledWith("dive");
  });

  it("the ninho pin and the nest button go to /ninho", () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Ninho do Nino"));
    expect(push).toHaveBeenLastCalledWith("/ninho");
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao ninho" }));
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("the parents button goes to /responsaveis", () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(screen.getByRole("button", { name: "Área dos responsáveis" }));
    expect(push).toHaveBeenCalledWith("/responsaveis");
  });

  it("tapping the sky goes back to the whole island", () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Torre dos Números"));
    expect(card()).toHaveTextContent("Em breve");
    fireEvent.click(screen.getByTestId("island-sky"));
    expect(card()).toHaveTextContent("Vamos explorar?");
  });

  it("day by default: day ambience; with ambient noite the stage is at night and the night ambience plays", async () => {
    let stage: Stage | null = null;
    const { unmount } = render(<IslandScreen mode="explore" onStage={(s) => { if (s) stage = s; }} />);
    await act(async () => {});
    expect(stage!.env.night).toBe(0);
    expect(ambience.play).toHaveBeenLastCalledWith("day");
    unmount();
    settings = { ...defaultSettings(), motion: "reduzir", ambient: "noite" };
    stage = null;
    render(<IslandScreen mode="explore" onStage={(s) => { if (s) stage = s; }} />);
    await act(async () => {});
    expect(stage!.env.night).toBe(1);
    expect(ambience.play).toHaveBeenLastCalledWith("night");
    expect(within(screen.getByTestId("island-time")).getByLabelText("Noite")).toBeInTheDocument();
  });

  it("unmounting stops the ambience", () => {
    const { unmount } = render(<IslandScreen mode="explore" />);
    ambience.stop.mockClear();
    unmount();
    expect(ambience.stop).toHaveBeenCalled();
  });

  it("a second tap on the place already in focus does not start it again", async () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Farol das Línguas"));
    await screen.findByRole("button", { name: "Entrar no farol" });
    fireEvent.click(pin("Farol das Línguas"));
    await act(async () => {});
    const farolLines = vi.mocked(narrator.playNarration).mock.calls.filter(([n]) => n === getLines().placeFarol);
    expect(farolLines).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Entrar no farol" })).toBeInTheDocument();
  });

  it("tapping another place while Nino walks to the farol takes over: no enter button appears", async () => {
    settings = { ...defaultSettings(), motion: "auto" };
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Farol das Línguas"));
    fireEvent.click(pin("Torre dos Números"));
    expect(card()).toHaveTextContent("Em breve");
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByRole("button", { name: "Entrar no farol" })).not.toBeInTheDocument();
    expect(card()).toHaveTextContent("Em breve");
  });

  it("tapping another place while Nino walks to the tree cancels the flow: no enter button, no /arvore, no placeArvore line", async () => {
    settings = { ...defaultSettings(), motion: "auto" };
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Árvore das Letras"));
    fireEvent.click(pin("Torre dos Números"));
    expect(card()).toHaveTextContent("Em breve");
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByRole("button", { name: "Entrar na árvore" })).not.toBeInTheDocument();
    expect(card()).toHaveTextContent("Em breve");
    expect(push).not.toHaveBeenCalledWith("/arvore");
    expect(narrator.playNarration).not.toHaveBeenCalledWith(getLines().placeArvore);
  });

  it("taps during the dive are ignored: the dive finishes and /farol is pushed once", async () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Farol das Línguas"));
    fireEvent.click(await screen.findByRole("button", { name: "Entrar no farol" }));
    expect(screen.getByTestId("island")).toHaveAttribute("data-away", "true");
    fireEvent.click(screen.getByTestId("island-sky"));
    fireEvent.click(document.querySelector('[data-place="letras"]')!); // off screen while zoomed on the farol
    expect(card()).toHaveTextContent("Farol das Línguas");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/farol"));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("coming back after a dive (the stage is rebuilt) shows the island again with no veil", async () => {
    const { rerender } = render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Farol das Línguas"));
    fireEvent.click(await screen.findByRole("button", { name: "Entrar no farol" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/farol"));
    const veil = () => document.querySelector<HTMLElement>(".nz-veil")!;
    expect(Number(veil().style.opacity)).toBe(1);
    settings = { ...defaultSettings(), motion: "auto" }; // rebuilds the stage, like Activity showing the route again
    rerender(<IslandScreen mode="explore" />);
    await waitFor(() => expect(screen.getByTestId("island")).toHaveAttribute("data-away", "false"));
    expect(Number(veil().style.opacity)).toBe(0);
    expect(screen.getByTestId("island")).toHaveAttribute("data-ready", "true");
  });

  describe("arrival", () => {
    const FIRST = "forest-animals/song";
    const done = (...ids: string[]): Progress => ({ ...empty(), completedStops: Object.fromEntries(ids.map((id) => [id, "2026-11-18T10:00:00.000Z"])) });
    const grab = () => {
      const box: { stage: Stage | null } = { stage: null };
      return { box, onStage: (s: Stage | null) => { if (s) box.stage = s; } };
    };

    it("records the visit: lastVisit is today's local date key, not a timestamp", () => {
      render(<IslandScreen mode="explore" />);
      expect(update).toHaveBeenCalledWith({ lastVisit: dateKey(new Date()) });
    });

    it("the first visit plays the full opening: Pular shows, the card and the pins wait, and tapping Pular lands on the island", async () => {
      settings = { ...defaultSettings(), motion: "auto" };
      const { box, onStage } = grab();
      render(<IslandScreen mode="auto" onStage={onStage} />);
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "opening");
      expect(screen.getByTestId("island")).toHaveAttribute("data-card", "false");
      expect(box.stage!.nino.st.eyes).toBe("closed");
      expect(update).not.toHaveBeenCalledWith({ openingSeen: true });
      fireEvent.click(screen.getByText("Pular"));
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "island");
      expect(screen.getByTestId("island")).toHaveAttribute("data-card", "true");
      expect(update).toHaveBeenCalledWith({ openingSeen: true });
      expect(screen.queryByText("Pular")).not.toBeInTheDocument();
      expect(card()).toHaveTextContent("Vamos explorar?");
      expect(box.stage!.fx.pins.farol).toBe(1);
      expect(narrator.stop).toHaveBeenCalled();
    });

    it("a tap on the sleeping Nino wakes him early (the greeting comes in under 5.5 s; asleep it takes 2.6 s more)", async () => {
      settings = { ...defaultSettings(), motion: "auto" };
      render(<IslandScreen mode="auto" />);
      fireEvent.click(screen.getByTestId("island-sky"));
      await waitFor(() => expect(narrator.playNarration).toHaveBeenCalledWith(getLines().ninoHello), { timeout: 5500 });
    }, 8000);

    it("the same day again goes straight to the island, with no opening and no Pular", () => {
      settings = { ...defaultSettings(), motion: "auto", openingSeen: true, lastVisit: dateKey(new Date()) };
      render(<IslandScreen mode="auto" />);
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "island");
      expect(screen.queryByText("Pular")).not.toBeInTheDocument();
    });

    it("another day after the first opening plays the short one: no Pular, the places wait for the reveal", () => {
      settings = { ...defaultSettings(), motion: "auto", openingSeen: true, lastVisit: "2026-01-01" };
      render(<IslandScreen mode="auto" />);
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "opening");
      expect(screen.queryByText("Pular")).not.toBeInTheDocument();
    });

    it("reduced motion: the island at once (no Pular), the full opening never plays and the short fade marks the opening seen", () => {
      render(<IslandScreen mode="auto" />);
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "island");
      expect(screen.queryByText("Pular")).not.toBeInTheDocument();
      expect(update).toHaveBeenCalledWith({ openingSeen: true });
    });

    it("reduced motion: a pending \"Rever abertura\" (openingSeen false) still plays today; once seen, the same day is quiet", () => {
      settings = { ...defaultSettings(), motion: "reduzir", openingSeen: false, lastVisit: dateKey(new Date()) };
      const first = render(<IslandScreen mode="auto" />);
      expect(update).toHaveBeenCalledWith({ openingSeen: true });
      first.unmount();
      update.mockClear();
      settings = { ...defaultSettings(), motion: "reduzir", openingSeen: true, lastVisit: dateKey(new Date()) };
      render(<IslandScreen mode="auto" />);
      expect(update).not.toHaveBeenCalledWith({ openingSeen: true });
    });

    it("?volta= naming a finished stop plays the return: the farol grows and Nino says so; the URL is cleaned", async () => {
      progress = done(FIRST);
      settings = { ...defaultSettings(), openingSeen: true, motion: "reduzir" };
      const { box, onStage } = grab();
      render(<IslandScreen mode="auto" volta={FIRST} onStage={onStage} />);
      expect(replace).toHaveBeenCalledWith("/");
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "return");
      expect(screen.getByTestId("island")).toHaveAttribute("data-card", "false");
      expect(box.stage!.env.farolLevel).toBe(1); // as it was before the stop
      await waitFor(() => expect(narrator.playNarration).toHaveBeenCalledWith(getLines().farolGrew), { timeout: 4000 });
      expect(box.stage!.env.farolLevel).toBe(2);
      expect(box.stage!.fx.pennant[2]).toBeGreaterThan(0); // the new pennants are flying up
    });

    it("?volta= naming a stop that is not finished opens to explore", () => {
      settings = { ...defaultSettings(), openingSeen: true, motion: "reduzir" };
      render(<IslandScreen mode="auto" volta={FIRST} />);
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "island");
      expect(card()).toHaveTextContent("Vamos explorar?");
      expect(narrator.playNarration).not.toHaveBeenCalledWith(getLines().farolGrew);
    });

    it("an arrival resets the card and the focus left from the last visit (a hidden route comes back)", async () => {
      const { rerender } = render(<IslandScreen mode="explore" />);
      fireEvent.click(pin("Torre dos Números"));
      expect(card()).toHaveTextContent("Em breve");
      settings = { ...defaultSettings(), motion: "auto", openingSeen: true, lastVisit: dateKey(new Date()) }; // rebuilds the stage
      rerender(<IslandScreen mode="explore" />);
      await waitFor(() => expect(card()).toHaveTextContent("Vamos explorar?"));
      expect(screen.getByTestId("island")).toHaveAttribute("data-focus", "none");
    });
  });

  describe("pause and bedtime", () => {
    it("after the chosen minutes Nino suggests a pause; Pausar shows the break with Nino asleep, Voltar a brincar ends it", async () => {
      settings = { ...defaultSettings(), motion: "reduzir", pauseMinutes: 15 };
      sessionStorage.setItem("lingoo:session:start", String(Date.now() - 16 * 60_000));
      render(<IslandScreen mode="explore" />);
      expect(card()).toHaveTextContent("Que tal uma pausa?");
      expect(card()).toHaveTextContent("Lembrete de 15 min");
      await waitFor(() => expect(narrator.playNarration).toHaveBeenCalledWith(getLines().pauseSuggest));
      fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
      const dialog = await screen.findByRole("dialog", { name: "Pausa" });
      expect(dialog).toHaveTextContent("O Nino foi descansar no ninho.");
      // everything behind the break is inert: no focus, no taps for the island
      expect(screen.getByTestId("island").querySelector(".nz-inert-wrap")).toHaveAttribute("inert");
      fireEvent.click(within(dialog).getByRole("button", { name: "Voltar a brincar" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("island").querySelector(".nz-inert-wrap")).not.toHaveAttribute("inert");
      expect(card()).toHaveTextContent("Oi de novo!");
      // the next reminder counts from now
      expect(Date.now() - Number(sessionStorage.getItem("lingoo:session:start"))).toBeLessThan(5000);
    });

    it("going to the parents' area restarts the pause clock (an adult just stepped in), the nest does not", () => {
      settings = { ...defaultSettings(), motion: "reduzir", pauseMinutes: 30 };
      const old = String(Date.now() - 10 * 60_000);
      sessionStorage.setItem("lingoo:session:start", old);
      render(<IslandScreen mode="explore" />);
      fireEvent.click(screen.getByRole("button", { name: "Voltar ao ninho" }));
      expect(sessionStorage.getItem("lingoo:session:start")).toBe(old);
      fireEvent.click(screen.getByRole("button", { name: "Área dos responsáveis" }));
      expect(Date.now() - Number(sessionStorage.getItem("lingoo:session:start"))).toBeLessThan(5000);
      expect(push).toHaveBeenLastCalledWith("/responsaveis");
    });

    it("no reminder before the time, or when the reminder is off", () => {
      settings = { ...defaultSettings(), motion: "reduzir", pauseMinutes: 15 };
      sessionStorage.setItem("lingoo:session:start", String(Date.now() - 5 * 60_000));
      const { unmount } = render(<IslandScreen mode="explore" />);
      expect(card()).toHaveTextContent("Vamos explorar?");
      unmount();
      settings = { ...defaultSettings(), motion: "reduzir", pauseMinutes: 0 };
      sessionStorage.setItem("lingoo:session:start", String(Date.now() - 600 * 60_000));
      render(<IslandScreen mode="explore" />);
      expect(card()).toHaveTextContent("Vamos explorar?");
    });

    it("the session start is written on the first arrival of the session and kept", () => {
      render(<IslandScreen mode="explore" />);
      const first = sessionStorage.getItem("lingoo:session:start");
      expect(Number(first)).toBeGreaterThan(0);
    });

    it("on the routine at night: the island darkens for bedtime, once per evening; ambient noite just shows the night", async () => {
      // bedtime "06:00" is night at every hour of the clock (>= 06:00 or < 06:00), whatever time the test runs at
      settings = { ...defaultSettings(), motion: "reduzir", ambient: "rotina", bedtime: "06:00" };
      const { box, onStage } = (() => { const b: { stage: Stage | null } = { stage: null }; return { box: b, onStage: (s: Stage | null) => { if (s) b.stage = s; } }; })();
      const { unmount } = render(<IslandScreen mode="explore" onStage={onStage} />);
      expect(card()).toHaveTextContent("Hora de dormir");
      expect(screen.getByTestId("island")).toHaveAttribute("data-phase", "night");
      await waitFor(() => expect(box.stage!.env.night).toBe(1), { timeout: 3000 });
      expect(Object.keys(sessionStorage).some((k) => k.startsWith("lingoo:bedtime:"))).toBe(true);
      unmount();
      // the same evening again: no second bedtime, the island is simply night
      render(<IslandScreen mode="explore" onStage={onStage} />);
      expect(card()).toHaveTextContent("Vamos explorar?");
      expect(box.stage!.env.night).toBe(1);
    });
  });
});
