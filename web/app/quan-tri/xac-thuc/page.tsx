import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { phienQuanTri } from "@/lib/quan-tri";
import { XacThuc } from "./XacThuc";

export const metadata: Metadata = { title: "Xác thực hai lớp" };

export default async function Page() {
  const p = await phienQuanTri();
  if (p.trang === "chua_dang_nhap") redirect("/dang-nhap?tiep=/quan-tri");
  if (p.trang === "ok") redirect("/quan-tri");
  if (p.trang !== "can_mfa") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  return <XacThuc factorId={p.factorId} email={p.user.email ?? null} />;
}
