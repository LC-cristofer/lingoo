/** Where a stop sends the child. Only a stop finished for the first time opens the return (the farol growing, the new thread). */
export function stopExitHref(stopId: string, reason: "done" | "quit", wasDone: boolean, review: boolean): string {
  if (review) return "/revisao";
  if (reason === "done" && !wasDone) return `/?volta=${encodeURIComponent(stopId)}`;
  return reason === "done" ? "/" : "/farol";
}
