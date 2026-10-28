"use client";
// TP-LICH — khung "Trường phái" dùng chung cho Tử vi, Thần số, Bát tự, Phong thuỷ.
// Web chỉ gửi lựa chọn; engine tính lại theo đúng lựa chọn và trả về kết quả + cờ "đổi phái có làm khác không".
//
// TP-GON (2026-10-28, chủ dự án: "khung chọn phái chiếm nhiều chữ quá"): thu gọn mặc định. Đóng = một hàng tiêu đề
// + các phái ĐANG DÙNG (chip) + một dòng nhắc chỉ khi đổi phái làm khác kết quả của chính người xem. Bấm cả hàng để mở.
// Phần mở nằm sẵn trong HTML (thuộc tính `hidden`, không gỡ khỏi DOM) — bot đọc được, mở/đóng không giật trang.
// Giải thích từng dòng gập sau "Khác nhau thế nào?" trừ dòng `noiBat` (dòng đó luôn hiện, màu trăng).
import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Info, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Mốc đầu năm tính mệnh quái (phong thuỷ): Lập xuân / Tết âm lịch Việt Nam / Tết âm lịch Trung Quốc. */
export type MocNam = "lap_xuan" | "tet_viet" | "tet_trung";

/** Một phái đang dùng, hiện dạng chip khi khung đóng. `khac` = khác mặc định (viền vàng để người dùng nhớ mình đã đổi). */
export type PhaiDangDung = { nhan: string; khac?: boolean };

export function ChipPhai({ ds }: { ds: PhaiDangDung[] }) {
  return (
    <span className="flex flex-wrap gap-1.5" data-testid="phai-dang-dung">
      {ds.map((p) => (
        <span key={p.nhan}
          className={cn("rounded-full border px-2 py-0.5 text-[11px] leading-4",
            p.khac ? "border-gold/60 bg-gold/10 text-gold" : "border-line/70 bg-surface/50 text-fg-muted")}>
          {p.nhan}
        </span>
      ))}
    </span>
  );
}

/**
 * `tomTat`: nội dung hàng tóm tắt khi đóng (chip phái hoặc một câu "đang xem theo…"). Có `tomTat` → khung thu gọn;
 *   không truyền → khung mở luôn như bản cũ (giữ cho nơi gọi chưa chuyển).
 * `nhac`: câu nhắc riêng cho người xem (vd "ngày sinh của bạn lệch hai lịch") — hiện cả khi đóng.
 * `mo` / `doiMo`: điều khiển từ ngoài khi khung có thể bị gỡ rồi dựng lại lúc engine tính lại (Tử vi), để không tự đóng.
 */
