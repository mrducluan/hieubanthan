"use client";
// EN-ALL GĐ 4 — chọn nước → thành phố (sinh ở nước ngoài) dùng chung cho form phụ (Người thân, Xem lá số 2 người), cùng
// danh sách engine và cùng chữ với form hồ sơ chính (NhapHoSo). Trả MÃ thành phố (vd "us-new_york"); múi giờ chuẩn và giờ
// mùa hè lúc sinh do engine suy từ tzdata — web không tính.
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/input";
import { useChuGiaoDien } from "@/components/khung/chu-giao-dien";
import { useDanhSachNuoc } from "@/lib/mui-gio";

export function ChonNuocThanhPho({ id, giaTri, doi }: { id: string; giaTri: string; doi: (ma: string) => void }) {
  const { c: g, en } = useChuGiaoDien();
  const [nuoc, setNuoc] = useState(giaTri && !giaTri.includes("/") ? giaTri.slice(0, 2) : "");
  const { nuoc: ds, loi, thuLai } = useDanhSachNuoc(true);
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid={`${id}-nuoc-ngoai`}>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={`${id}-nuoc`}>{g("hs.nuoc")}</Label>
        <Select id={`${id}-nuoc`} value={nuoc} onChange={(e) => { setNuoc(e.target.value); doi(""); }} disabled={!ds && !loi}>
          <option value="">{ds ? g("hs.chon_nuoc") : g("hs.dang_tai")}</option>
          {ds?.map((n) => <option key={n.ma} value={n.ma}>{en ? n.ten_en || n.ten : n.ten}</option>)}
        </Select>
        {loi && <button type="button" onClick={thuLai} className="text-xs text-cinnabar underline">{loi} {g("hs.thu_lai")}</button>}
      </div>
      {nuoc && (
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`${id}-thanh-pho`}>{g("hs.thanh_pho")}</Label>
          <Select id={`${id}-thanh-pho`} value={giaTri} onChange={(e) => doi(e.target.value)}>
            <option value="">{g("hs.chon_thanh_pho")}</option>
            {ds?.find((n) => n.ma === nuoc)?.thanh_pho.map((t) => <option key={t.ma} value={t.ma}>{en ? t.ten_en || t.ten : t.ten}</option>)}
          </Select>
        </div>
      )}
    </div>
  );
}
