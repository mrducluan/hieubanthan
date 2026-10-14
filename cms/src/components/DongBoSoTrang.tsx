"use client";
// ND-0 — nút "Đồng bộ ngay" trên danh sách "Trang website": đọc sổ trang của web rồi tạo tài liệu cho URL mới, đánh dấu
// URL đã gỡ, cập nhật tên + chữ mặc định (không đụng ô biên tập). Job hằng ngày làm cùng việc này.
import { useRouter } from "next/navigation";
import { useState } from "react";

type Kq = { ok?: boolean; loi?: string; tao?: number; cap_nhat?: number; go?: number; mau_tao?: number; mau_cap_nhat?: number; mau_go?: number };

export function DongBoSoTrang() {
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<Kq | null>(null);
  const router = useRouter();

  async function chay() {
    setDang(true);
    const r = await fetch("/api/noi-dung-trang/dong-bo", { method: "POST", credentials: "include" }).catch(() => null);
    const d = ((await r?.json().catch(() => null)) ?? { loi: "Không kết nối được CMS." }) as Kq;
    setKq(r?.status === 403 ? { loi: "Chỉ Quản trị hoặc Chủ biên được đồng bộ." } : d);
    setDang(false);
    if (d.ok) router.refresh();
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, margin: "0 0 16px" }} data-testid="dong-bo-so-trang">
      <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={dang} onClick={() => void chay()}>
        {dang ? "Đang đồng bộ…" : "Đồng bộ ngay"}
      </button>
      <span style={{ fontSize: 13, opacity: 0.75 }}>
        {kq?.loi ? <span role="alert">Chưa đồng bộ được: {kq.loi}</span>
          : kq?.ok ? `Xong: ${kq.tao} trang mới, ${kq.cap_nhat} cập nhật, ${kq.go} URL đã gỡ · mẫu cụm: ${kq.mau_tao} mới, ${kq.mau_cap_nhat} cập nhật.`
          : "Danh sách tự đồng bộ mỗi ngày với các trang đang có trên hieuban.com. Trang mới thêm trong code → bấm để hiện ngay."}
      </span>
    </div>
  );
}
