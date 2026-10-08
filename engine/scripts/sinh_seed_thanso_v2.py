# -*- coding: utf-8 -*-
"""Sinh supabase/seed_thanso_v2.sql và migration 0009 (chân dung + quan hệ) từ các file KB v2.

File JSON là nguồn chân lý; SQL chỉ để nạp lên Supabase (chạy trong SQL Editor
SAU migration 0003). Chạy: python scripts/sinh_seed_thanso_v2.py
"""
from __future__ import annotations

import json
from pathlib import Path

D = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
OUT = Path(__file__).resolve().parents[2] / "supabase" / "seed_thanso_v2.sql"
MIG_0009 = Path(__file__).resolve().parents[2] / "supabase" / "migrations" / "0009_kb_thanso_chan_dung_quan_he.sql"
# Khối của migration 0009 (TS-SAU) — nằm trong bảng thanso_kb_khoi có sẵn, không đổi schema.
KHOI_0009 = ("chan_dung_mat", "chan_dung", "quan_he", "quan_he_theo_so")


def q(s) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def doc(ten):
    return json.loads((D / ten).read_text(encoding="utf-8"))


def main() -> None:
    dong = ["-- SINH TỰ ĐỘNG bởi engine/scripts/sinh_seed_thanso_v2.py — đừng sửa tay.",
            "-- Chạy SAU migrations/0003_kb_thanso_v2.sql. Chạy lại an toàn (upsert).", "begin;"]
    lv = doc("thanso_linh_vuc.json")
    for so, cac in lv["noi_dung"].items():
        for ten_lv, m in cac.items():
            dong.append(
                "insert into thanso_linh_vuc_nghia (gia_tri, linh_vuc, xu_huong, mat_toi, goi_y, cau_tu_soi,"
                " trang_thai, source_id, school_id) values "
                f"({so}, {q(ten_lv)}, {q(m['xu_huong'])}, {q(m['mat_toi'])}, {q(m['goi_y'])}, "
                f"{q(m['cau_tu_soi'])}, {q(lv['trang_thai'])}, {q(lv['source_id'])}, {q(lv['school_id'])})"
                " on conflict (gia_tri, linh_vuc, source_id, school_id) do update set"
                " xu_huong = excluded.xu_huong, mat_toi = excluded.mat_toi, goi_y = excluded.goi_y,"
                " cau_tu_soi = excluded.cau_tu_soi;")
    cap = doc("thanso_cap_so.json")
    for k, m in cap["cap"].items():
        dong.append(
            "insert into thanso_cap_so (cap, hoa, va, cung_lam, trang_thai, source_id, school_id) values "
            f"({q(k)}, {q(m['hoa'])}, {q(m['va'])}, {q(m['cung_lam'])}, {q(cap['trang_thai'])}, "
            f"{q(cap['source_id'])}, {q(cap['school_id'])})"
            " on conflict (cap, source_id, school_id) do update set hoa = excluded.hoa,"
            " va = excluded.va, cung_lam = excluded.cung_lam;")

    def khoi(ten_khoi, ma, nd, meta, dong=dong):
        dong.append(
            "insert into thanso_kb_khoi (khoi, ma, noi_dung, trang_thai, source_id, school_id) values "
            f"({q(ten_khoi)}, {q(ma)}, {q(json.dumps(nd, ensure_ascii=False))}::jsonb, "
            f"{q(meta['trang_thai'])}, {q(meta['source_id'])}, {q(meta['school_id'])})"
            " on conflict (khoi, ma, source_id, school_id) do update set noi_dung = excluded.noi_dung;")

    bd = doc("thanso_bieu_do.json")
    for k in ("o_so", "mui_ten_du", "mui_ten_trong"):
        for ma, nd in bd[k].items():
            khoi(k, ma, nd, bd)
    phu = doc("thanso_chi_so_phu.json")
    for k in ("ngay_sinh", "thai_do", "truong_thanh", "thang_ca_nhan", "ngay_ca_nhan",
              "no_nghiep", "bai_hoc_nghiep"):
        for ma, nd in phu[k].items():
            khoi(k, ma, nd, phu)
    gt = doc("thanso_giai_thich.json")
    for ma, nd in gt["muc"].items():
        khoi("giai_thich", ma, nd, gt)
    xl = doc("thanso_xu_ly.json")
    for k in ("mau", "luu_y"):
        for ma, nd in xl[k].items():
            khoi(k, ma, nd, xl)
    dong.append("commit;")
    OUT.write_text("\n".join(dong) + "\n", encoding="utf-8")
    print(f"{len(dong) - 3} dòng upsert -> {OUT}")

    mig = ["-- SINH TỰ ĐỘNG bởi engine/scripts/sinh_seed_thanso_v2.py — đừng sửa tay.",
           "-- KB thần số chiều sâu (TS-SAU, 2026-10-07): chân dung 12 số × 4 mặt + hợp đôi theo loại quan hệ.",
           "-- Chỉ THÊM DỮ LIỆU vào bảng thanso_kb_khoi (migration 0003), không đổi schema. Chạy lại an toàn (upsert).",
           "-- Nguồn: engine/app/kb/data/thanso_chan_dung.json, thanso_quan_he.json. Rollback: 0009_...down.sql",
           "insert into schools (id, ten) values ('pythagoras_vn', 'Pythagoras (bản Việt, biên soạn bởi chủ dự án)')"
           " on conflict (id) do nothing;"]
    cd = doc("thanso_chan_dung.json")
    for ma, nd in cd["mat"].items():
        khoi("chan_dung_mat", ma, nd, cd, mig)
    for ma, nd in cd["so"].items():
        khoi("chan_dung", ma, nd, cd, mig)
    qh = doc("thanso_quan_he.json")
    for ma, nd in qh["quan_he"].items():
        khoi("quan_he", ma, nd, qh, mig)
    for ma, nd in qh["theo_so"].items():
        khoi("quan_he_theo_so", ma, nd, qh, mig)
    MIG_0009.write_text("\n".join(mig) + "\n", encoding="utf-8")
    MIG_0009.with_name(MIG_0009.stem + ".down.sql").write_text(
        "-- Rollback cho 0009_kb_thanso_chan_dung_quan_he.sql — chỉ xoá các khối do 0009 thêm.\n"
        "delete from thanso_kb_khoi where khoi in (" + ", ".join(q(k) for k in KHOI_0009) + ");\n",
        encoding="utf-8")
    print(f"{len(mig) - 5} dòng upsert -> {MIG_0009}")


if __name__ == "__main__":
    main()
