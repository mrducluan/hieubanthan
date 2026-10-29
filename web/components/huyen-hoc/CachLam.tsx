"use client";
// UI-PT2 A — "Cách làm" gập: 3 bước ngắn + hình vẽ nét cho từng việc người xem nhà hay lúng túng (đo hướng, vẽ mặt bằng,
// đặt phòng / dấu hiệu). Chỉ hướng dẫn thao tác — không thêm dữ kiện phong thuỷ nào ngoài engine.
import { useId, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export type ViecHuongDan = "do_huong" | "do_huong_can_ho" | "ve_mat_bang" | "dat_phong" | "ban_do" | "ban_do_may_tinh";

const NET = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Hình 48×48 vẽ nét cho từng bước. */
function Hinh({ ma }: { ma: string }) {
  switch (ma) {
    case "cua": return <svg viewBox="0 0 48 48" aria-hidden><rect x="14" y="8" width="20" height="34" rx="2" {...NET} /><circle cx="29" cy="26" r="1.6" fill="currentColor" /><path d="M6 42h36" {...NET} /></svg>;
    case "lung": return <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="12" r="5" {...NET} /><path d="M14 40v-9a10 10 0 0 1 20 0v9M24 22v8M20 44h8" {...NET} /><path d="M38 14l6 6-6 6" {...NET} /></svg>;
    case "dien_thoai": return <svg viewBox="0 0 48 48" aria-hidden><rect x="10" y="20" width="28" height="14" rx="3" {...NET} /><path d="M24 20v-8M20 12h8" {...NET} /><circle cx="24" cy="27" r="2" fill="currentColor" /></svg>;
    case "ban_cong": return <svg viewBox="0 0 48 48" aria-hidden><path d="M6 40h36M10 40V22h28v18M14 22v-8h20v8" {...NET} /><path d="M18 30h12" {...NET} /></svg>;
    case "ban_do": return <svg viewBox="0 0 48 48" aria-hidden><path d="M8 12l10-4 12 4 10-4v28l-10 4-12-4-10 4z" {...NET} /><path d="M18 8v28M30 12v28" {...NET} /><circle cx="24" cy="22" r="3" fill="currentColor" /></svg>;
    case "luoi": return <svg viewBox="0 0 48 48" aria-hidden><rect x="8" y="8" width="32" height="32" rx="2" {...NET} /><path d="M8 19h32M8 29h32M19 8v32M29 8v32" {...NET} /><rect x="19" y="19" width="10" height="10" fill="currentColor" fillOpacity=".35" /></svg>;
    case "to": return <svg viewBox="0 0 48 48" aria-hidden><rect x="8" y="8" width="32" height="32" rx="2" {...NET} /><path d="M8 19h32M8 29h32M19 8v32M29 8v32" {...NET} /><rect x="8" y="8" width="21" height="21" fill="currentColor" fillOpacity=".3" /><rect x="8" y="29" width="32" height="11" fill="currentColor" fillOpacity=".3" /></svg>;
    case "phong": return <svg viewBox="0 0 48 48" aria-hidden><rect x="8" y="8" width="32" height="32" rx="2" {...NET} /><path d="M8 19h32M8 29h32M19 8v32M29 8v32" {...NET} /><path d="M12 16h4M31 36h6M22 26h4" {...NET} /></svg>;
    case "tam": return <svg viewBox="0 0 48 48" aria-hidden><rect x="8" y="10" width="32" height="28" rx="2" {...NET} /><circle cx="24" cy="24" r="3" fill="currentColor" /><path d="M24 14v6M24 28v6M14 24h6M28 24h6" {...NET} /></svg>;
    case "mat": return <svg viewBox="0 0 48 48" aria-hidden><path d="M6 24s7-10 18-10 18 10 18 10-7 10-18 10S6 24 6 24z" {...NET} /><circle cx="24" cy="24" r="4" {...NET} /></svg>;
    case "danh_dau": return <svg viewBox="0 0 48 48" aria-hidden><rect x="10" y="10" width="28" height="28" rx="4" {...NET} /><path d="M17 24l5 5 9-11" {...NET} /></svg>;
    default: return <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="14" {...NET} /></svg>;
  }
}

const BUOC: Record<ViecHuongDan, { tieu_de: string; buoc: { hinh: string; chu: string }[]; luu_y?: string }> = {
  do_huong: {
    tieu_de: "Cách đo hướng nhà bằng điện thoại",
    buoc: [
      { hinh: "cua", chu: "Đứng ngay ngưỡng cửa chính, bên trong nhà." },
      { hinh: "lung", chu: "Quay lưng vào nhà, mặt nhìn ra ngoài đường." },
      { hinh: "dien_thoai", chu: "Giữ điện thoại nằm ngang trước ngực, bấm Đo rồi Chốt khi số đứng yên." },
    ],
    luu_y: "Tránh xe máy, cột thép, loa, tủ lạnh trong 1 m. Đo 2–3 lần, lệch quá 5° thì đo lại ở điểm khác trước cửa.",
  },
  do_huong_can_ho: {
    tieu_de: "Căn hộ chung cư: đo ở đâu?",
    buoc: [
      { hinh: "ban_cong", chu: "Đứng ở ban công hoặc cửa sổ lớn nhất của căn, mặt nhìn ra ngoài." },
      { hinh: "dien_thoai", chu: "Giữ điện thoại nằm ngang, cách khung sắt, máy lạnh ít nhất 1 m, bấm Đo rồi Chốt." },
      { hinh: "ban_do", chu: "Không đo được? Dùng “Lấy hướng từ bản đồ”: tâm căn hộ và điểm ngay dưới ban công." },
    ],
    luu_y: "Cửa căn hộ mở ra hành lang kín thường không dùng làm hướng nhà; nhiều sách lấy hướng theo mặt thoáng (ban công) hoặc theo toà nhà — bài đọc ghi rõ đang dùng cách nào.",
  },
  ve_mat_bang: {
    tieu_de: "Cách vẽ mặt bằng trên lưới",
    buoc: [
      { hinh: "luoi", chu: "Hàng trên cùng là mặt trước nhà (phía cửa / ban công nhìn ra)." },
      { hinh: "to", chu: "Chế độ “Tô ô”: bấm các ô nhà chiếm. Nhà chữ L thì bỏ trống góc khuyết. Có ảnh mặt bằng thì đặt ảnh làm nền để tô theo." },
      { hinh: "phong", chu: "Chọn Cửa, WC, Ban công… rồi bấm ô tương ứng. Máy tự tính tâm nhà, khuyết góc, WC giữa nhà." },
    ],
  },
  dat_phong: {
    tieu_de: "Cách đặt phòng và đánh dấu dấu hiệu",
    buoc: [
      { hinh: "tam", chu: "Đứng ở giữa nhà, cầm la bàn (hoặc nhớ hướng cửa): phòng này nằm về phía nào so với tâm?" },
      { hinh: "phong", chu: "Chọn phòng rồi bấm ô phương đó trên sơ đồ 9 phương (Bắc ở trên)." },
      { hinh: "danh_dau", chu: "Đi một vòng, tích những dấu hiệu bạn thấy thật. Không chắc thì bỏ qua — chỉ luận cái đã xác nhận." },
    ],
  },
  ban_do: {
    tieu_de: "Lấy hướng từ bản đồ",
    buoc: [
      { hinh: "tam", chu: "Mở bản đồ, nhấn giữ vào giữa nhà bạn → chép toạ độ hoặc link vào ô “Tâm nhà”. Hoặc đứng giữa nhà bấm “Lấy vị trí hiện tại”." },
      { hinh: "ban_do", chu: "Nhấn giữ vào điểm ngay trước mặt nhà (ngoài đường, dưới ban công) → ô “Điểm trước mặt nhà”." },
      { hinh: "mat", chu: "Bấm Tính: góc từ tâm tới điểm trước là hướng nhà theo bắc thật. Toạ độ không lưu." },
    ],
    luu_y: "GPS trong nhà thường lệch 10–30 m; với nhà nhỏ nên dùng cách nhấn giữ trên bản đồ, chọn điểm trước nhà cách tâm ≥ 15 m.",
  },
  ban_do_may_tinh: {
    tieu_de: "Lấy hướng trên máy tính (Google Maps)",
    buoc: [
      { hinh: "ban_do", chu: "Bấm “Mở Google Maps ảnh vệ tinh” (cho phép vị trí để bản đồ mở sẵn gần nhà bạn), phóng to tới khi thấy rõ mái nhà." },
      { hinh: "tam", chu: "Chuột phải lên giữa mái nhà → bấm dòng số đầu tiên (Google tự chép) → quay lại đây bấm nút Dán ở ô “Tâm nhà”." },
      { hinh: "mat", chu: "Chuột phải lên mặt đường ngay trước cửa nhà → chép → Dán ở ô “Điểm trước mặt nhà” → Tính." },
    ],
    luu_y: "Máy tính không có GPS: nút “Lấy vị trí hiện tại” chỉ đoán theo wifi (lệch hàng chục mét), không dùng để chấm hai điểm. Điểm trước nhà nên cách tâm ≥ 10 m.",
  },
};

export function CachLam({ viec, moSan = false, className }: { viec: ViecHuongDan; moSan?: boolean; className?: string }) {
  const [mo, setMo] = useState(moSan);
  const id = useId();
  const h = BUOC[viec];
  return (
    <div className={cn("text-sm", className)} data-testid={`cach-lam-${viec}`}>
      <button type="button" aria-expanded={mo} aria-controls={id} data-testid="cach-lam-mo"
        onClick={() => { setMo((v) => !v); if (!mo) ghi("chart_interacted", { mo_dun: "phongthuy", kind: "cach_lam", viec }); }}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg">
        <CircleHelp className="size-3.5" aria-hidden /> Cách làm (30 giây) <ChevronDown className={cn("size-3.5 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!mo} className="mt-2 rounded-xl border border-line/70 bg-bg/40 p-3">
        <p className="font-medium text-fg">{h.tieu_de}</p>
        <ol className="mt-2 grid gap-3 sm:grid-cols-3">
          {h.buoc.map((b, i) => (
            <li key={i} className="flex gap-2.5 sm:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold [&>svg]:size-8"><Hinh ma={b.hinh} /></span>
              <span className="text-fg-muted"><b className="text-gold">{i + 1}.</b> {b.chu}</span>
            </li>
          ))}
        </ol>
        {h.luu_y && <p className="mt-2 text-xs text-fg-faint">{h.luu_y}</p>}
      </div>
    </div>
  );
}
