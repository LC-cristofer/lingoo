import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "@/domain/trail/progress";
import { defaultSettings, type Settings } from "@/domain/nestoy/settings";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
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
  useSettings: () => ({ settings, update: vi.fn(), hydrated: true }),
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

  it("carries the launch states on the pins: farol and ninho ready, letras in construction, the rest soon", () => {
    render(<IslandScreen mode="explore" />);
    expect(pin("Árvore das Letras")).toHaveAttribute("data-state", "obra");
    expect(pin("Torre dos Números")).toHaveAttribute("data-state", "futuro");
    expect(pin("Jardim das Cores")).toHaveAttribute("data-state", "futuro");
    expect(pin("Lago das Descobertas")).toHaveAttribute("data-state", "futuro");
    expect(pin("Farol das Línguas")).toHaveAttribute("data-state", "pronto");
    expect(pin("Ninho do Nino")).toHaveAttribute("data-state", "pronto");
  });

  it("letras: the card says it is under construction and the building line plays", () => {
    render(<IslandScreen mode="explore" />);
    fireEvent.click(pin("Árvore das Letras"));
    expect(card()).toHaveTextContent("Em construção");
    expect(card()).toHaveTextContent("Os construtores estão trabalhando aqui.");
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().placeBuilding);
    expect(screen.queryByRole("button", { name: "Entrar no farol" })).not.toBeInTheDocument();
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
});
