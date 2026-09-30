import type { Metadata } from "next";
import { ChiaSe } from "./ChiaSe";

export const metadata: Metadata = { title: "Chia sẻ thẻ", robots: { index: false } };

export default function Page() {
  return <ChiaSe />;
}
