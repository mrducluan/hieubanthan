import type { Metadata } from "next";
import { KinhDich } from "./KinhDich";

export const metadata: Metadata = { title: "Kinh Dịch" };

export default function Page() {
  return <KinhDich />;
}
