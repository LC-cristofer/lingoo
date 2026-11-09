import { Suspense } from "react";
import { getWorlds } from "@/domain/content";
import { LessonScreen } from "./LessonScreen";

export function generateStaticParams() {
  return getWorlds()
    .flatMap((w) => w.places)
    .filter((p) => p.hasContent)
    .map((p) => ({ lessonId: p.lessonId }));
}

async function Lesson({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonScreen lessonId={lessonId} />;
}

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  return (
    <Suspense fallback={null}>
      <Lesson params={params} />
    </Suspense>
  );
}
