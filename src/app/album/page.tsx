import { redirect } from "next/navigation";

/** The album lives in the nest now. */
export default function AlbumPage() {
  redirect("/ninho");
}
