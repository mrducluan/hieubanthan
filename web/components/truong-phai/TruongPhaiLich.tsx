"use client";
// TP-1 — trường phái của lịch (Xem ngày tốt): khung chọn đọc chữ + nguồn từ SỔ engine (GET /v1/truong-phai), và dòng
// "cách kia làm khác kết quả này" (`diem_khac` engine trả) đặt ngay cạnh kết quả bị ảnh hưởng.
// Quy tắc 3 của TP-1: khung chỉ hiện khi bạn đã đổi khỏi mặc định HOẶC kết quả đang xem có chỗ cách kia làm khác.
import { useDiemPhai, useDuongCong, type DiemKhac, type DuongCong } from "@/lib/truong-phai";
import { ChipPhai, DongPhai, KhungPhai, NguonPhai } from "@/components/huyen-hoc/KhungPhai";
import { useChuLich } from "@/components/hoang-lich/chu-lich";
import { ghi } from "@/lib/do-luong";

export function KhungDuongCong({ diemKhac }: { diemKhac?: DiemKhac[] }) {
  const { c, en } = useChuLich();
  const [dc, datDc] = useDuongCong();
  const diem = useDiemPhai("duong_cong", en);
  const khac = (diemKhac ?? []).some((x) => x.ma === "duong_cong");
  if (!diem || (dc === "lich_viet" && !khac)) return null;
  const hien = diem.lua_chon.find((x) => x.ma === dc);
  const doi = (v: DuongCong) => { datDc(v); ghi("school_switched", { mo_dun: "lich", phai: v, truong: "duong_cong" }); };
  return (
    <KhungPhai testId="truong-phai-lich" moTa={c("tp.khung_mo_ta")}
      tomTat={<ChipPhai ds={[{ nhan: `${diem.ten}: ${hien?.ten ?? dc}`, khac: dc !== "lich_viet" }]} />}>
      <DongPhai testId="phai-duong-cong" ten={diem.ten} giaTri={dc} doi={doi} nhan={diem.ten} noiBat={khac}
        luaChon={diem.lua_chon.map((x) => [x.ma as DuongCong, x.ten])}
        goiY={<>{diem.mo_ta}<NguonPhai diem={diem} /></>} />
    </KhungPhai>
  );
}

/** Dòng ngay cạnh kết quả: "Lịch dân gian ghi ngày này kiêng (Dương Công). Sách Hiệp Kỷ ghi khác…" + nút đổi. */
export function DongDiemKhac({ ds, testId = "diem-khac" }: { ds?: DiemKhac[]; testId?: string }) {
  const [, datDc] = useDuongCong();
  const x = (ds ?? []).find((d) => d.ma === "duong_cong");
  if (!x) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-moon/40 bg-moon/[0.06] px-3 py-2 text-xs leading-relaxed text-moon"
      data-testid={testId} role="note">
      <span>{x.loi}</span>
      <button type="button" data-testid={`${testId}-nut`}
        onClick={() => { datDc(x.khac as DuongCong); ghi("school_switched", { mo_dun: "lich", phai: x.khac, truong: "duong_cong", tu: "diem_khac" }); }}
        className="rounded-full border border-moon/60 px-2.5 py-0.5 font-medium hover:bg-moon/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
        {x.nut}
      </button>
    </p>
  );
}
