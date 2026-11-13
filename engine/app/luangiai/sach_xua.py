# -*- coding: utf-8 -*-
"""SX-1 (2026-11-13) — "Sách xưa nói gì về lá số của bạn".

RULES, tất định: chỉ CHỌN các câu nguyên văn + tóm ý ĐÃ CÓ trong KB (mỗi câu đã có test khớp kho nguồn cổ thư) ứng với đúng
dữ kiện đã tính của lá số. Không sinh câu mới, không đổi mức, không phán: chỉ lấy câu trung tính / câu của cách cục tốt và
sao tốt — lời nặng của sách xưa vẫn ở chỗ cũ (trang kiến thức, "Vì sao nói vậy"), không đưa lên khối nổi bật này.
Bát tự: cả hai ngôn ngữ (KB đã có bản Anh). Tử vi: chỉ bản tiếng Việt (tóm ý Cốt Tuỷ Phú, phụ tinh chưa dịch).
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import battu_kb, ten as _ten, tuvi_kb
from app.kb.loi import L

TOI_DA = 5
SACH = {"uyen_hai": "Uyên Hải Tử Bình", "ctbg": "Cùng Thông Bảo Giám", "tam_menh": "Tam Mệnh Thông Hội",
        "cot_tuy": "Đẩu Số Cốt Tuỷ Phú", "toan_thu": "Tử Vi Đẩu Số Toàn Thư"}
_MUA = {"xuan": "mùa xuân", "ha": "mùa hạ", "thu": "mùa thu", "dong": "mùa đông"}
_CUNG_PHU = ("Quan Lộc", "Tài Bạch", "Thiên Di", "Phúc Đức", "Điền Trạch", "Nô Bộc")


def _muc(loai: str, ve: str, sach: str, han: str, y: str, **them) -> dict:
    return {"loai": loai, "ve": ve, "sach": SACH[sach], "han": han, "y": y, **them}


def battu(ls: dict, mo_rong: dict) -> list[dict]:
    """`ls` = lá số Bát tự đã tính, `mo_rong` = khối mở rộng (đã có điều hậu + thần sát kèm câu sách). KB Bát tự đã có bản
    tiếng Anh nên khối này chạy cả hai ngôn ngữ (khung dữ kiện phải giống nhau — test_dau_ra_en)."""
    from app.luangiai.battu_hien import _ma  # noqa: PLC0415 — mã mẫu câu của thần sát (một nguồn với lá số bản Anh)
    ra: list[dict] = []
    can = ls["nhat_chu"]["can"]

    def muc(loai: str, ve: str, sach: str, han: str, y: str) -> dict:
        return {"loai": loai, "ve": ve, "sach": L(f"battu.sach_xua.sach.{sach}", SACH[sach]), "han": han, "y": y}

    if (c := battu_kb.co_tho(can)) and c.get("han"):
        ra.append(muc("nhat_chu", L("battu.sach_xua.ve.nhat_chu", "Ngày sinh của bạn thuộc can {can}", can=_ten.ten("can", can)),
                      "uyen_hai", c["han"], c["y"]))
    dh = mo_rong.get("dieu_hau_ctbg") or {}
    if dh.get("trich") and dh.get("mua_y"):
        ra.append(muc("dieu_hau", L("battu.sach_xua.ve.dieu_hau", "Bạn sinh tháng {chi}, {mua}", chi=_ten.ten("chi", ls["tru"][1]["chi"]),
                                    mua=L(f"battu.sach_xua.mua.{dh['mua']}", _MUA[dh["mua"]])), "ctbg", dh["trich"], dh["mua_y"]))
    cc = ls["dung_than"]["cach_cuc"]
    cv = (battu_kb._d().get("co_van_thap_than") or {}).get(cc.get("thap_than") or "")
    if cv:
        ve = (f"Lá số của bạn thuộc {cc['ten']}" if ngon_ngu.la_viet() else
              L("battu.sach_xua.ve.cach_cuc", "{tt}", tt=_ten.ten("thap_than", cc["thap_than"])))
        ra.append(muc("cach_cuc", ve, "uyen_hai", cv["han"][0], cv["y"]))
    for t in mo_rong.get("than_sat") or []:
        s = t.get("sach")
        if len(ra) >= TOI_DA:
            break
        if t["loai"] == "cát" and s and s["khop"]:
            ra.append(muc("than_sat", L("battu.sach_xua.ve.than_sat", "Lá số của bạn có sao {sao}", sao=_ten.ten("than_sat", t["ten"])),
                          "tam_menh", s["han"],
                          L("battu.sach_xua.y.than_sat", "Sách xếp đây là sao tốt; người đời sau đọc là: {y}.",
                            y=L(f"battu.than_sat.y.{_ma(t['ten'])}", t["y"]))))
    return ra[:TOI_DA]


def _cau_phu() -> list[dict]:
    from app.kb import trang_co_thu  # noqa: PLC0415 — tránh vòng import
    return trang_co_thu.kb()["cau"]


def tuvi(cach_cuc: list[dict], cung: list[dict]) -> list[dict]:
    """`cach_cuc` = các cách đã nhận diện (kèm KB), `cung` = 12 cung đầu ra (`ten`, `nghia_sao_nho`)."""
    if not ngon_ngu.la_viet():
        return []
    ra: list[dict] = []
    da: set[str] = set()
    for c in cach_cuc:
        if c.get("nhom") != "cát" or len(ra) >= 3:
            continue
        ve = f"Lá số của bạn có cách {c['ten']}"
        cau = next((x for x in _cau_phu() if c["ma"] in x["cach_cuc"] and x["id"] not in da), None)
        sg = c.get("sach_ghi")
        if cau:
            da.add(cau["id"])
            ra.append(_muc("cach_cuc", ve, "cot_tuy", cau["nguyen_van"], cau["nghia"], ma=c["ma"], phien_am=cau["phien_am"]))
        elif sg and not sg.get("khac_dieu_kien"):
            ra.append(_muc("cach_cuc", ve, "toan_thu", sg["han"], sg["y"], ma=c["ma"]))
    theo_ten = {k["ten"]: k for k in cung}
    for ten in _CUNG_PHU:
        for sao, m in ((theo_ten.get(ten) or {}).get("nghia_sao_nho") or {}).items():
            if len(ra) >= TOI_DA:
                return ra
            if m.get("trich") and m.get("do_tin") == "co_thu":
                ra.append(_muc("phu_tinh", f"Cung {ten} của bạn có sao {sao}", "toan_thu", m["trich"], m["y_nghia"]))
                break                                     # mỗi cung một câu
    return ra[:TOI_DA]
