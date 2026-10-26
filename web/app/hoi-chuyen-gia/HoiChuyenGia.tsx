"use client";
// SAO-CG — biểu mẫu đặt câu hỏi chuyên gia. Thứ tự: chọn mảng → viết câu (đếm ký tự) → (tuỳ chọn, KHÔNG tích sẵn) chia sẻ hồ sơ
// → kiểm câu đặc biệt ở engine (khủng hoảng → lời hỗ trợ, không bán) → đăng nhập nếu cần → hội viên dùng lượt HOẶC thanh toán QR.
// Hồ sơ gửi đi = ảnh chụp CHỈ các trường cần (lib/chuyen-gia-hoi HoSoCg), lấy từ hồ sơ trên máy, chỉ khi ô đồng ý được tích.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, Loader2, LockKeyhole, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { gioHienThi, ngaySinhIso, useHoSo, type HoSo } from "@/lib/hoso";
import { supabase } from "@/lib/supabase/trinh-duyet";
import {
  CAU_HOI_TOI_DA, CAU_HOI_TOI_THIEU, dinhDangVnd, giaLanNay, MANG_CAN_LA_SO, MANG_CG, TEN_MANG_CG,
  type HoSoCg, type MangCg, type ThongTinCg,
} from "@/lib/chuyen-gia-hoi";

const KHOA_NHAP = "cg:nhap";   // giữ câu đang viết qua bước đăng nhập (sessionStorage, chỉ trên máy)

function anhChupHoSo(h: HoSo): HoSoCg {
  const gio = gioHienThi(h);
  return {
    ho_ten: h.ho_ten, ngay_sinh: ngaySinhIso(h),
    ...(gio ? { gio_sinh: gio, do_tin_gio: h.do_tin_gio ?? "exact" } : h.do_tin_gio === "unknown" ? { do_tin_gio: "unknown" as const } : {}),
    ...(h.gioi_tinh ? { gioi_tinh: h.gioi_tinh } : {}),
    ...(h.noi_sinh ? { noi_sinh: h.noi_sinh } : {}),
    ...(h.gio_mua_he ? { gio_mua_he: true } : {}),
  };
}

