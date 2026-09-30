import type { Metadata } from "next";
import { BatTu } from "./BatTu";

export const metadata: Metadata = {
  title: "Bát tự",
  description: "Bát tự tứ trụ theo tiết khí: thiên can, địa chi, thập thần, ngũ hành chấm điểm công bố, dụng thần trình bày hai cách, đại vận 10 năm.",
  alternates: { canonical: "/bat-tu" },
  openGraph: { title: "Bát tự", description: "Bát tự tứ trụ theo tiết khí: thiên can, địa chi, thập thần, ngũ hành chấm điểm công bố, dụng thần trình bày hai cách, đại vận 10 năm.", url: "/bat-tu" },
};

export default function Page() {
  return <BatTu />;
}
