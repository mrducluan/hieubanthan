# -*- coding: utf-8 -*-
"""NT-1 — cụm trang kiến thức "bộ vị gương mặt" `/nhan-tuong/bo-vi/{slug}`, dựng từ KB (chỉ ĐỌC + GHÉP), loại `bo_vi`.

Một trang cho mỗi bộ vị của khảo sát: bộ vị nói về gì (cung nào, Nội Kinh gắn hệ cơ quan nào), các nét hay gặp và sách xưa
đọc ra sao (đặc điểm KB có bộ vị này — lời đời thường + trích sách), tuổi lưu niên xem ở bộ vị này (một bảng thật), cách tự
quan sát (câu khảo sát), nốt ruồi ở vùng này (nếu có). Không điểm số, không sinh nghĩa mới.
"""
from __future__ import annotations

from app import ngon_ngu

from app.kb import nhan_tuong_kb as kb
from app.kb.loi import L

DUONG_CONG_CU = "/nhan-tuong"
DUONG_CUM = "/nhan-tuong/bo-vi"        # = web lib/chuyen-huong.json chu_de["bo-vi"]
_NOT_RUOI_THEO_BO_VI = {"thien_dinh": "tran", "an_duong": "an_duong", "long_may": "long_may", "le_duong": "duoi_mat", "ngu_vi": "duoi_mat_duoi",
                        "song_mui": "mui", "chuan_dau": "mui", "canh_mui": "canh_mui", "mieng": "moi", "dia_cac": "cam", "luong_quyen": "go_ma", "tai": "tai"}


def _t():
    from app.kb import trang
    return trang


@ngon_ngu.theo_viet
def ds_bo_vi() -> list[tuple[str, str]]:
    return [(ma, _t()._slug(x["ten"].split(" (")[0].split(" – ")[0])) for ma, x in kb.bo_vi().items()]


def _tieu_de(ten: str) -> str:
    ung = [L("nt.trang.td1", "{ten} trong nhân tướng học: ý nghĩa và cách tự xem", ten=ten), L("nt.trang.td2", "{ten} trong nhân tướng học", ten=ten),
           L("nt.trang.td3", "{ten}: tướng học nói gì", ten=ten)]
    return next((x for x in ung if len(x) <= 70), ung[-1][:70])


