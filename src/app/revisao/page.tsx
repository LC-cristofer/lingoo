import Link from "next/link";
import { StopIcon } from "@/art/StopIcon";
import { getPath, getUnit } from "@/domain/trail/content";
import { SONG_AND_STORY_READY, stopHref } from "@/domain/trail/routes";

const KIND_LABEL = { song: "Música", lesson: "Lição", story: "História", challenge: "Desafio" } as const;

// For adults (the team and the content reviewer): not linked from any child screen.
export default function ReviewPage() {
  const units = getPath()
    .filter((u) => u.hasContent)
    .flatMap((u) => {
      const unit = getUnit(u.unitId);
      return unit ? [unit] : [];
    });
  return (
    <main className="mx-auto w-full max-w-2xl p-6 text-ink">
      <h1 className="font-display text-4xl font-bold">Revisão de conteúdo</h1>
      <p className="mt-2">Abre qualquer parada direto, sem salvar progresso.</p>
      {units.map((unit) => (
        <section key={unit.id} className="mt-8">
          <h2 className="font-display text-2xl font-bold">{unit.title}</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {unit.stops.map((stop) => {
              const ready = (stop.kind !== "song" && stop.kind !== "story") || SONG_AND_STORY_READY;
              const row = (
                <>
                  <StopIcon kind={stop.kind} state="current" size={48} />
                  <span className="flex-1 font-display text-xl font-semibold">{stop.title}</span>
                  <span className="text-sm">{ready ? KIND_LABEL[stop.kind] : `${KIND_LABEL[stop.kind]} (em construção)`}</span>
                </>
              );
              return (
                <li key={stop.id}>
                  {ready ? (
                    <Link
                      href={`${stopHref(stop.id)}?revisao=1`}
                      className="flex min-h-16 items-center gap-4 rounded-3xl bg-white px-4 py-2 shadow-md"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex min-h-16 items-center gap-4 rounded-3xl bg-white/60 px-4 py-2 opacity-70">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
