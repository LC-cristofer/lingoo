import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReviewPage from "@/app/revisao/page";

describe("/revisao", () => {
  it("lists the six stops of Unit 1; lesson and challenge link to review mode, song and story do not yet", () => {
    render(<ReviewPage />);
    expect(screen.getByRole("heading", { name: "Revisão de conteúdo" })).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/parada/forest-animals/lesson-1?revisao=1",
      "/parada/forest-animals/lesson-2?revisao=1",
      "/parada/forest-animals/lesson-3?revisao=1",
      "/parada/forest-animals/challenge?revisao=1",
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText(/em construção/)).toBeInTheDocument();
    expect(within(items[4]).getByText(/em construção/)).toBeInTheDocument();
    expect(within(items[0]).queryByRole("link")).not.toBeInTheDocument();
  });
});
