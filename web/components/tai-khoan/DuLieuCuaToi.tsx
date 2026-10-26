"use client";
// ĐY-1 — "Dữ liệu của tôi" (Luật BVDLCN 91/2025: quyền biết, rút đồng ý, xoá, lấy bản sao). Liệt kê các đồng ý / dữ liệu
// người dùng đã cho — trên máy này và trong tài khoản — mỗi dòng một nút rút / xoá có hiệu lực ngay. Không có route xuất
// dữ liệu tự động → nút "Yêu cầu bản sao qua email" mở thư tới hộp dữ liệu cá nhân (xử lý tay theo chính sách).
// Hồ sơ trên máy / trong tài khoản và nhắc trên điện thoại đã có nút riêng ở các mục trên trang Tài khoản → chỉ trỏ tới.
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { coGoogle, docLuaChon, hoiLai } from "@/lib/dong-y";
import { ngayDongY, thuHoiDongY, useDongYDuLieu } from "@/lib/dong-y-du-lieu";
import { useDanhSachNha, useHoSoNha, xoaMoiNhaTrenMay } from "@/lib/ho-so-nha";
import { useHoSo } from "@/lib/hoso";
import { useKyUc } from "@/lib/ky-uc";
import { useNhacViec, xoaNhac } from "@/lib/nhac-viec";
import { useNguoiDung } from "@/lib/tai-khoan";
import { nhaTaiKhoan, xoaNhaTaiKhoan } from "@/lib/tai-khoan-nha";
import { nhacTaiKhoan, xoaNhacTaiKhoan } from "@/lib/tai-khoan-nhac";

function Dong({ ten, trangThai, nut, testId }: { ten: string; trangThai: ReactNode; nut?: ReactNode; testId?: string }) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between" data-testid={testId}>
      <div className="min-w-0 text-sm">
        <p className="text-fg">{ten}</p>
        <p className="text-xs text-fg-muted">{trangThai}</p>
      </div>
      {nut && <div className="shrink-0">{nut}</div>}
    </li>
  );
}

