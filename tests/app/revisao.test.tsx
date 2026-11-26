import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReviewPage from "@/app/revisao/page";

describe("/revisao", () => {
  it("lists the six stops of Unit 1, then the tree's four branches; every stop links to review mode", () => {
    render(<ReviewPage />);
    expect(screen.getByRole("heading", { name: "Revisão de conteúdo" })).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.slice(0, 6).map((a) => a.getAttribute("href"))).toEqual([
      "/parada/forest-animals/song?revisao=1",
      "/parada/forest-animals/lesson-1?revisao=1",
      "/parada/forest-animals/lesson-2?revisao=1",
      "/parada/forest-animals/lesson-3?revisao=1",
      "/parada/forest-animals/story?revisao=1",
      "/parada/forest-animals/challenge?revisao=1",
    ]);
    expect(links).toHaveLength(30);
    expect(links[6]).toHaveAttribute("href", "/parada/letras-1/song?revisao=1");
    expect(links[29]).toHaveAttribute("href", "/parada/letras-4/challenge?revisao=1");
    expect(screen.getAllByRole("listitem")).toHaveLength(30);
    expect(screen.queryByText(/em construção/)).not.toBeInTheDocument();
  });
});
