"use client";
// Cửa Sao v2 "Ba lối mở" (docs/CUA-SAO-V2.md) — các mảnh của hộp thoại Sao: thanh ví (có / cần), thẻ "Miễn phí — mời
// bạn" (link mời xem hợp đôi gắn mã mời ?gt=, gửi một chạm ngay trong hộp) và thẻ hội viên năm. Câu chữ ở lib/loi-sao.ts.
// Thưởng mời chỉ cộng khi bạn bè THẬT đăng nhập + lưu hồ sơ (hàm SQL quyết) — thẻ nói rõ, không thưởng cho cú bấm.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Loader2, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChepTay, guiHoacChep } from "@/components/chia-se/GuiLink";
import { ghi, maMoiTuToken } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { hoTenList, tenGoi, useHoSo } from "@/lib/hoso";
import { layMaCuaToi } from "@/lib/sao";
import { useMucSao } from "@/lib/muc-sao";
import { docQuyUocDD } from "@/lib/quy-uoc-dd";
import { dieuKienMoi, ketQuaMoi } from "@/lib/loi-sao";
import { dongHoiVien, type HoiVien } from "@/lib/thanh-toan/hoi-vien";
import type { YeuCauSao } from "@/lib/sao-client";

/** Ví có bao nhiêu / cần bao nhiêu — một thanh, không màu đỏ (thiếu Sao không phải lỗi của người dùng). */
export function ThanhVi({ co, can }: { co: number; can: number }) {
  const pt = can > 0 ? Math.min(100, Math.round((co / can) * 100)) : 100;
  return (
    <div data-testid="thanh-vi" data-co={co} data-can={can}>
      <div className="flex items-baseline justify-between text-xs text-fg-muted">
        <span>Ví của bạn</span>
        <span><b className="font-serif text-base text-gold">{co}</b> / {can} Sao</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${pt}%` }} />
      </div>
    </div>
  );
}

/** Thẻ "Miễn phí — mời bạn" (đã đăng nhập). Ẩn khi cả hai mức thưởng mời = 0. Link tạo sẵn lúc thẻ hiện để bấm là gửi
 *  ngay (Safari mất "cú bấm" nếu phải chờ máy chủ ký mã sau khi bấm). */
export function TheMoiBan({ nguon, gia, thieu, kind }: { nguon: YeuCauSao["nguon"]; gia: number; thieu: number; kind: string }) {
  const muc = useMucSao();
  const hoSo = useHoSo();
  // undefined = đang lấy · null = không lấy được (chưa chạy migration / mạng lỗi) → ẩn thẻ: link không mã = không thưởng.
  const [maCuaToi, setMaCuaToi] = useState<string | null | undefined>(undefined);
  const [link, setLink] = useState<string | null>(null);
  const [maThe, setMaThe] = useState<string | null>(null);
  const [kq, setKq] = useState<"" | "da_gui" | "da_chep" | "khong_duoc">("");
  const ten = hoSo ? tenGoi(hoSo) : "";
  const loiNhan = ten
    ? `${ten} vừa xem bản đồ con số trên Hiểu Bản Thân — mở link, nhập ngày sinh của bạn để xem hai người hợp nhau chỗ nào.`
    : "Mình vừa xem bản đồ con số trên Hiểu Bản Thân — bạn thử xem con số của bạn nói gì nhé.";

  useEffect(() => {
    let huy = false;
    layMaCuaToi().then((m) => { if (!huy) setMaCuaToi(m || null); }, () => { if (!huy) setMaCuaToi(null); });
    return () => { huy = true; };
  }, []);

  useEffect(() => {
    if (!maCuaToi) return;
    let huy = false;
    void (async () => {
      let duong = "/";
      let ma: string | null = null;
      if (hoSo) {
        // Link mời xem hợp đôi: chỉ tên hiển thị + con số (mã HMAC), không ngày sinh — như nút "Tạo link mời" ở trang chủ.
        ma = await postJson<{ ma: string }>("/api/chia-se/tao", {
          ten_hien_thi: tenGoi(hoSo), ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
          quy_uoc_duong_doi: docQuyUocDD(),
        }).then((d) => d.ma).catch(() => null);
        if (ma) duong = `/hop-doi/${ma}`;
      }
      const u = new URL(duong, window.location.origin);
      u.searchParams.set("gt", maCuaToi);
      if (!huy) { setLink(u.toString()); setMaThe(ma); }
    })();
    return () => { huy = true; };
  }, [maCuaToi, hoSo]);

  if (!muc || (muc.moi_ban <= 0 && muc.duoc_moi <= 0) || maCuaToi === null) return null;
  const dong = ketQuaMoi({ nguon, gia, thieu, moiBan: muc.moi_ban });

  async function gui() {
    if (!link) return;
    ghi("sao_prompt_answered", { kind, ket_qua: "moi_ban", nguon });
    ghi("share_created", { kind: "invite", nguon: "hop_sao", co_ma: true, ...(maThe ? { ma_moi: maMoiTuToken(maThe) } : {}) });
    const r = await guiHoacChep({ title: "Hiểu Bản Thân", text: loiNhan, url: link }, `${loiNhan} ${link}`);
    if (r !== "huy") setKq(r);
  }

  return (
    <div className="rounded-2xl border border-line/70 bg-bg/40 p-4" data-testid="the-moi-ban">
      <p className="flex items-center gap-2 font-medium text-fg">
        <UserPlus className="size-4 text-jade" aria-hidden /> Miễn phí — mời bạn
        <span className="ml-auto rounded-full bg-jade/15 px-2 py-0.5 text-xs font-semibold text-jade">+{muc.moi_ban} Sao / bạn</span>
      </p>
      {dong && <p className="mt-1.5 text-sm text-fg" data-testid="moi-ban-ket-qua">{dong}</p>}
      <p className="mt-2 rounded-xl border border-line/50 bg-bg/60 px-3 py-2 text-xs italic text-fg-muted">“{loiNhan}”</p>
      <Button variant="secondary" className="mt-3 w-full" onClick={() => void gui()} disabled={!link} data-testid="moi-ban-nut">
        {!link ? <Loader2 className="animate-spin" aria-hidden /> : kq === "da_gui" || kq === "da_chep" ? <Check aria-hidden /> : <Share2 aria-hidden />}
        {kq === "da_gui" ? "Đã gửi — gửi thêm người khác" : kq === "da_chep" ? "Đã chép lời mời — dán vào Zalo, Messenger" : "Gửi lời mời"}
      </Button>
      {kq === "khong_duoc" && link && <ChepTay url={link} className="mt-2" />}
      <p className="mt-2 text-xs text-fg-faint" data-testid="moi-ban-dieu-kien">
        {dieuKienMoi({ moiBan: muc.moi_ban, duocMoi: muc.duoc_moi, tran: muc.tran })}
      </p>
    </div>
  );
}

/** Thẻ hội viên năm (chỉ khi công tắc bật — nơi gọi kiểm hienDongHoiVien). */
export function TheHoiVien({ hv, kind, nguon }: { hv: HoiVien; kind: string; nguon: YeuCauSao["nguon"] }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line/70 bg-bg/40 p-4" data-testid="dong-hoi-vien">
      <Crown className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
      <p className="flex-1 text-sm text-fg-muted">{dongHoiVien(hv)}{" "}
        <Link href="/hoi-vien" className="whitespace-nowrap text-gold underline underline-offset-4"
          onClick={() => ghi("sao_prompt_answered", { kind, ket_qua: "hoi_vien", nguon })}>Xem hội viên năm</Link></p>
    </div>
  );
}
