import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { ChuaCoToken } from "@/components/quan-tri/ChuaCoToken";
import { congQuanTri, SUA_KB } from "@/lib/quan-tri";
import { CHI_XEM, coGithub, docTepKb, LoiGithub, NHANH_GOC, TEN_TEP, THU_MUC_KB, urlRepo } from "@/lib/github-quan-tri";
import { TEN_TEP_KB } from "@/lib/ten-tep-kb";
import { BienTap } from "./BienTap";

export async function generateMetadata({ params }: { params: Promise<{ tep: string }> }): Promise<Metadata> {
  return { title: `Sửa ${(await params).tep}` };
}

export default async function Page({ params }: { params: Promise<{ tep: string }> }) {
  const ten = `${(await params).tep}.json`;
  if (!TEN_TEP.test(ten)) notFound();
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  if (!coGithub()) return <ChuaCoToken />;

  let tep: { text: string; sha: string };
  try { tep = await docTepKb(ten); } catch (e) {
    if (e instanceof LoiGithub && e.status === 404) notFound();
    return <Card><p role="alert" className="text-sm text-cinnabar">{e instanceof LoiGithub ? e.message : "Chưa đọc được file."}</p></Card>;
  }
  return (
    <BienTap ten={ten} nhan={TEN_TEP_KB[ten] ?? ten} text={tep.text} sha={tep.sha}
      duocSua={SUA_KB.includes(p.vaiTro) && !CHI_XEM.has(ten)}
      urlGithub={`${urlRepo()}/blob/${NHANH_GOC}/${THU_MUC_KB}/${ten}`} />
  );
}
