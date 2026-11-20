"use client";
// Thẻ hiển thị kết quả phân loại tỷ lệ đo (Ngũ Hành Gương Mặt Lillian Bridges & 4 Dạng Bàn Tay phương Tây)
// hoàn toàn từ trường `fuzzy_bridge` do engine trả về — web không tự tính, dùng 100% theme "Đêm sao phương Đông".

export interface FuzzyMatBridge {
  provenance?: string;
  ngu_hanh_bridges?: {
    hanh: string;
    ten?: string;
    confidence: number;
    nghia_doi_thuong?: string;
    mat_tich_cuc?: string;
    mat_tieu_cuc_can_chu_y?: string;
    sach_ghi?: string;
  };
}

export interface FuzzyTayBridge {
  provenance?: string;
  dang_ban_tay?: {
    ma: string;
    ten: string;
    confidence: number;
    nghia_doi_thuong?: string;
    mat_tich_cuc?: string;
    mat_tieu_cuc_can_chu_y?: string;
  };
}

const TEN_HANH_EN: Record<string, string> = {
  moc: "Wood Face Archetype",
  hoa: "Fire Face Archetype",
  tho: "Earth Face Archetype",
  kim: "Metal Face Archetype",
  thuy: "Water Face Archetype",
};

const TEN_HANH_VI: Record<string, string> = {
  moc: "Gương mặt thiên hành Mộc",
  hoa: "Gương mặt thiên hành Hỏa",
  tho: "Gương mặt thiên hành Thổ",
  kim: "Gương mặt thiên hành Kim",
  thuy: "Gương mặt thiên hành Thủy",
};

export function TheNguHanhGuongMat({
  bridge,
  en = false,
}: {
  bridge?: FuzzyMatBridge | null;
  en?: boolean;
}) {
  const nb = bridge?.ngu_hanh_bridges;
  if (!nb) return null;
  const pct = Math.round(Math.max(0, Math.min(1, nb.confidence)) * 100);
  const tieuDe = nb.ten || (en ? TEN_HANH_EN[nb.hanh] ?? nb.hanh : TEN_HANH_VI[nb.hanh] ?? nb.hanh);

  return (
    <div
      className="rounded-2xl border border-gold/30 bg-surface/55 p-4 text-sm"
      data-testid="do-fuzzy-ngu-hanh"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-jade">
            {en ? "Facial Proportion Archetype" : "Khí chất gương mặt theo tỷ lệ đo"}
          </p>
          <p className="mt-0.5 font-serif text-base font-medium text-fg">{tieuDe}</p>
        </div>
        <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs tabular-nums text-jade">
          {en ? `Match ~${pct}%` : `Độ gần ~${pct}%`}
        </span>
      </div>

      {nb.nghia_doi_thuong && (
        <p className="mt-2.5 text-xs leading-relaxed text-fg">{nb.nghia_doi_thuong}</p>
      )}

      {(nb.mat_tich_cuc || nb.mat_tieu_cuc_can_chu_y) && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {nb.mat_tich_cuc && (
            <div className="rounded-xl border border-jade/30 bg-jade/10 p-3 text-xs leading-relaxed">
              <p className="font-semibold text-jade">{en ? "Strengths" : "Điểm sáng tự nhiên"}</p>
              <p className="mt-1 text-fg-muted">{nb.mat_tich_cuc}</p>
            </div>
          )}
          {nb.mat_tieu_cuc_can_chu_y && (
            <div className="rounded-xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-3 text-xs leading-relaxed">
              <p className="font-semibold text-[#f0b35c]">{en ? "Things to watch" : "Nên chú ý"}</p>
              <p className="mt-1 text-fg-muted">{nb.mat_tieu_cuc_can_chu_y}</p>
            </div>
          )}
        </div>
      )}

      {nb.sach_ghi && (
        <details className="mt-2.5 text-xs text-fg-muted">
          <summary className="cursor-pointer text-gold hover:underline">
            {en ? "Source note" : "Sách tham khảo ghi"}
          </summary>
          <p className="mt-1.5 italic leading-relaxed">{nb.sach_ghi}</p>
        </details>
      )}

      <p className="mt-2.5 text-[11px] text-fg-faint">
        {en
          ? "Reference reading from geometric proportions measured on your device — combine with the mirror questionnaire for a full picture."
          : "Gợi ý tham khảo theo tỷ lệ hình học đo trên máy bạn — kết hợp thêm khảo sát soi gương bên dưới để đọc trọn vẹn."}
      </p>
    </div>
  );
}

export function TheDangBanTayFuzzy({ bridge }: { bridge?: FuzzyTayBridge | null }) {
  const dt = bridge?.dang_ban_tay;
  if (!dt) return null;
  const pct = Math.round(Math.max(0, Math.min(1, dt.confidence)) * 100);

  return (
    <div
      className="rounded-2xl border border-gold/30 bg-surface/55 p-4 text-sm"
      data-testid="ct-fuzzy-dang-tay"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-jade">
            Dạng bàn tay theo tỷ lệ đo
          </p>
          <p className="mt-0.5 font-serif text-base font-medium text-fg">{dt.ten}</p>
        </div>
        <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs tabular-nums text-jade">
          Độ gần ~{pct}%
        </span>
      </div>

      {dt.nghia_doi_thuong && (
        <p className="mt-2.5 text-xs leading-relaxed text-fg">{dt.nghia_doi_thuong}</p>
      )}

      {(dt.mat_tich_cuc || dt.mat_tieu_cuc_can_chu_y) && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {dt.mat_tich_cuc && (
            <div className="rounded-xl border border-jade/30 bg-jade/10 p-3 text-xs leading-relaxed">
              <p className="font-semibold text-jade">Điểm sáng tự nhiên</p>
              <p className="mt-1 text-fg-muted">{dt.mat_tich_cuc}</p>
            </div>
          )}
          {dt.mat_tieu_cuc_can_chu_y && (
            <div className="rounded-xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-3 text-xs leading-relaxed">
              <p className="font-semibold text-[#f0b35c]">Nên chú ý</p>
              <p className="mt-1 text-fg-muted">{dt.mat_tieu_cuc_can_chu_y}</p>
            </div>
          )}
        </div>
      )}

      <p className="mt-2.5 text-[11px] text-fg-faint">
        Gợi ý tham khảo theo tỷ lệ lòng bàn tay và ngón tay đo trên máy bạn — kết hợp thêm quan sát đường chỉ và gò tay để đọc sâu hơn.
      </p>
    </div>
  );
}
