"use client";

import { useRouter } from "next/navigation";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import { Mascot } from "@/components/Mascot";
import { PlayIcon } from "@/components/lesson/icons";

export default function Home() {
  const router = useRouter();
  const start = () => {
    narrator.unlock();
    void narrator.play({ text: "Hello! Let's play!" });
    router.push("/mapa");
  };
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-sky/20 p-4">
      <div className="scale-150">
        <Mascot mood="happy" />
      </div>
      <BigButton label="Começar" color="leaf" onPress={start}>
        <PlayIcon />
      </BigButton>
    </main>
  );
}
