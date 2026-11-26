/** Where a quit from a stop goes back to: the tree for the Árvore das Letras' units, the farol for the rest. */
export function stopHomeHref(stopId: string): string {
  return stopId.startsWith("letras-") ? "/arvore" : "/farol";
}

/** Where a stop sends the child. Only a stop finished for the first time opens the return (the place growing, the new thread). */
export function stopExitHref(stopId: string, reason: "done" | "quit", wasDone: boolean, review: boolean): string {
  if (review) return "/revisao";
  if (reason === "done" && !wasDone) return `/?volta=${encodeURIComponent(stopId)}`;
  return reason === "done" ? "/" : stopHomeHref(stopId);
}