def _bai_ca_cho(tuoi: list[dict]) -> list[dict]:
    ra, da = [], set()
    for x in tuoi:
        c = kb.bai_ca_luu_nien(x["tuoi"])
        if c and c["han"] not in da:
            da.add(c["han"])
            ra.append({"sach": c["sach"], "nguyen_van": c["han"], "nghia": c["y"]})
    return ra[:4]


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
    mo_dau = L("nt.trang.mo_dau", "{ten} là vùng {vi_tri} trên gương mặt. {nghia}", ten=ten, vi_tri=bv['vi_tri'], nghia=bv['nghia'])
    if cung:
        mo_dau += L("nt.trang.mo_dau_cung", " Trong 12 cung của tướng pháp, vùng này thuộc cung {cung} — nói về {noi_ve}.", cung=cung['ten'], noi_ve=cung['noi_ve'])
    muc.append({"tieu_de": L("nt.trang.noi_ve", "{ten} nói về gì", ten=ten), "doan": mo_dau})
    if dd:
        dong = [L("nt.trang.dong", "{t}: {n} Việc nên làm: {v}", t=x['tieu_de'], n=x['noi_dung'], v=x['viec']) for _, x in dd]
        trich_dan = [{"sach": kb.ten_nguon((x.get("sach") or {}).get("nguon")), "nguyen_van": " — ".join(v for v in ((x.get("sach") or {}).get("han"), (x.get("sach") or {}).get("trich")) if v),
                      "nghia": (x.get("sach") or {}).get("y")} for _, x in dd if (x.get("sach") or {}).get("trich")][:3]
        muc.append({"tieu_de": L("nt.trang.cac_net", "Các nét hay gặp ở {ten} và sách xưa đọc ra sao", ten=ten.split(' (')[0]), "danh_sach": dong,
                    **({"trich_dan": trich_dan} if trich_dan else {})})
    if bv.get("he"):
        from app.kb import suc_khoe_kb  # noqa: PLC0415
        he = (suc_khoe_kb.he_hanh(bv["he"]) or {}).get("he") or bv["he"]
        muc.append({"tieu_de": L("nt.trang.he_td", "Nội Kinh gắn vùng này với hệ cơ quan nào"),
                    "doan": L("nt.trang.he", "Theo Hoàng Đế Nội Kinh (Linh Khu, Ngũ Sắc thiên), {ten} ứng với {he}. Sắc da vùng này đổi "
                              "thường là nhịp sinh hoạt đổi (ngủ, ăn, căng thẳng) — tướng pháp chỉ nhắc chăm sóc và đi khám định kỳ, không đoán bệnh, "
                              "không thay lời bác sĩ.", ten=ten.split(' (')[0], he=he)})
    if tuoi:
        ben = {"trai": L("nt.trang.ben.trai", "trái"), "phai": L("nt.trang.ben.phai", "phải"), "giua": L("nt.trang.ben.giua", "giữa")}
        bang = [{"tuoi": x["tuoi"], "vi": x["ten"], "ben": ben[x["ben"]]} for x in tuoi]
        muc.append({"tieu_de": L("nt.trang.tuoi_td", "Tuổi nào sách lưu niên xem ở vùng này"),
                    "doan": L("nt.trang.tuoi", "Lưu niên vận khí bộ vị chia mặt thành 100 vị trí theo tuổi mụ; {ten} ứng với tuổi "
                              "{ds}. Nam xem bên trái trước, nữ xem bên phải trước. Vùng đầy, sáng thì tuổi ấy nhẹ; "
                              "vùng có nếp, tối thì tuổi ấy nên chủ động hơn — là cách nhìn của sách, không phải dự báo.",
                              ten=ten.split(' (')[0], ds=', '.join(str(x['tuoi']) for x in tuoi)),
                    "bang": {"cot": [L("nt.trang.cot.tuoi", "Tuổi mụ"), L("nt.trang.cot.vi", "Tên vị"), L("nt.trang.cot.ben", "Bên")],
                             "dong": [[str(b["tuoi"]), b["vi"], b["ben"]] for b in bang]},
                    # WS-4: câu bài ca lưu niên của sách ứng với các tuổi này (nguyên văn khớp kho nguồn)
                    **({"trich_dan": ca} if (ca := _bai_ca_cho(tuoi)) else {})})
    if cau:
        muc.append({"tieu_de": L("nt.trang.quan_sat_td", "Cách tự quan sát trong gương"),
                    "danh_sach": [L("nt.trang.quan_sat", "{hoi} {hd} Lựa chọn: {lc}.", hoi=c['hoi'], hd=c['huong_dan'],
                                    lc='; '.join(l['nhan'] for l in c['lua_chon'] if l['ma'] != 'khong_chac')) for c in cau]})
    nr = kb.not_ruoi().get(_NOT_RUOI_THEO_BO_VI.get(ma, ""))
    if nr:
        muc.append({"tieu_de": L("nt.trang.not_ruoi", "Nốt ruồi ở {ten}", ten=ten.split(' (')[0].lower() if ngon_ngu.la_viet() else ten.split(' (')[0]),
                    "doan": f"{nr['loi']} {kb.not_ruoi()['chung']['loi']}"})
    hoi_dap = [{"hoi": L("nt.trang.o_dau", "{ten} nằm ở đâu?", ten=ten.split(' (')[0]), "dap": f"{bv['vi_tri'][0].upper()}{bv['vi_tri'][1:]}."},
               {"hoi": L("nt.trang.chinh_xac_hoi", "Tự xem có chính xác không?"),
                "dap": L("nt.trang.chinh_xac_dap", "Tướng của người tự quan sát bao giờ cũng thật hơn tướng người khác xem; trang này chỉ nói xu hướng và thói quen, không nói trước điều gì sẽ xảy ra.")}]
    if cung:
        hoi_dap.append({"hoi": L("nt.hoi.tiep.cung", "Cung {ten} nói về gì?", ten=cung['ten']),
                        "dap": L("nt.trang.cung_dap", "Về {noi_ve}; gồm các vùng: {ds}.", noi_ve=cung['noi_ve'],
                                 ds=', '.join(kb.bo_vi()[b]['ten'] for b in cung['bo_vi'] if b in kb.bo_vi()))})
    mo_ta = t._cat(L("nt.trang.mo_ta", "{ten}: {nghia} Các nét hay gặp, sách xưa đọc ra sao, tuổi lưu niên và cách tự quan sát trong gương.",
                     ten=ten, nghia=bv['nghia']))
    lien_quan = [{"loai": "bo_vi", "slug": s} for b, s in ds_bo_vi() if b != ma and (kb.bo_vi()[b].get("cung") == bv.get("cung"))][:3]
    return {"loai": "bo_vi", "slug": slug, "tieu_de": _tieu_de(ten), "mo_ta": mo_ta,
            "tra_loi_nhanh": mo_dau, "muc": muc, "hoi_dap": hoi_dap, "lien_quan": lien_quan,
            "minh_hoa": {"kieu": "bo_vi", "vung": bv.get("vung") or "toan_mat", "ten": ten.split(" (")[0], "cung": cung["ten"] if cung else None},
            "trang_thai": kb.meta()["trang_thai"],
            "nguon": [kb.ten_nguon(k) for k in ("ma_y", "than_tuong_toan_bien", "noi_kinh")]}


TRANG = {"bo_vi": (ds_bo_vi, trang_bo_vi)}
TEN_NGAN = {"bo_vi": lambda ten: ten.split(" (")[0]}


def y_chinh_en(t: dict, so: int) -> list[str] | None:
    """EN-ALL GĐ 8 — ý chính tiếng Anh của trang bộ vị: cùng khe với `y_chinh_tu_dong._bo_vi` (2 câu đầu của trả lời nhanh,
    tuổi lưu niên, câu thứ ba); SỐ ý do bản Việt quyết (`so`). Không đủ → None."""
    import re  # noqa: PLC0415

    from app.kb import y_chinh_tu_dong as yct  # noqa: PLC0415
    if not so:
        return None
    cau = [c for c in re.split(r"(?<=[.!?])\s", t["tra_loi_nhanh"]) if c]
    ra = [yct._cat(c) for c in cau[:2]]
    ban = next((m for m in t["muc"] if m.get("bang")), None)
    if ban and (m := re.search(r"corresponds to ages ([\d, ]+)", ban.get("doan") or "")):
        ra.append(f"Yearly ages: {m.group(1).strip(' .,')} (traditional age)")
    if len(cau) > 2:
        ra.append(yct._cat(cau[2]))
    ra = [y for y in dict.fromkeys(ra) if y and len(y) <= yct.TOI_DA]
    return ra[:so] if len(ra) >= so else None
