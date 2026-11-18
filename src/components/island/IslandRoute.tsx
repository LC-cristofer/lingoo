"use client";

import { useSearchParams } from "next/navigation";
import { IslandScreen } from "./IslandScreen";

/** The home route: `?volta=<stop>` (set when a stop ends) tells the island to show the return from it. */
export function IslandRoute() {
  const params = useSearchParams();
  return <IslandScreen mode="auto" volta={params.get("volta")} />;
}
