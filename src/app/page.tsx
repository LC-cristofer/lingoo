import { Suspense } from "react";
import { IslandRoute } from "@/components/island/IslandRoute";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <IslandRoute />
    </Suspense>
  );
}
