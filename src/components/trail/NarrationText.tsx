import { Fragment } from "react";
import type { Narration } from "@/domain/trail/schema";

export function NarrationText({ narration }: { narration: Narration }) {
  return (
    <>
      {narration.map((segment, i) => (
        <Fragment key={i}>
          {i > 0 ? " " : null}
          {segment.lang === "en-US" ? (
            <b lang="en" className="font-extrabold text-sky">
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
