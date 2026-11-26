"use client";

import { useSearchParams } from "next/navigation";
import { useProfile } from "@/components/nestoy/ProfileProvider";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { hasPlayed } from "@/domain/nestoy/profile";
import { IslandScreen } from "./IslandScreen";

/**
 * The home route: `?volta=<stop>` (set when a stop ends) tells the island to show the return from it.
 * Until the cadastro is done (or put off) the island waits behind it; the opening plays right after.
 */
export function IslandRoute() {
  const params = useSearchParams();
  const { profile, hydrated } = useProfile();
  const { progress, hydrated: progressReady } = useTrailProgress();
  const pending = hydrated && progressReady && profile.onboarding === "pending";
  return (
    <>
      <IslandScreen mode="auto" volta={params.get("volta")} held={!hydrated || pending} />
      {pending ? <OnboardingScreen existing={hasPlayed(progress)} /> : null}
    </>
  );
}
