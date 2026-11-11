import { Suspense } from "react";
import { getPath, getUnit } from "@/domain/trail/content";
import { StopScreen } from "./StopScreen";

export function generateStaticParams() {
  return getPath()
    .filter((u) => u.hasContent)
    .flatMap((u) => {
      const unit = getUnit(u.unitId);
      return (unit?.stops ?? []).map((s) => ({ unitId: unit!.id, stopSlug: s.id.slice(unit!.id.length + 1) }));
    });
}

async function Stop({ params }: { params: Promise<{ unitId: string; stopSlug: string }> }) {
  const { unitId, stopSlug } = await params;
  return <StopScreen stopId={`${unitId}/${stopSlug}`} />;
}

export default function StopPage({ params }: { params: Promise<{ unitId: string; stopSlug: string }> }) {
  return (
    <Suspense fallback={null}>
      <Stop params={params} />
    </Suspense>
  );
}
