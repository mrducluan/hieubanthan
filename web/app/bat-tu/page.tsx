import type { Metadata } from "next";
import { BatTu } from "./BatTu";

export const metadata: Metadata = { title: "Bát tự" };

export default function Page() {
  return <BatTu />;
}
