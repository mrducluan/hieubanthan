"use client";
// SAO-V "Tặng một chương" — phần trình duyệt của trang nhận quà. Khách → đăng nhập rồi quay lại đúng link này; có tài
// khoản mà chưa lưu hồ sơ → hướng dẫn lưu (chương được tặng nằm trong báo cáo của CHÍNH người nhận); đủ điều kiện → "Nhận
// quà" rồi chuyển tới trang công cụ của mảng. Quà đã nhận / hết hạn → câu nhẹ nhàng + công cụ miễn phí.
// Đo: gift_opened{mo_dun, con_dung}, gift_claimed{mo_dun, ket_qua} — không bao giờ gửi mã quà.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Gift, LogIn, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { ghi } from "@/lib/do-luong";
import { DUONG_BAO_CAO, TEN_BAO_CAO, type MangLuanGiai } from "@/lib/luan-giai-mang";
import type { TrangQua } from "@/lib/qua-chuong";

/** Lời cho từng kết quả nhận quà không thành (trung tính, không trách). */
const LOI_KET_QUA: Record<string, string> = {
  tu_tang: "Đây là quà bạn tạo — hãy gửi link này cho một người bạn nhé.",
  da_dung: "Món quà này đã có người nhận rồi.",
  het_han: "Link quà đã hết hạn (quà giữ trong 7 ngày).",
  khong_hop_le: "Link quà không đúng — có thể bị chép thiếu.",
};

