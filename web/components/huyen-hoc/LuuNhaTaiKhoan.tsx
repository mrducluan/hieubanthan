"use client";
// KC-2 — nút "Lưu nhà vào tài khoản" (chỉ người đã đăng nhập; đồng ý rõ ràng mỗi lần bấm) + "Tải nhà từ tài khoản".
// Dữ liệu: hướng, năm xây, người cùng ở (năm sinh + giới tính), bố cục — không tên, không luận giải.
import { useState } from "react";
import { CloudDownload, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { useNguoiDung } from "@/lib/tai-khoan";
import { luuNhaVaoTaiKhoan, nhaTaiKhoan } from "@/lib/tai-khoan-nha";

export function LuuNhaTaiKhoan() {
  const nguoi = useNguoiDung();
  const nha = useHoSoNha();
  const [dongY, setDongY] = useState(false);
  const [tin, setTin] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  if (!nguoi || !nha) return null;
  const lam = async (f: () => Promise<string>) => {
    setDang(true); setTin(null);
    try { setTin(await f()); } catch (e) { setTin(e instanceof Error ? e.message : "Chưa làm được."); }
    finally { setDang(false); }
  };
  return (
    <div className="rounded-xl border border-line/70 p-4 text-sm" data-testid="luu-nha-tai-khoan">
      <label className="flex cursor-pointer items-start gap-2 text-fg-muted">
        <input type="checkbox" className="mt-1 size-4 accent-[rgb(var(--gold))]" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
        <span>Tôi đồng ý lưu <b>hướng nhà, năm xây, năm sinh và giới tính người cùng ở, bố cục đã khai</b> vào tài khoản để dùng trên máy khác. Không lưu tên, không lưu bài đọc. Xoá được bất cứ lúc nào.</span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={!dongY || dang} onClick={() => lam(async () => { await luuNhaVaoTaiKhoan(nguoi.id, nha); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "luu_nha_tai_khoan" }); return "Đã lưu nhà vào tài khoản."; })}>
          <CloudUpload aria-hidden /> Lưu nhà vào tài khoản
        </Button>
        <Button size="sm" variant="ghost" disabled={dang} onClick={() => lam(async () => {
          const n = await nhaTaiKhoan(nguoi.id);
          if (!n) return "Tài khoản chưa có nhà nào được lưu.";
          luuHoSoNha(n); return "Đã tải nhà từ tài khoản về máy này.";
        })}>
          <CloudDownload aria-hidden /> Tải nhà từ tài khoản
        </Button>
      </div>
      {tin && <p role="status" className="mt-2 text-fg-muted">{tin}</p>}
    </div>
  );
}
