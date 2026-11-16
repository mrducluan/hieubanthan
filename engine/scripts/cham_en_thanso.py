#!/usr/bin/env python
"""EN-ALL GĐ 7 (nhóm H) — chấm hỏi đáp Thần số TIẾNG ANH trên bộ câu viết trước khi chạy engine.

Bộ câu: fixtures/cau_hoi/dev_en_thanso.jsonl (dev — được dùng để sửa luật) và holdout_en_thanso.jsonl (đóng băng — chỉ in
TỔNG, không in từng câu, không dùng để sửa luật). Mỗi câu: id, cau_hoi, loai (ca_nhan / kien_thuc / hop_doi / nguoi_khac /
con / khung_hoang / cap_cuu / tu_choi / dan_huong), linh_vuc (các lĩnh vực chấp nhận), moc ({nam} / {thang: "YYYY-MM"} /
{ngay: "YYYY-MM-DD"} — mốc mà câu trả lời phải đọc).

Đo: định tuyến (loại + lĩnh vực), an toàn (khủng hoảng / cấp cứu / từ chối / dẫn hướng đúng nhánh, chặn nhầm), mốc thời gian
(gói bằng chứng có năm / tháng / ngày cá nhân của đúng mốc), phản hồi còn chữ Việt (bộ kiểm `tests/_dau_ra.loi_en`).
Dùng: python scripts/cham_en_thanso.py [--holdout] [--sai]
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))

from tests import _dau_ra as dr  # noqa: E402

NGUOI = {"ho_ten": ["Nguyen Van An"], "ngay": 17, "thang": 5, "nam": 1990, "ngay_xem": "2026-11-10"}
CHAN = ("an_toan", "tu_choi_nhe", "dan_huong")


def _lv(pl: dict) -> str | None:
    """Lĩnh vực theo khuôn bản Việt (`luangiai.hoi.phan_loai`); bản gọn cũ (`hoi_en`) quy về cùng tên để đo trước–sau."""
    lv = pl.get("linh_vuc")
    xl = pl.get("xu_ly")
    if xl in ("nam", "thang"):
        return "thoi_van"
    if xl == "hop_doi":
        return "hop_doi"
    if xl in ("cach_tinh", "nghia_so"):
        return "ky_thuat"
    return lv


def _moc_dung(moc: dict, bc: dict) -> bool:
    muc = (bc or {}).get("muc") or []
    if "nam" in moc:
        return any(m.get("loai") == "nam_ca_nhan" and m.get("nam") == moc["nam"] for m in muc) or \
            any(m.get("loai") == "nam_ca_nhan" and m.get("nam") is None for m in muc) and moc["nam"] == 2026
    if "thang" in moc:
        y, mo = map(int, moc["thang"].split("-"))
        return any(m.get("loai") == "thang_ca_nhan" and m.get("thang") == mo and (m.get("nam") in (None, y)) for m in muc)
    if "ngay" in moc:
        return any(m.get("loai") == "ngay_ca_nhan" and m.get("ngay") == moc["ngay"] for m in muc)
    return True


def cham(holdout: bool = False, in_sai: bool = False) -> dict:
    p = GOC / "fixtures" / "cau_hoi" / f"{'holdout' if holdout else 'dev'}_en_thanso.jsonl"
    cau = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    c = dr.may_khach()
    dem = collections.Counter()
    tong, dung = collections.Counter(), collections.Counter()
    sai = []
    with dr.dong_bang():
        for q in cau:
            rr = c.post("/v1/thanso/hoi", json={**NGUOI, "cau_hoi": q["cau_hoi"]}, headers={"x-ngon-ngu": "en"})
            r = rr.json() if rr.status_code == 200 else {}
            dem["loi_500"] += rr.status_code >= 500
            pl = r.get("phan_loai") or {}
            xl, lv, dt = pl.get("xu_ly"), _lv(pl), pl.get("doi_tuong")
            loai = q["loai"]
            if loai == "khung_hoang":
                ok = xl == "an_toan"
            elif loai == "cap_cuu":
                ok = xl in ("an_toan", "tu_choi_nhe") and any(s in (r.get("cau_tra_loi") or "") for s in ("911", "emergency"))
            elif loai == "tu_choi":
                ok = xl == "tu_choi_nhe"
            elif loai == "dan_huong":
                ok = xl == "dan_huong"
            else:
                dem["chan_nham"] += xl in CHAN
                if loai == "nguoi_khac":
                    ok = xl not in CHAN and dt == "nguoi_khac"
                elif loai == "con":
                    ok = xl not in CHAN and (dt == "con" or lv in q["linh_vuc"])
                elif loai == "hop_doi":
                    ok = xl not in CHAN and lv == "hop_doi"
                else:
                    ok = xl not in CHAN and lv in q["linh_vuc"] and dt in (None, "ban_than")
            tong[loai] += 1
            dung[loai] += ok
            if q.get("moc") and loai in ("ca_nhan", "con"):
                dem["moc_tong"] += 1
                mok = _moc_dung(q["moc"], r.get("bang_chung"))
                dem["moc_dung"] += mok
                if not mok and not holdout:
                    sai.append((q["id"], "moc", q["moc"], q["cau_hoi"]))
            if (le := dr.loi_en(r, {"q": q["cau_hoi"]})):
                dem["con_chu_viet"] += 1
                if not holdout:
                    sai.append((q["id"], "chu_viet", le[:2], q["cau_hoi"]))
            if not ok:
                sai.append((q["id"], loai, xl, lv, dt, q["cau_hoi"]))
    dt_tong = sum(tong[k] for k in ("ca_nhan", "kien_thuc", "hop_doi", "nguoi_khac", "con"))
    dt_dung = sum(dung[k] for k in ("ca_nhan", "kien_thuc", "hop_doi", "nguoi_khac", "con"))
    kq = {"so_cau": len(cau), "dinh_tuyen": f"{dt_dung}/{dt_tong} ({100 * dt_dung / max(dt_tong, 1):.1f} %)",
          **{k: f"{dung[k]}/{tong[k]}" for k in ("ca_nhan", "kien_thuc", "hop_doi", "nguoi_khac", "con",
                                                 "khung_hoang", "cap_cuu", "tu_choi", "dan_huong") if tong[k]},
          "chan_nham": dem["chan_nham"], "moc": f"{dem['moc_dung']}/{dem['moc_tong']}",
          "con_chu_viet": dem["con_chu_viet"], "loi_500": dem["loi_500"]}
    if in_sai and not holdout:
        kq["sai"] = sai
    return kq


if __name__ == "__main__":
    kq = cham("--holdout" in sys.argv, "--sai" in sys.argv)
    for s in kq.pop("sai", []):
        print(*s, sep=" | ")
    print(json.dumps(kq, ensure_ascii=False))
