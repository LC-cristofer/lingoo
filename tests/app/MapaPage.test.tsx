import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import MapPage from "@/app/mapa/page";

describe("/mapa", () => {
  it("redirects to the island", () => {
    MapPage();
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