const ngayVn = (iso: string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric" }).format(new Date(iso));

export function NhanQua({ ma, banDau }: { ma: string; banDau: TrangQua | null }) {
  const router = useRouter();
  const [tt, setTt] = useState<TrangQua | null>(banDau);
  const [loiDoc, setLoiDoc] = useState(false);
  const [dang, setDang] = useState(false);
  const [ketQua, setKetQua] = useState<{ ma: string; mo_dun?: MangLuanGiai } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  // Máy chủ chưa đọc được (Supabase chậm) → thử lại một lần từ trình duyệt.
  useEffect(() => {
    if (banDau || !ma) return;
    let huy = false;
    fetch(`/api/qua/${ma}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("loi"))))
      .then((d: TrangQua) => { if (!huy) setTt(d); })
      .catch(() => { if (!huy) setLoiDoc(true); });
    return () => { huy = true; };
  }, [banDau, ma]);

  const daGhi = useRef(false);
  useEffect(() => {
    if (!tt || daGhi.current) return;
    daGhi.current = true;
    ghi("gift_opened", { mo_dun: tt.qua?.mo_dun ?? "khong_co", con_dung: tt.qua?.con_dung ? 1 : 0 });
  }, [tt]);

  async function nhan() {
    if (!tt?.qua) return;
    setDang(true); setLoi(null);
    const mang = tt.qua.mo_dun;
    try {
      const r = await fetch(`/api/qua/${ma}`, { method: "POST" });
      const d = (await r.json().catch(() => ({}))) as { ket_qua?: string; mo_dun?: MangLuanGiai; error?: string; can?: string };
      if (r.status === 401) { setTt({ ...tt, dang_nhap: false }); return; }
      if (!r.ok || !d.ket_qua) { setLoi(d.error ?? "Chưa nhận được quà, thử lại sau ít phút."); return; }
      ghi("gift_claimed", { mo_dun: d.mo_dun ?? mang, ket_qua: d.ket_qua });
      if (d.ket_qua === "da_nhan") { router.push(DUONG_BAO_CAO[d.mo_dun ?? mang]); return; }
      if (d.ket_qua === "chua_luu_ho_so") { setTt({ ...tt, co_ho_so: false }); return; }
      setKetQua({ ma: d.ket_qua, mo_dun: d.mo_dun });
    } catch {
      setLoi("Chưa nhận được quà, thử lại sau ít phút.");
    } finally {
      setDang(false);
    }
  }

  const khung = (noiDung: React.ReactNode) => (
    <div className="mx-auto max-w-md py-10 text-center" data-testid="nhan-qua">
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--moon) / 0.35) 45%, rgb(var(--jade) / 0.5))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto size-8" />
          {noiDung}
        </div>
      </div>
      <p className="mt-6 text-xs text-fg-faint">Quà là nội dung đọc thêm, không phải Sao. Sao không đổi ra tiền và không chuyển cho người khác được.</p>
    </div>
  );

  const congCu = (mang?: MangLuanGiai) => (
    <div className="mt-6 flex flex-col gap-2">
      <Button asChild><Link href={mang ? DUONG_BAO_CAO[mang] : "/than-so"}><Sparkles aria-hidden /> {mang ? `Xem ${TEN_BAO_CAO[mang]} của bạn` : "Xem con số của bạn — miễn phí"}</Link></Button>
      <Button asChild variant="ghost"><Link href="/kham-pha">Các công cụ miễn phí khác</Link></Button>
    </div>
  );

  if (!tt) {
    return khung(loiDoc || !ma ? (
      <>
        <h1 className="mt-4 font-serif text-3xl">{ma ? "Chưa mở được món quà" : "Link quà không đúng"}</h1>
        <p className="mt-3 text-fg-muted" data-testid="nhan-qua-trang-thai">
          {ma ? "Hệ thống đang bận một chút — bạn thử mở lại link sau ít phút nhé." : "Link có thể bị chép thiếu. Bạn vẫn dùng được các công cụ miễn phí."}
        </p>
        {congCu()}
      </>
    ) : <p className="mt-6 text-fg-muted">Đang mở món quà…</p>);
  }

  const qua = tt.qua;
  if (!qua || !qua.con_dung || (ketQua && ketQua.ma !== "da_co_qua")) {
    const loiKq = ketQua ? LOI_KET_QUA[ketQua.ma] : null;
    return khung(
      <>
        <h1 className="mt-4 font-serif text-3xl">Món quà này đã được mở</h1>
        <p className="mt-3 text-fg-muted" data-testid="nhan-qua-trang-thai">
          {loiKq ?? (qua ? "Link quà đã có người nhận hoặc đã quá 7 ngày. Không sao — phần cốt lõi luôn miễn phí, bạn xem ngay được." : "Không tìm thấy món quà mang link này. Bạn vẫn dùng được các công cụ miễn phí.")}
        </p>
        {congCu(qua?.mo_dun)}
      </>,
    );
  }

  const ten = TEN_BAO_CAO[qua.mo_dun];
  const tiep = `/qua/${ma}`;
  return khung(
    <>
      <p className="eyebrow mt-4 inline-flex items-center gap-1.5"><Gift className="size-3.5" aria-hidden /> Quà từ một người bạn</p>
      <h1 className="mt-2 font-serif text-3xl">Một người bạn tặng bạn một chương {ten}</h1>
      <p className="mt-3 text-fg-muted">
        Chương được tặng nằm trong {ten} của <b className="text-fg">chính bạn</b> — viết từ ngày giờ sinh của bạn, không phải của
        người gửi. Bạn đọc được trong 30 ngày kể từ lúc nhận.
      </p>
      <p className="mt-2 text-xs text-fg-faint">Nhận trước ngày {ngayVn(qua.het_han)}.</p>

      {ketQua?.ma === "da_co_qua" ? (
        <>
          <p className="mt-6 rounded-xl bg-moon/10 px-4 py-3 text-sm text-moon" data-testid="nhan-qua-trang-thai">
            Bạn đã nhận một chương tặng cho mảng này rồi — chương đó vẫn nằm trong báo cáo của bạn. Link này để dành cho người khác nhé.
          </p>
          {congCu(qua.mo_dun)}
        </>
      ) : !tt.dang_nhap ? (
        <div className="mt-6 space-y-2">
          <Button asChild className="w-full"><Link href={`/dang-nhap?tiep=${encodeURIComponent(tiep)}`} data-testid="nhan-qua-dang-nhap"><LogIn aria-hidden /> Đăng nhập để nhận quà</Link></Button>
          <p className="text-xs text-fg-faint">Đăng nhập bằng email hoặc Google, xong sẽ quay lại đúng trang này.</p>
        </div>
      ) : !tt.co_ho_so ? (
        <div className="mt-6 space-y-2 text-left" data-testid="nhan-qua-luu-ho-so">
          <p className="text-sm text-fg-muted">
            Để mở chương trong báo cáo của chính bạn, tài khoản cần có hồ sơ ngày sinh của bạn. Nhập (hoặc mở) hồ sơ, bấm
            <b className="text-fg"> Lưu vào tài khoản</b>, rồi mở lại link quà này.
          </p>
          <Button asChild className="w-full"><Link href="/tai-khoan#tai-khoan"><Save aria-hidden /> Lưu hồ sơ vào tài khoản</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          <Button onClick={nhan} disabled={dang} className="w-full" data-testid="nhan-qua-nut">
            <Gift aria-hidden /> {dang ? "Đang nhận…" : "Nhận quà"}
          </Button>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
        </div>
      )}
    </>,
  );
}