export function HoiChuyenGia({ banDau }: { banDau: ThongTinCg }) {
  const router = useRouter();
  const hoSo = useHoSo();
  const [tt, setTt] = useState<ThongTinCg>(banDau);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [mang, setMang] = useState<MangCg>("than_so");
  const [cau, setCau] = useState("");
  const [dongY, setDongY] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hoTro, setHoTro] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(KHOA_NHAP) ?? "null") as { mang?: MangCg; cau?: string } | null;
      if (v?.cau) { setCau(v.cau.slice(0, CAU_HOI_TOI_DA)); if (v.mang && MANG_CG.includes(v.mang)) setMang(v.mang); }
    } catch { /* bỏ qua */ }
    void supabase().then(async (sb) => {
      const tk = (await sb?.auth.getSession())?.data.session?.access_token ?? null;
      setToken(tk);
      fetch("/api/chuyen-gia/thong-tin", { headers: tk ? { authorization: `Bearer ${tk}` } : {}, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null)).then((d: ThongTinCg | null) => { if (d && typeof d.bat === "boolean") setTt(d); })
        .catch(() => { /* giữ thông tin máy chủ */ });
    });
  }, []);

  const doDai = cau.trim().length;
  const gia = giaLanNay(tt);
  const hoiVien = typeof tt.hoi_vien_con_luot === "number" && tt.hoi_vien_con_luot > 0;
  const chupHoSo = hoSo && dongY ? anhChupHoSo(hoSo) : null;

  async function gui(dungHoiVien: boolean) {
    setLoi(null); setHoTro(null);
    if (doDai < CAU_HOI_TOI_THIEU) { setLoi(`Câu hỏi cần ít nhất ${CAU_HOI_TOI_THIEU} ký tự.`); return; }
    setDang(true);
    try {
      // 1. Câu đặc biệt (engine RULES): khủng hoảng → hỗ trợ, không bán; ngoài phạm vi → nói rõ.
      const k = await fetch("/api/chuyen-gia/kiem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cau_hoi: cau.trim() }) });
      const kj = (await k.json().catch(() => ({}))) as { loai?: string | null };
      if (kj.loai === "an_toan") {
        setHoTro("Có vẻ bạn đang rất mệt. Hỏi chuyên gia không phải nơi phù hợp lúc này — hãy nói chuyện ngay với một người bạn tin, hoặc gọi đường dây hỗ trợ tâm lý gần bạn. Chúng tôi không bán câu hỏi này.");
        return;
      }
      if (kj.loai === "tu_choi_nhe") {
        setLoi("Câu này nằm ngoài phạm vi chuyên gia trả lời (bệnh tật, sống chết, xổ số, tuyển dụng). Hãy hỏi về con đường, lựa chọn, thời điểm của chính bạn.");
        return;
      }
      // 2. Đăng nhập (giữ câu đang viết trên máy).
      if (!token) {
        try { sessionStorage.setItem(KHOA_NHAP, JSON.stringify({ mang, cau })); } catch { /* bỏ qua */ }
        router.push("/dang-nhap?tiep=%2Fhoi-chuyen-gia");
        return;
      }
      ghi("expert_question_started", { mang, mien_phi: dungHoiVien ? 1 : 0 });
      const r = await fetch("/api/chuyen-gia/tao", {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ mang, cau_hoi: cau.trim(), dong_y: dongY, ...(chupHoSo ? { ho_so: chupHoSo } : {}), dung_hoi_vien: dungHoiVien }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; loai?: string; can?: string; checkoutUrl?: string; mien_phi?: boolean };
      if (!r.ok) {
        if (j.loai === "an_toan") { setHoTro(j.error ?? ""); return; }
        if (j.can === "dang_nhap") { router.push("/dang-nhap?tiep=%2Fhoi-chuyen-gia"); return; }
        setLoi(j.error ?? "Chưa gửi được câu hỏi.");
        return;
      }
      try { sessionStorage.removeItem(KHOA_NHAP); } catch { /* bỏ qua */ }
      if (j.mien_phi) { router.push("/tai-khoan/cau-hoi?moi=1"); return; }
      if (j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
      setLoi("Chưa tạo được đơn thanh toán.");
    } catch {
      setLoi("Không kết nối được, thử lại sau ít phút.");
    } finally {
      setDang(false);
    }
  }

  if (!tt.bat) {
    return (
      <section className="glass mt-8 rounded-2xl p-5" data-testid="cg-chua-mo">
        <p className="flex items-center gap-2 text-fg"><LockKeyhole className="size-4 text-gold" aria-hidden /> Hỏi chuyên gia sắp mở.</p>
        <p className="mt-1 text-sm text-fg-muted">Trong lúc chờ, bạn vẫn hỏi đáp miễn phí ở từng mảng — <Link href="/kham-pha" className="text-gold hover:underline">Khám phá</Link>.</p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-5" aria-labelledby="cg-form" data-testid="cg-form">
      <h2 id="cg-form" className="font-serif text-2xl">Câu hỏi của bạn</h2>
      <label className="block text-sm">
        <span className="mb-1 block text-fg-muted">Mảng</span>
        <Select value={mang} onChange={(e) => setMang(e.target.value as MangCg)} data-testid="cg-mang" aria-label="Mảng">
          {MANG_CG.map((m) => <option key={m} value={m}>{TEN_MANG_CG[m]}</option>)}
        </Select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 flex items-baseline justify-between text-fg-muted">
          <span>Câu hỏi (một việc cụ thể, càng rõ càng dễ trả lời đúng)</span>
          <span data-testid="cg-dem" className={doDai > CAU_HOI_TOI_DA ? "text-cinnabar" : ""}>{doDai.toLocaleString("vi-VN")}/{CAU_HOI_TOI_DA.toLocaleString("vi-VN")}</span>
        </span>
        <Textarea rows={6} maxLength={CAU_HOI_TOI_DA} value={cau} onChange={(e) => setCau(e.target.value)} aria-label="Câu hỏi cho chuyên gia"
          placeholder="Ví dụ: Tôi 34 tuổi, đang cân nhắc rời công ty để mở tiệm riêng vào đầu năm sau. Theo lá số, thời điểm nào trong 12 tháng tới hợp hơn và tôi nên lưu ý điều gì?" />
      </label>

      <div className="glass rounded-2xl p-4 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} data-testid="cg-dong-y" className="mt-1 size-4 accent-[rgb(var(--gold))]" />
          <span>
            <b className="text-fg">Chia sẻ hồ sơ của tôi với chuyên gia</b> (không bắt buộc). Chuyên gia sẽ thấy: họ tên hiển thị, ngày sinh
            {hoSo && gioHienThi(hoSo) ? ", giờ sinh" : ""}{hoSo?.gioi_tinh ? ", giới tính" : ""}{hoSo?.noi_sinh ? ", nơi sinh" : ""} — đúng như trong hồ sơ trên máy này.
            Bản chụp này <b className="text-fg">tự xoá 30 ngày sau khi trả lời</b>; không tích thì chuyên gia trả lời theo câu chữ.
            {MANG_CAN_LA_SO.includes(mang) && <> Với {TEN_MANG_CG[mang]}, có giờ sinh + nơi sinh thì lá số mới lập được.</>}
          </span>
        </label>
        {dongY && !hoSo && hoSo !== undefined && (
          <p className="mt-2 text-fg-muted" data-testid="cg-chua-ho-so">Máy này chưa có hồ sơ — <Link href="/" className="text-gold underline">tạo hồ sơ</Link> rồi quay lại, hoặc bỏ tích để hỏi theo câu chữ.</p>
        )}
        {chupHoSo && (
          <p className="mt-2 text-fg-muted" data-testid="cg-xem-chia-se">
            Sẽ gửi: {chupHoSo.ho_ten} · {chupHoSo.ngay_sinh.split("-").reverse().join("/")}{chupHoSo.gio_sinh ? ` · ${chupHoSo.gio_sinh}` : chupHoSo.do_tin_gio === "unknown" ? " · không rõ giờ" : ""}
            {chupHoSo.gioi_tinh ? ` · ${chupHoSo.gioi_tinh === "nam" ? "nam" : "nữ"}` : ""}{chupHoSo.noi_sinh ? ` · ${chupHoSo.noi_sinh}` : ""}
          </p>
        )}
      </div>

      <p className="text-xs text-fg-faint">
        Không chẩn đoán bệnh, không đoán xổ số, không nói ngày chết, không quyết định thay bạn chuyện tuyển dụng hay cho vay. Đừng gõ số điện thoại, địa chỉ vào câu hỏi.
      </p>

      {hoTro && (
        <div role="alert" className="rounded-2xl border border-jade/40 bg-jade/10 p-4 text-sm" data-testid="cg-ho-tro">
          <p className="flex items-start gap-2 text-fg"><HeartHandshake className="mt-0.5 size-4 shrink-0 text-jade" aria-hidden />{hoTro}</p>
          <p className="mt-2 text-fg-muted">Xem thêm ở <Link href="/mien-tru-trach-nhiem#khung-hoang" className="text-gold underline">Khi bạn đang khủng hoảng</Link>.</p>
        </div>
      )}
      {loi && <p role="alert" className="text-sm text-cinnabar" data-testid="cg-loi">{loi}</p>}

      <div className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <QrCode className="size-8 shrink-0 text-gold" aria-hidden />
        <div className="flex-1 text-sm">
          <p className="font-medium text-fg" data-testid="cg-gia">
            {dinhDangVnd(gia)} · một câu hỏi
            {tt.lan_dau !== false && tt.giam_lan_dau_pt > 0 && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">câu đầu giảm {tt.giam_lan_dau_pt} %</span>}
          </p>
          <p className="text-fg-muted">Thanh toán QR một lần bằng đồng, không dùng Sao. Trả lời trong {tt.han_gio} giờ hoặc hoàn 100 %.</p>
          {typeof tt.dang_cho === "number" && tt.dang_cho > 0 && <p className="mt-1 text-xs text-fg-faint">Bạn đang có {tt.dang_cho} câu chờ trả lời — xem ở <Link href="/tai-khoan/cau-hoi" className="text-gold underline">Câu hỏi của tôi</Link>.</p>}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {hoiVien && (
            <Button variant="secondary" onClick={() => void gui(true)} disabled={dang || doDai < CAU_HOI_TOI_THIEU} data-testid="cg-hoi-vien">
              <Sparkles aria-hidden /> Dùng 1 lượt hội viên (còn {tt.hoi_vien_con_luot})
            </Button>
          )}
          <Button onClick={() => void gui(false)} disabled={dang || doDai < CAU_HOI_TOI_THIEU || !tt.cong} data-testid="cg-gui">
            {dang ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {token === null ? "Đăng nhập và gửi câu hỏi" : `Gửi và thanh toán ${dinhDangVnd(gia)}`}
          </Button>
          {!tt.cong && <p className="text-xs text-fg-faint" data-testid="cg-chua-cong">Cổng thanh toán đang chuẩn bị mở.</p>}
        </div>
      </div>
    </section>
  );
}