export function KhungPhai({ moTa, children, testId, tomTat, nhac, tieuDe = "Trường phái", mo: moNgoai, doiMo }: {
  moTa: ReactNode; children: ReactNode; testId: string; tomTat?: ReactNode; nhac?: ReactNode; tieuDe?: string;
  mo?: boolean; doiMo?: (v: boolean) => void;
}) {
  const [moTrong, setMoTrong] = useState(false);
  const mo = moNgoai ?? moTrong;
  const datMo = (v: boolean) => { setMoTrong(v); doiMo?.(v); };
  const id = useId();
  const vungId = `${testId}-chon`;

  if (!tomTat) {
    return (
      <section aria-label={tieuDe} className="rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 sm:px-5" data-testid={testId}>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Layers className="size-4 text-gold" aria-hidden /> {tieuDe}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{moTa}</p>
        <div className="mt-2">{children}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${id}-td`} data-testid={testId} data-mo={mo ? "1" : "0"}
      className={cn("rounded-2xl border bg-surface/40 transition-colors", mo ? "border-gold/40" : "border-line/70")}>
      <button type="button" onClick={() => datMo(!mo)} aria-expanded={mo} aria-controls={vungId} data-testid={`${testId}-mo`}
        className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-5">
        <Layers className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
        <span className="min-w-0 flex-1">
          <span id={`${id}-td`} className="block text-sm font-semibold text-fg">{tieuDe}</span>
          <span className="mt-1.5 block text-xs text-fg-muted">{tomTat}</span>
          {nhac && (
            <span className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-moon" data-testid={`${testId}-nhac`}>
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-moon" aria-hidden />
              <span>{nhac}</span>
            </span>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-sm font-medium text-gold">
          {mo ? "Thu gọn" : "Đổi"}
          <ChevronDown className={cn("size-4 transition-transform", mo && "rotate-180")} aria-hidden />
        </span>
      </button>
      <div id={vungId} hidden={!mo} className="px-4 pb-3 sm:px-5">
        <div className="border-t border-line/60 pt-3">
          <p className="text-xs leading-relaxed text-fg-muted">{moTa}</p>
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Khung một dòng lựa chọn: tên + nhãn "ảnh hưởng tới bạn" + ô chọn + giải thích (gập, trừ khi `noiBat`). */
export function DongKhung({ ten, goiY, noiBat, nhanNoiBat = "Khác với bạn", children, testId }: {
  ten: string; goiY: ReactNode; noiBat?: boolean; nhanNoiBat?: string; children: ReactNode; testId?: string;
}) {
  return (
    <div className="border-t border-line/50 py-3 first:border-t-0" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-medium text-fg">{ten}</p>
        {noiBat && <span className="rounded-full bg-moon/15 px-2 py-0.5 text-[11px] leading-4 text-moon">{nhanNoiBat}</span>}
      </div>
      <div className="mt-2">{children}</div>
      {noiBat ? (
        <p className="mt-2 text-xs leading-relaxed text-moon">{goiY}</p>
      ) : (
        <details className="group mt-1.5">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 py-1 text-xs text-fg-faint hover:text-fg-muted [&::-webkit-details-marker]:hidden">
            <Info className="size-3.5" aria-hidden /> Khác nhau thế nào?
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="mt-1 text-xs leading-relaxed text-fg-faint">{goiY}</p>
        </details>
      )}
    </div>
  );
}

/** Ô chọn dạng nút trượt: trên điện thoại các lựa chọn chia đều bề ngang (không tràn, không cuộn ngang). */
export function ChonPhai<T extends string>({ giaTri, doi, luaChon, nhan }: {
  giaTri: T; doi: (v: T) => void; luaChon: [T, string][]; nhan: string;
}) {
  return (
    <Tabs value={giaTri} onValueChange={(v) => doi(v as T)}>
      <TabsList aria-label={nhan} className="grid w-full auto-cols-fr grid-flow-col sm:inline-flex sm:w-auto">
        {luaChon.map(([v, chu]) => (
          <TabsTrigger key={v} value={v} className="min-w-0 shrink whitespace-normal px-2 text-center leading-tight sm:px-4">{chu}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function DongPhai<T extends string>({ ten, giaTri, doi, luaChon, goiY, noiBat, nhanNoiBat, nhan, testId }: {
  ten: string; giaTri: T; doi: (v: T) => void; luaChon: [T, string][]; goiY: ReactNode; noiBat?: boolean; nhanNoiBat?: string;
  nhan: string; testId?: string;
}) {
  return (
    <DongKhung ten={ten} goiY={goiY} noiBat={noiBat} nhanNoiBat={nhanNoiBat} testId={testId}>
      <ChonPhai giaTri={giaTri} doi={doi} luaChon={luaChon} nhan={nhan} />
    </DongKhung>
  );
}

/** Dòng chỉ để giải thích (mảng đó không phụ thuộc lựa chọn này) — nói rõ thay vì ẩn đi. */
export function DongGhiChu({ ten, children }: { ten: string; children: ReactNode }) {
  return (
    <div className="border-t border-line/50 py-3 first:border-t-0">
      <p className="text-sm font-medium text-fg">{ten}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-faint">{children}</p>
    </div>
  );
}
