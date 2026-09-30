import type { Metadata } from "next";
import { PhongThuy } from "./PhongThuy";

export const metadata: Metadata = { title: "Phong thuỷ" };

export default function Page() {
  return <PhongThuy />;
}
