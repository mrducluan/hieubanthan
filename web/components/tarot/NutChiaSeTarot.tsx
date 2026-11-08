"use client";
// TR-3 — "Chia sẻ câu trả lời" dưới bài đọc Tarot: máy chủ đọc lại trải bài qua engine (/v1/tarot/the) rồi ký mã
// (lib/ma-moi.ts kyMaTarot — chỉ tên hiển thị, lá đã rút + vị trí, nghiêng, nhãn loại việc theo danh mục; KHÔNG câu hỏi bạn gõ,
// KHÔNG ngày sinh, KHÔNG lời đọc từng lá). Link /the/tarot/<mã>?tu=ta.<…> đo referral_signup như các thẻ khác; ảnh /og/tarot có QR.
import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { ChepTay, chepLink, guiHoacChep } from "@/components/chia-se/GuiLink";
import { useChuChung } from "@/components/cms/ChuChung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import type { LaRut, MaTraiBai } from "@/lib/tarot-chung";

export function NutChiaSeTarot({ traiBai, la, yDinh, viec, linhVuc }: { traiBai: MaTraiBai; la: LaRut[]; yDinh: string; viec: string | null; linhVuc: string | null }) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [the, setThe] = useState<{ ma: string; tu: string; link: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const [chepLoi, setChepLoi] = useState(false);
  const c = useChuChung();
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/tarot",
        { trai_bai: traiBai, la, y_dinh: yDinh, viec, linh_vuc: linhVuc, ten_hien_thi: ten.trim() });
      const u = new URL(`/the/tarot/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setThe({ ma, tu, link: u.toString() });
      ghi("share_created", { kind: "tarot", ma_moi: tu });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }
  const daXong = () => { setChepLoi(false); setDaChep(true); setTimeout(() => setDaChep(false), 2000); };
  async function chep() {
    if (!the) return;
    if ((await chepLink(the.link)) === "da_chep") daXong(); else setChepLoi(true);
  }
  async function chiaSe() {
    if (!the) return;
    const kq = await guiHoacChep({ title: "Lá bài trả lời", text: "Mình vừa hỏi lá bài một chuyện đang phân vân — bạn thử rút cho việc của bạn:", url: the.link });
    if (kq === "da_chep") daXong(); else setChepLoi(kq === "khong_duoc");
  }

  if (!mo) {
    return <Button variant="secondary" onClick={() => setMo(true)} data-testid="mo-chia-se-tarot"><Share2 aria-hidden /> Chia sẻ câu trả lời</Button>;
  }
  return (
    <section className="w-full rounded-2xl border border-gold/30 bg-gold/[0.05] p-4" aria-label="Thẻ Câu trả lời của lá bài" data-testid="chia-se-tarot">
      <h3 className="font-sans text-[1.02rem] font-semibold text-fg">Thẻ “Câu trả lời của lá bài”</h3>
      {!the ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="tarot-ten">Tên trên thẻ (không bắt buộc)</Label>
            <Input id="tarot-ten" value={ten} maxLength={24} placeholder="Bạn" onChange={(e) => setTen(e.target.value)} />
          </div>
          <p className="text-xs text-fg-faint">Thẻ chỉ có tên bạn gõ, các lá đã rút, hướng nghiêng và loại việc (vd “đổi sang công việc mới”) — không có câu bạn gõ, không có ngày sinh. Hết hạn sau 90 ngày.</p>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
          <Button onClick={() => void tao()} disabled={dang} data-testid="tao-the-tarot"><Share2 aria-hidden /> {dang ? c("chia_se.dang_tao") : "Tạo thẻ"}</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={the.link} aria-label="Link thẻ trải bài" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="link-the-tarot" />
            <Button variant="secondary" size="icon" onClick={() => void chep()} aria-label={c("chia_se.chep_link")}>{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
          {chepLoi && <ChepTay />}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void chiaSe()}><Share2 aria-hidden /> {c("chia_se.gui")}</Button>
            <Button asChild size="sm" variant="outline">
              <a href={`/og/tarot?ma=${encodeURIComponent(the.ma)}&khung=doc`} download="la-bai-tra-loi.png" data-testid="tai-anh-the-tarot"
                onClick={() => ghi("share_created", { kind: "tarot_anh", ma_moi: the.tu })}>
                <Download aria-hidden /> {c("chia_se.tai_story")}
              </a>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
