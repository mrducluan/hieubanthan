# -*- coding: utf-8 -*-
"""NT-1 — cụm trang kiến thức "bộ vị gương mặt" `/nhan-tuong/bo-vi/{slug}`, dựng từ KB (chỉ ĐỌC + GHÉP), loại `bo_vi`.

Một trang cho mỗi bộ vị của khảo sát: bộ vị nói về gì (cung nào, Nội Kinh gắn hệ cơ quan nào), các nét hay gặp và sách xưa
đọc ra sao (đặc điểm KB có bộ vị này — lời đời thường + trích sách), tuổi lưu niên xem ở bộ vị này (một bảng thật), cách tự
quan sát (câu khảo sát), nốt ruồi ở vùng này (nếu có). Không điểm số, không sinh nghĩa mới.
"""
from __future__ import annotations

from app.kb import nhan_tuong_kb as kb

DUONG_CONG_CU = "/nhan-tuong"
DUONG_CUM = "/nhan-tuong/bo-vi"        # = web lib/chuyen-huong.json chu_de["bo-vi"]
_NOT_RUOI_THEO_BO_VI = {"thien_dinh": "tran", "an_duong": "an_duong", "long_may": "long_may", "le_duong": "duoi_mat", "ngu_vi": "duoi_mat_duoi",
                        "song_mui": "mui", "chuan_dau": "mui", "canh_mui": "canh_mui", "mieng": "moi", "dia_cac": "cam", "luong_quyen": "go_ma", "tai": "tai"}


def _t():
    from app.kb import trang
    return trang


def ds_bo_vi() -> list[tuple[str, str]]:
    return [(ma, _t()._slug(x["ten"].split(" (")[0].split(" – ")[0])) for ma, x in kb.bo_vi().items()]


def _tieu_de(ten: str) -> str:
    ung = [f"{ten} trong nhân tướng học: ý nghĩa và cách tự xem", f"{ten} trong nhân tướng học", f"{ten}: tướng học nói gì"]
    return next((x for x in ung if len(x) <= 70), ung[-1][:70])


