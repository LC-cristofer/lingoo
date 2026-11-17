import Link from "next/link";
import { StopIcon } from "@/art/StopIcon";
import { NightSky } from "@/components/trail/kit/NightSky";
import { getPath, getUnit } from "@/domain/trail/content";
import { stopHref } from "@/domain/trail/routes";

const KIND_LABEL = {
  song: "Música",
  lesson: "Lição",
  story: "História",
  challenge: "Desafio",
} as const;

// For adults (the team and the content reviewer): not linked from any child screen.
export default function ReviewPage() {
  const units = getPath()
    .filter((u) => u.hasContent)
    .flatMap((u) => {
      const unit = getUnit(u.unitId);
      return unit ? [unit] : [];
    });
  return (
    <div className="k-screen">
      <NightSky variant="quiet" />
      <main className="relative mx-auto w-full max-w-2xl p-6 text-fg">
        <h1 className="font-display text-4xl font-bold">Revisão de conteúdo</h1>
        <p className="mt-2">
          Abre qualquer parada direto, sem salvar progresso.
        </p>
        {units.map((unit) => (
          <section key={unit.id} className="mt-8">
            <h2 className="font-display text-2xl font-bold">{unit.title}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {unit.stops.map((stop) => {
                return (
                  <li key={stop.id}>
                    <Link
                      href={`${stopHref(stop.id)}?revisao=1`}
                      className="flex min-h-16 items-center gap-4 rounded-3xl bg-card px-4 py-2 text-ink shadow-md"
                    >
                      <StopIcon kind={stop.kind} state="current" size={48} />
                      <span className="flex-1 font-display text-xl font-semibold">
                        {stop.title}
                      </span>
                      <span className="text-sm">{KIND_LABEL[stop.kind]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
