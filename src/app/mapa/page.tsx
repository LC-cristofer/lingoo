import { redirect } from "next/navigation";

/** The old trail map is gone: the island is the home now. */
export default function MapPage() {
  redirect("/");
}
