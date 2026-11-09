import { Suspense } from "react";
import { LessonScreen } from "./LessonScreen";

export function generateStaticParams() {
  return [{ lessonId: "forest-animals" }];
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
