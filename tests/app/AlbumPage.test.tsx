import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import AlbumPage from "@/app/album/page";

describe("/album", () => {
  it("redirects to the nest", () => {
    AlbumPage();
    expect(redirect).toHaveBeenCalledWith("/ninho");
  });
});
