import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReviewPage from "@/app/revisao/page";

describe("/revisao", () => {
  it("lists the six stops of Unit 1; every stop links to review mode", () => {
    render(<ReviewPage />);
    expect(screen.getByRole("heading", { name: "Revisão de conteúdo" })).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/parada/forest-animals/song?revisao=1",
      "/parada/forest-animals/lesson-1?revisao=1",
      "/parada/forest-animals/lesson-2?revisao=1",
      "/parada/forest-animals/lesson-3?revisao=1",
      "/parada/forest-animals/story?revisao=1",
      "/parada/forest-animals/challenge?revisao=1",
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.queryByText(/em construção/)).not.toBeInTheDocument();
  });
});
