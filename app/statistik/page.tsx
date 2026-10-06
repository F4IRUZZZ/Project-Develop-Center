import { redirect } from "next/navigation";

// Statistik dilebur ke /profil (#188): route lama dipertahankan sebagai
// redirect agar bookmark/link lama tak mati.
export default function StatistikAlih() {
  redirect("/profil");
}
