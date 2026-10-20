"use client";
// TS-V3 tầng HỌC — "Câu trả lời này có đúng với bạn không?" dưới mỗi câu trả lời thần số.
// Gửi /api/thanso/phan-hoi: máy chủ chỉ lưu các con số đã tính + mã câu + phái (không tên, không ngày sinh); ghi chú chỉ
// được lưu khi người dùng TỰ tích đồng ý, và đã lọc email / số điện thoại / ngày tháng. PostHog chỉ nhận mã.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { hoTenList, type HoSo } from "@/lib/hoso";

export interface NguCanhGopY {
  phai: "pitago" | "chaldea" | "tong_hop";
  quyUoc: "tong_het" | "tung_phan";
  nguon: "hoi_dap" | "bai_doc" | "noi_dau";
  linhVuc?: string;
  maCau?: string;
}

export function GopYCauTraLoi({ hoSo, nc }: { hoSo: HoSo; nc: NguCanhGopY }) {
  const [buoc, setBuoc] = useState<"hoi" | "ghi_chu" | "xong">("hoi");
  const [ghiChu, setGhiChu] = useState("");
  const [dongY, setDongY] = useState(false);

  async function gui(dung: boolean, kemGhiChu = false) {
    ghi("feedback_submitted", { huu_ich: dung ? "co" : "khong", mo_dun: "thanso_hoi", phai: nc.phai, ma_cau: nc.maCau });
    setBuoc("xong");
    await fetch("/api/thanso/phan-hoi", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
        phai: nc.phai, quy_uoc_duong_doi: nc.quyUoc, nguon: nc.nguon, dung,
        ...(nc.linhVuc && /^[a-z_]{2,30}$/.test(nc.linhVuc) ? { linh_vuc: nc.linhVuc } : {}),
        ...(nc.maCau ? { ma_cau: nc.maCau } : {}),
        ...(kemGhiChu && dongY && ghiChu.trim() ? { ghi_chu: ghiChu.trim(), dong_y: true } : {}),
      }),
    }).catch(() => { /* góp ý là phần phụ: lỗi mạng thì thôi */ });
  }

  if (buoc === "xong") return <p className="text-xs text-fg-muted" data-testid="gop-y-xong">Cảm ơn bạn — góp ý này giúp câu trả lời tốt hơn cho mọi người.</p>;
  if (buoc === "ghi_chu") {
    return (
      <div className="space-y-2" data-testid="gop-y-ghi-chu">
        <Textarea rows={2} maxLength={300} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)}
          aria-label="Chưa đúng ở đâu?" placeholder="Chưa đúng ở đâu? Đừng ghi tên, số điện thoại, ngày sinh, sức khoẻ hay tôn giáo." />
        <label className="flex items-start gap-2 text-xs text-fg-muted">
          <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} className="mt-0.5" />
          Đồng ý dùng ghi chú này để cải thiện câu trả lời (lưu kèm các con số rút gọn, không kèm tên, ngày sinh hay tài
          khoản; email, số điện thoại, ngày tháng tự bị xoá; tự xoá sau 12 tháng).
        </label>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => gui(false, true)}>Gửi góp ý</Button>
          <Button size="sm" variant="ghost" onClick={() => gui(false)}>Bỏ qua ghi chú</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="gop-y-cau">
      <span className="text-xs text-fg-muted">Câu trả lời này có đúng với bạn không?</span>
      <Button size="sm" variant="outline" className="h-8" onClick={() => gui(true)}>Đúng</Button>
      <Button size="sm" variant="outline" className="h-8" onClick={() => setBuoc("ghi_chu")}>Chưa đúng</Button>
      <span className="w-full text-[11px] text-fg-faint">Góp ý lưu các con số rút gọn của bạn (nhiều người có chung), không lưu tên hay ngày sinh.</span>
    </div>
  );
}