def trang_bo_vi(ma: str, slug: str) -> dict:
    t = _t()
    bv = kb.bo_vi()[ma]
    ten = bv["ten"]
    cung = kb.cung().get(bv.get("cung") or "")
    dd = [(m, x) for m, x in kb.dac_diem().items() if x["bo_vi"] == ma and len(x.get("dieu_kien") or {}) == 1]
    cau = [c for c in kb.cau_hoi() if c["bo_vi"] == ma]
    tuoi = [x for x in kb.luu_nien() if x["bo_vi"] == ma]
    muc = []
    # AUD-P0: câu đầu tự đứng — nêu bộ vị + vị trí + nghĩa.
    mo_dau = f"{ten} là vùng {bv['vi_tri']} trên gương mặt. {bv['nghia']}"
    if cung:
        mo_dau += f" Trong 12 cung của tướng pháp, vùng này thuộc cung {cung['ten']} — nói về {cung['noi_ve']}."
    muc.append({"tieu_de": f"{ten} nói về gì", "doan": mo_dau})
    if dd:
        dong = [f"{x['tieu_de']}: {x['noi_dung']} Việc nên làm: {x['viec']}" for _, x in dd]
        trich_dan = [{"sach": kb.ten_nguon((x.get("sach") or {}).get("nguon")), "nguyen_van": (x.get("sach") or {}).get("trich"),
                      "nghia": (x.get("sach") or {}).get("y")} for _, x in dd if (x.get("sach") or {}).get("trich")][:3]
        muc.append({"tieu_de": f"Các nét hay gặp ở {ten.split(' (')[0]} và sách xưa đọc ra sao", "danh_sach": dong,
                    **({"trich_dan": trich_dan} if trich_dan else {})})
    if bv.get("he"):
        from app.kb import suc_khoe_kb  # noqa: PLC0415
        he = (suc_khoe_kb.he_hanh(bv["he"]) or {}).get("he") or bv["he"]
        muc.append({"tieu_de": "Nội Kinh gắn vùng này với hệ cơ quan nào",
                    "doan": f"Theo Hoàng Đế Nội Kinh (Linh Khu, Ngũ Sắc thiên), {ten.split(' (')[0]} ứng với {he}. Sắc da vùng này đổi "
                                "thường là nhịp sinh hoạt đổi (ngủ, ăn, căng thẳng) — tướng pháp chỉ nhắc chăm sóc và đi khám định kỳ, không đoán bệnh, "
                                "không thay lời bác sĩ."})
    if tuoi:
        bang = [{"tuoi": x["tuoi"], "vi": x["ten"], "ben": {"trai": "trái", "phai": "phải", "giua": "giữa"}[x["ben"]]} for x in tuoi]
        muc.append({"tieu_de": "Tuổi nào sách lưu niên xem ở vùng này",
                    "doan": f"Lưu niên vận khí bộ vị chia mặt thành 100 vị trí theo tuổi mụ; {ten.split(' (')[0]} ứng với tuổi "
                                f"{', '.join(str(x['tuoi']) for x in tuoi)}. Nam xem bên trái trước, nữ xem bên phải trước. Vùng đầy, sáng thì tuổi ấy nhẹ; "
                                "vùng có nếp, tối thì tuổi ấy nên chủ động hơn — là cách nhìn của sách, không phải dự báo.",
                    "bang": {"cot": ["Tuổi mụ", "Tên vị", "Bên"], "dong": [[str(b["tuoi"]), b["vi"], b["ben"]] for b in bang]}})
    if cau:
        muc.append({"tieu_de": "Cách tự quan sát trong gương",
                    "danh_sach": [f"{c['hoi']} {c['huong_dan']} Lựa chọn: {'; '.join(l['nhan'] for l in c['lua_chon'] if l['ma'] != 'khong_chac')}." for c in cau]})
    nr = kb.not_ruoi().get(_NOT_RUOI_THEO_BO_VI.get(ma, ""))
    if nr:
        muc.append({"tieu_de": f"Nốt ruồi ở {ten.split(' (')[0].lower()}", "doan": f"{nr['loi']} {kb.not_ruoi()['chung']['loi']}"})
    hoi_dap = [{"hoi": f"{ten.split(' (')[0]} nằm ở đâu?", "dap": f"{bv['vi_tri'][0].upper()}{bv['vi_tri'][1:]}."},
               {"hoi": "Tự xem có chính xác không?", "dap": "Tướng của người tự quan sát bao giờ cũng thật hơn tướng người khác xem; trang này chỉ nói xu hướng và thói quen, không nói trước điều gì sẽ xảy ra."}]
    if cung:
        hoi_dap.append({"hoi": f"Cung {cung['ten']} nói về gì?", "dap": f"Về {cung['noi_ve']}; gồm các vùng: {', '.join(kb.bo_vi()[b]['ten'] for b in cung['bo_vi'] if b in kb.bo_vi())}."})
    mo_ta = t._cat(f"{ten}: {bv['nghia']} Các nét hay gặp, sách xưa đọc ra sao, tuổi lưu niên và cách tự quan sát trong gương.")
    lien_quan = [{"loai": "bo_vi", "slug": s} for b, s in ds_bo_vi() if b != ma and (kb.bo_vi()[b].get("cung") == bv.get("cung"))][:3]
    return {"loai": "bo_vi", "slug": slug, "tieu_de": _tieu_de(ten), "mo_ta": mo_ta,
            "tra_loi_nhanh": mo_dau, "muc": muc, "hoi_dap": hoi_dap, "lien_quan": lien_quan,
            "minh_hoa": {"kieu": "bo_vi", "vung": bv.get("vung") or "toan_mat", "ten": ten.split(" (")[0], "cung": cung["ten"] if cung else None},
            "trang_thai": kb.meta()["trang_thai"],
            "nguon": [kb.ten_nguon(k) for k in ("ma_y", "than_tuong_toan_bien", "noi_kinh")]}


TRANG = {"bo_vi": (ds_bo_vi, trang_bo_vi)}
TEN_NGAN = {"bo_vi": lambda ten: ten.split(" (")[0]}