export function DuLieuCuaToi({ emailDuLieu }: { emailDuLieu: string | null }) {
  const hoSo = useHoSo();
  const dongY = useDongYDuLieu();
  const nha = useHoSoNha();
  const dsNha = useDanhSachNha();
  const nhac = useNhacViec();
  const user = useNguoiDung();
  const kyUc = useKyUc();
  const [cookie, setCookie] = useState<"dong_y" | "tu_choi" | null | undefined>(undefined);
  const [coGa, setCoGa] = useState(false);
  const [nhaTk, setNhaTk] = useState<boolean | null>(null);
  const [nhacTk, setNhacTk] = useState<{ ngay: string; ma: string }[] | null>(null);
  const [hoiThuHoi, setHoiThuHoi] = useState(false);
  const [bao, setBao] = useState<string | null>(null);

  useEffect(() => { setCoGa(coGoogle()); setCookie(docLuaChon()); }, []);
  useEffect(() => {
    if (!user) { setNhaTk(null); setNhacTk(null); return; }
    let huy = false;
    // Bảng chưa có (migration chưa chạy) → lỗi nhẹ → coi như không có dữ liệu, không vỡ trang.
    nhaTaiKhoan(user.id).then((n) => { if (!huy) setNhaTk(Boolean(n)); }).catch(() => { if (!huy) setNhaTk(false); });
    nhacTaiKhoan(user.id).then((ds) => { if (!huy) setNhacTk(ds.map((x) => ({ ngay: x.ngay, ma: x.ma }))); }).catch(() => { if (!huy) setNhacTk([]); });
    return () => { huy = true; };
  }, [user]);

  const soNha = (nha ? 1 : 0) + (dsNha?.filter((c) => c.id !== nha?.id).length ?? 0);
  const chuDe = emailDuLieu ? `mailto:${emailDuLieu}?subject=${encodeURIComponent("Yêu cầu bản sao dữ liệu cá nhân")}&body=${encodeURIComponent(
    "Tôi muốn nhận bản sao dữ liệu cá nhân gắn với tài khoản của tôi (email hoặc số điện thoại đăng nhập: …).")}` : null;

  return (
    <Card className="space-y-4" data-testid="du-lieu-cua-toi">
      <p className="text-sm text-fg-muted">Mỗi đồng ý bạn đã cho đều rút lại được ngay tại đây. Rút đồng ý không ảnh hưởng việc đã xử lý trước đó.</p>

      <div>
        <p className="eyebrow">Trên máy này</p>
        <ul className="divide-y divide-line/60">
          <Dong ten="Đồng ý gửi ngày giờ sinh đi tính (không lưu khi chưa đăng nhập)" testId="dl-dong-y"
            trangThai={dongY ? `Đã đồng ý ngày ${ngayDongY(dongY) ?? "—"}` : dongY === null ? "Chưa đồng ý — form hồ sơ sẽ hỏi khi bạn bấm xem." : "…"}
            nut={dongY ? <Button size="sm" variant="ghost" onClick={() => setHoiThuHoi(true)}>Thu hồi</Button> : undefined} />
          <Dong ten="Hồ sơ (họ tên, ngày giờ sinh)"
            trangThai={hoSo ? <>Đang lưu trên máy — sửa / xoá ở mục <a href="#tren-may" className="text-gold underline">Trên máy này</a>.</> : "Không có."} />
          <Dong ten="Hồ sơ nhà (hướng, năm xây, người cùng ở, bố cục)" testId="dl-nha-may"
            trangThai={soNha ? `${soNha} căn trên máy này.` : "Không có."}
            nut={soNha ? <Button size="sm" variant="ghost" onClick={() => { xoaMoiNhaTrenMay(); setBao("Đã xoá hồ sơ nhà trên máy này."); }}>Xoá hồ sơ nhà trên máy</Button> : undefined} />
          <Dong ten="Mốc nhắc (hiện ở Hôm nay)" testId="dl-nhac-may"
            trangThai={nhac.length ? `${nhac.length} mốc trên máy này.` : "Không có."}
            nut={nhac.length ? <Button size="sm" variant="ghost" onClick={() => { for (const n of nhac) xoaNhac(n.id); setBao("Đã xoá mốc nhắc trên máy này."); }}>Xoá mốc nhắc trên máy</Button> : undefined} />
          {coGa && (
            <Dong ten="Cookie thống kê truy cập (Google Analytics)"
              trangThai={cookie === "tu_choi" ? "Đã từ chối." : cookie === "dong_y" ? "Đã đồng ý." : "Chưa chọn — đang bật theo mặc định."}
              nut={<Button size="sm" variant="ghost" onClick={hoiLai}>Tuỳ chọn cookie</Button>} />
          )}
        </ul>
      </div>

      {user && (
        <div>
          <p className="eyebrow">Trong tài khoản</p>
          <ul className="divide-y divide-line/60">
            <Dong ten="Hồ sơ đã lưu vào tài khoản"
              trangThai={<>Xem / xoá ở mục <a href="#tai-khoan" className="text-gold underline">Tài khoản</a> phía trên (có hiệu lực ngay).</>} />
            <Dong ten="Nhà đã lưu vào tài khoản" testId="dl-nha-tk"
              trangThai={nhaTk === null ? "…" : nhaTk ? "Đang lưu." : "Không có."}
              nut={nhaTk ? <Button size="sm" variant="ghost" onClick={() => xoaNhaTaiKhoan(user.id).then(() => { setNhaTk(false); setBao("Đã xoá nhà trong tài khoản."); }).catch((e) => setBao((e as Error).message))}>Xoá nhà trong tài khoản</Button> : undefined} />
            <Dong ten="Mốc nhắc trong tài khoản (để gửi thông báo đúng ngày)" testId="dl-nhac-tk"
              trangThai={nhacTk === null ? "…" : nhacTk.length ? `${nhacTk.length} mốc.` : "Không có."}
              nut={nhacTk?.length ? <Button size="sm" variant="ghost" onClick={async () => {
                try { for (const n of nhacTk) await xoaNhacTaiKhoan(user.id, n.ngay, n.ma); setNhacTk([]); setBao("Đã xoá mốc nhắc trong tài khoản."); }
                catch (e) { setBao((e as Error).message); }
              }}>Xoá mốc nhắc trong tài khoản</Button> : undefined} />
            <Dong ten="Nhắc trên điện thoại (thông báo đẩy) và các ô nhận thêm"
              trangThai={<>Bật / tắt ở mục <a href="#tai-khoan" className="text-gold underline">Tài khoản</a> phía trên; tắt là máy chủ xoá đăng ký thiết bị này.</>} />
            <Dong ten="Điều bạn bấm “Ghi nhớ” (câu băn khoăn)" testId="dl-ky-uc"
              trangThai={kyUc.ds.length ? `${kyUc.ds.length} mục gần nhất.` : "Không có."}
              nut={kyUc.ds.length ? <Button size="sm" variant="ghost" onClick={async () => { for (const k of kyUc.ds) await kyUc.xoa(k.id); setBao("Đã xoá các điều đã ghi nhớ."); }}>Xoá ký ức</Button> : undefined} />
            <Dong ten="Bài luận đã lưu và tuỳ chọn “Tự lưu”"
              trangThai={<>Xem, xoá từng bài hoặc tắt tự lưu ở <Link href="/ban-than/bai-da-luu" className="text-gold underline">Bài đã lưu</Link>.</>} />
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-4 text-sm">
        {chuDe ? (
          <Button asChild size="sm" variant="secondary"><a href={chuDe}>Yêu cầu bản sao dữ liệu qua email</a></Button>
        ) : <span className="text-fg-muted">Yêu cầu bản sao dữ liệu: liên hệ qua email ở chân trang.</span>}
        <Link href="/chinh-sach-rieng-tu#dong-y" className="text-xs text-fg-muted underline underline-offset-2 hover:text-fg">Cách bạn đồng ý và rút lại</Link>
      </div>
      {bao && <p role="status" className="text-sm text-jade">{bao}</p>}

      <Sheet open={hoiThuHoi} onOpenChange={setHoiThuHoi}>
        <SheetContent title="Thu hồi đồng ý?" description="Bản đồng ý và hồ sơ trên máy này sẽ bị xoá. Tài khoản (nếu có) không bị ảnh hưởng; lần sau bấm xem, form sẽ hỏi lại.">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setHoiThuHoi(false)}>Huỷ</Button>
            <Button className="flex-1 bg-none bg-cinnabar text-bg shadow-none" onClick={() => { setHoiThuHoi(false); thuHoiDongY(); setBao("Đã thu hồi đồng ý và xoá hồ sơ trên máy này."); }}>Thu hồi</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
