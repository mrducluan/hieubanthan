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


# --------------------------------------------------------------------------------------- WS-3: Phong thuỷ (Bát trạch)
_DN_TOT = ("Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị")
_DN_XAU = ("Ngũ Quỷ", "Lục Sát", "Hoạ Hại", "Tuyệt Mệnh")


def phongthuy(quai: str | None, thanh_vien: list[dict] | None = None, ca_nhan: bool = True) -> list[dict]:
    """WS-3 (2026-11-14) — "Sách xưa nói gì về nhà của bạn": câu nguyên văn Dương Trạch Thập Thư ứng với mệnh quái người
    đọc (nhóm Đông / Tây tứ mệnh · dòng khẩu quyết Đại du niên của chính cung) và người cùng nhà khác nhóm. `thanh_vien` =
    đầu ra `_thanh_vien` của báo cáo (`vai`, `nhom`). Lời của dòng khẩu quyết dựng từ bảng du niên của engine — cùng một
    nguồn với la bàn, nên câu sách và hướng trên trang không thể nói khác nhau. `ca_nhan=False` (trang kiến thức cung phi):
    lời nói về "người cung …" thay cho "bạn". Bản Anh cùng số câu, lời qua mẫu `pt.sach_xua.*` (test_dau_ra_en)."""
    from app.calc import phongthuy as pt  # noqa: PLC0415
    from app.kb import phongthuy_kb  # noqa: PLC0415
    kb = phongthuy_kb._d().get("sach_xua_nha") or {}
    if not quai or quai not in pt.QUAI or not kb:
        return []
    nhom = pt.nhom(quai)
    sach, ma_nhom = L("pt.sach_xua.sach", kb["sach"]), ("dong" if nhom.startswith("Đông") else "tay")
    tq, tn = _ten.ten("quai", quai), _ten.ten("nhom_trach", nhom)

    def muc(loai: str, ve: str, han: str, y: str) -> dict:
        return {"loai": loai, "ve": ve, "sach": sach, "han": han, "y": y}

    ra = [muc("nhom", L("pt.sach_xua.ve.nhom", "Bạn thuộc {nhom} (cung {quai})", nhom=tn, quai=tq) if ca_nhan else
              L("pt.sach_xua.ve.nhom_cung", "Người cung {quai} thuộc {nhom}", nhom=tn, quai=tq),
              kb["nhom"][nhom]["han"], L(f"pt.sach_xua.y.nhom.{ma_nhom}", kb["nhom"][nhom]["y"]))]
    theo = {d: h for h, d in pt.bang_huong(quai).items()}
    tot = L("pt.sach_xua.noi", ", ").join(L("pt.sach_xua.huong_dn", "{huong} ({dn})", huong=_ten.ten("huong", theo[d]),
                                              dn=_ten.ten("du_nien", d)) for d in _DN_TOT)
    xau = ", ".join(_ten.ten("huong", theo[d]) for d in _DN_XAU)
    goc = (L("pt.sach_xua.goc.ban", "cung {quai} của bạn", quai=tq) if ca_nhan else
           L("pt.sach_xua.goc.cung", "chính cung {quai}", quai=tq))
    ra.append(muc("du_nien", L("pt.sach_xua.ve.du_nien", "Khẩu quyết Đại du niên của cung {quai}", quai=tq),
                  kb["quai"][quai]["han"],
                  L("pt.sach_xua.y.du_nien", "Sách lấy {goc} làm gốc: cửa, phòng, giếng, bếp đều tính từ cung này. Đọc câu khẩu "
                    "quyết theo vòng tám phía ra bốn phía tốt: {tot}; bốn phía sách xếp là sao xấu, không nên mở cửa chính hay "
                    "lối đi chính về đó: {xau}.", goc=goc, tot=tot, xau=xau)))
    khac = [t for t in thanh_vien or [] if t.get("nhom") and t["nhom"] != nhom]
    vc = next((t for t in khac if t.get("vai") in ("vo", "chong")), None)
    if vc:
        # câu sách viết theo người chồng: chồng Đông thì «夫東四位…妻則西四位», ngược lại thì câu kia
        nhom_chong = nhom if vc["vai"] == "vo" else vc["nhom"]
        ra.append(muc("vo_chong", L(f"pt.sach_xua.ve.vo_chong.{vc['vai']}", "Bạn và {vai} khác nhóm",
                                    vai="vợ" if vc["vai"] == "vo" else "chồng"),
                      kb["vo_chong"][nhom_chong]["han"], L("pt.sach_xua.y.vo_chong", kb["vo_chong"]["y"])))
    elif khac:
        ra.append(muc("nha_nhieu_nguoi", L("pt.sach_xua.ve.nha_nhieu_nguoi", "Người cùng nhà khác nhóm với bạn"),
                      kb["nha_nhieu_nguoi"]["han"], L("pt.sach_xua.y.nha_nhieu_nguoi", kb["nha_nhieu_nguoi"]["y"])))
    return ra[:TOI_DA]
