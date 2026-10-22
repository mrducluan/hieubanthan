"use client";
// KC-4 GĐ1 — nút "Bật nhắc trên điện thoại" (Web Push). Chỉ hiện khi máy chủ đã có khoá VAPID + tài khoản bật; cần
// đăng nhập (để xoá được). Không tự hỏi quyền khi mở trang — chỉ khi người dùng bấm. iPhone: hướng dẫn 2 bước
// "Thêm vào màn hình chính". Mỗi ngày tối đa 1 thông báo, chỉ cho mốc người dùng tự đánh dấu.
import { useEffect, useState } from "react";
import Link from "next/link";
import { BellOff, BellRing, Share } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { useNguoiDung } from "@/lib/tai-khoan";
import { batPush, dongBoThietBi, khoaMayChu, tatPush, trangThaiPush, type TrangThaiPush } from "@/lib/web-push-trinh-duyet";
import { cn } from "@/lib/utils";

export function BatNhacPush({ className }: { className?: string }) {
  const nguoi = useNguoiDung();
  const [coMayChu, setCoMayChu] = useState(false);
  const [tt, setTt] = useState<TrangThaiPush | null>(null);
  const [ban, setBan] = useState(false);
  const [bao, setBao] = useState<string | null>(null);

  useEffect(() => {
    let huy = false;
    void khoaMayChu().then((k) => { if (!huy) setCoMayChu(Boolean(k)); });
    void trangThaiPush().then((t) => {
      if (huy) return;
      setTt(t);
      if (t === "dang_bat") void dongBoThietBi().then((con) => { if (!con && !huy) setTt("chua_bat"); });
    });
    return () => { huy = true; };
  }, []);

  if (!coMayChu || tt === null || tt === "khong_ho_tro" || nguoi === undefined) return null;
  const khung = cn("space-y-1.5 rounded-xl border border-line/70 p-3 text-sm", className);

  if (!nguoi) {
    return (
      <div className={khung} data-testid="push-can-dang-nhap">
        <p className="text-fg-muted">Muốn điện thoại báo đúng ngày, kể cả khi không mở trang?{" "}
          <Link href="/tai-khoan" className="text-gold hover:underline">Đăng nhập để bật nhắc</Link>.</p>
      </div>
    );
  }
  if (tt === "can_cai_ios") {
    return (
      <div className={khung} data-testid="push-ios">
        <p className="font-medium">Nhận nhắc trên iPhone/iPad</p>
        <ol className="list-decimal space-y-0.5 pl-5 text-fg-muted">
          <li>Bấm nút Chia sẻ <Share className="inline size-3.5" aria-label="Chia sẻ" /> trong Safari → <b>Thêm vào màn hình chính</b>.</li>
          <li>Mở Hiểu Bản Thân từ biểu tượng mới trên màn hình, vào Hôm nay rồi bấm <b>Bật nhắc</b>.</li>
        </ol>
        <p className="text-xs text-fg-faint">Cần iOS 16.4 trở lên. Hoặc dùng nút “Vào lịch” ở từng mốc.</p>
      </div>
    );
  }
  if (tt === "bi_chan") {
    return (
      <div className={khung} data-testid="push-bi-chan">
        <p className="text-fg-muted">Trình duyệt đang chặn thông báo của trang này. Mở cài đặt trang (biểu tượng ổ khoá cạnh địa chỉ) →
          Thông báo → Cho phép, rồi tải lại trang.</p>
      </div>
    );
  }

  const bat = async () => {
    setBan(true); setBao(null);
    try {
      await batPush(nguoi.id);
      setTt("dang_bat"); setBao("Đã bật. 8 giờ sáng ngày có mốc, thiết bị này sẽ nhận một thông báo.");
      ghi("chart_interacted", { kind: "push_bat" });
    } catch (e) {
      setBao(e instanceof Error ? e.message : "Chưa bật được.");
      setTt(await trangThaiPush());
    } finally { setBan(false); }
  };
  const tat = async () => {
    setBan(true); setBao(null);
    try { await tatPush(); setTt("chua_bat"); setBao("Đã tắt nhắc trên thiết bị này."); ghi("chart_interacted", { kind: "push_tat" }); }
    finally { setBan(false); }
  };

  return (
    <div className={khung} data-testid="bat-nhac-push" data-trang-thai={tt}>
      {tt === "dang_bat" ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-gold"><BellRing className="size-4" aria-hidden /> Đang bật nhắc trên thiết bị này</span>
          <button type="button" disabled={ban} onClick={tat} className="inline-flex items-center gap-1 text-xs text-fg-faint hover:text-fg">
            <BellOff className="size-3.5" aria-hidden /> Tắt</button>
        </div>
      ) : (
        <>
          <button type="button" disabled={ban} onClick={bat}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 px-3 py-1 text-gold hover:bg-gold/10 disabled:opacity-60">
            <BellRing className="size-4" aria-hidden /> {ban ? "Đang bật…" : "Bật nhắc trên điện thoại"}</button>
          <p className="text-xs text-fg-faint">8 giờ sáng ngày có mốc bạn đã đánh dấu, tối đa một thông báo mỗi ngày. Mốc sắp tới được lưu
            vào tài khoản để máy chủ biết ngày gửi; tắt hoặc xoá lúc nào cũng được. Không gửi quảng cáo.</p>
        </>
      )}
      {bao && <p className="text-xs text-fg-muted" role="status">{bao}</p>}
    </div>
  );
}
