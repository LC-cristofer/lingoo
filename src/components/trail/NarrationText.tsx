import { Fragment } from "react";
import type { Narration } from "@/domain/trail/schema";

/** "plain" is for coloured strips: English keeps lang="en" but not the sky highlight (unreadable on green). */
export function NarrationText({ narration, tone = "highlight" }: { narration: Narration; tone?: "highlight" | "plain" }) {
  return (
    <>
      {narration.map((segment, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          {segment.lang === "en-US" ? (
            <b lang="en" className={tone === "plain" ? "font-extrabold" : "font-extrabold text-sky"}>
              {segment.text}
            </b>
          ) : (
            <span>{segment.text}</span>
          )}
        </Fragment>
      ))}
    </>
  );
}
