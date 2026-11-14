# -*- coding: utf-8 -*-
"""TV-CTP — cụm cổ thư Tử vi (/tu-vi/co-thu): trang trụ "Đẩu Số Cốt Tuỷ Phú" (斗數骨髓賦).

Tầng KB: chỉ ĐỌC + GHÉP `data/tuvi_co_thu.json` (nguyên văn cổ thư công cộng + phiên âm + nghĩa đời thường do ban
biên tập soạn) với `tuvi_cach_cuc.json` (điều kiện cách cục). Không sinh nghĩa mới, không gọi LLM.

Một trang cho cả bài phú (84 câu, neo `#cau-n` từng câu, mỗi phần một mục H2) — không tách trang từng phần để tránh
trang mỏng. Các trang "sao", "sao ở cung", "Hoá ở cung" lấy tối đa hai câu liên quan (nguyên văn ≤ 2 câu — SEO-M)
qua `muc_trich()` và trỏ về trang trụ. Nguồn gốc nội bộ (bản chép, đối chiếu) chỉ ở KB — không trả ra web (BM-1).
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb.loi import L

import re

SLUG = "cot-tuy-phu"
SACH = "Đẩu Số Cốt Tuỷ Phú"
CHUONG_SACH = "Tử Vi Đẩu Số Toàn Thư, quyển một"
TOI_DA_TRICH = 2              # SEO-M: trang khác chỉ trích ≤ 2 câu, mỗi câu ≤ 2 câu nguyên văn
_TOI_DA_LINK_PHAN = 8


def _t():                     # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def kb() -> dict:
    return _t()._doc("tuvi_co_thu.json")


def _chinh_tinh() -> list[str]:
    return list(_t()._doc("tuvi_kb.json")["chinh_tinh"])


def neo(c: dict) -> str:
    return f"cau-{c['thu_tu']}"


def so_cau_nguyen_van(s: str) -> int:
    return len([x for x in re.split(r"[。！？]", s) if x.strip()])


def sach() -> str:
    """Tên bài phú hiển thị (bản Anh: pinyin + nghĩa)."""
    return L("trang_ct.sach", SACH)


def trich(c: dict, voi_neo: bool = True) -> dict:
    """Một câu phú dạng trích dẫn (khớp `TrichDan` của web). Bản Anh: `phien_am` là pinyin (bản phủ KB), `nghia` là bản
    dịch của ban biên tập; nguyên văn chữ Hán giữ nguyên."""
    ra = {"sach": sach(), "chuong": L("trang_ct.cau", "câu {n}", n=c["thu_tu"]), "nguyen_van": c["nguyen_van"],
          "phien_am": c["phien_am"], "nghia": c["nghia"]}
    if c.get("khi"):
        ra["khi"] = c["khi"]
    if c.get("chu_thich"):
        ra["chu_thich"] = c["chu_thich"]
    if voi_neo:
        ra["neo"] = neo(c)
    return ra


def cau_lien_quan(sao: str | None = None, cung: str | None = None, hoa: str | None = None,
                  toi_da: int = TOI_DA_TRICH) -> list[dict]:
    """Các câu phú nhắc đúng sao / cung / hoá (lọc AND), chỉ câu nguyên văn ≤ 2 câu; theo thứ tự trong bài."""
    ra = []
    for c in kb()["cau"]:
        if sao and sao not in c["sao"]:
            continue
        if cung and cung not in c["cung"]:
            continue
        if hoa and hoa not in c["hoa"]:
            continue
        if so_cau_nguyen_van(c["nguyen_van"]) > 2:
            continue
        ra.append(c)
    return ra[:toi_da]


def muc_trich(sao: str | None = None, cung: str | None = None, hoa: str | None = None) -> dict | None:
    """Mục "Đẩu Số Cốt Tuỷ Phú nói gì" cho trang khác (None nếu bài phú không có câu khớp)."""
    ds = cau_lien_quan(sao, cung, hoa)
    if not ds:
        return None
    from app.kb import trang_tuvi as ttv
    doi = " ".join(x for x in (L("trang_ct.hoa", "Hoá {h}", h=ttv.th(hoa)) if hoa else (ttv.ts(sao) if sao else sao),
                              L("trang_ct.o_cung", "ở cung {cung}", cung=ttv.tc(cung)) if cung else "") if x)
    return {"ma": "co_thu", "tieu_de": L("trang_ct.noi_gi", "{sach} nói gì", sach=sach()),
            "doan": L("trang_ct.trich_doan",
                      "Câu dưới đây trích {sach}, bài phú ở {quyen} của {toan_thu}, "
                      "có nhắc {doi}. Lời phú là quan niệm sách xưa; nghĩa đời thường do ban biên tập viết lại.",
                      sach=sach(), quyen=CHUONG_SACH.split(", ")[1], toan_thu=CHUONG_SACH.split(", ")[0], doi=doi),
            "trich_dan": [trich(c, voi_neo=False) for c in ds],
            "xem_them": [{"loai": "co_thu", "slug": SLUG}]}


@ngon_ngu.theo_viet
def ds_co_thu() -> list[tuple[str, str]]:
    return [("cot_tuy_phu", SLUG)]


def _link_phan(cau: list[dict]) -> list[dict]:
    """Link trang "sao ở cung" / "Hoá ở cung" / trang sao cho các sao trong một phần (trùng thì bỏ, tối đa 8)."""
    t, chinh = _t(), _chinh_tinh()
    ra: list[dict] = []
    for c in cau:
        for s in c["sao"]:
            if s not in chinh:
                continue
            ra += ([{"loai": "sao_cung", "slug": f"{t._slug(s)}-cung-{t._slug(g)}"} for g in c["cung"]]
                   or [{"loai": "sao", "slug": f"sao-{t._slug(s)}"}])
        for h in c["hoa"]:
            ra += [{"loai": "hoa_cung", "slug": f"hoa-{t._slug(h)}-cung-{t._slug(g)}"} for g in c["cung"]]
    gon = list({(x["loai"], x["slug"]): x for x in ra}.values())
    return gon[:_TOI_DA_LINK_PHAN]


def trang_co_thu(k: str, slug: str) -> dict:
    d, cc = kb(), _t()._doc("tuvi_cach_cuc.json")["cach"]
    tr, cau = d["trang"], d["cau"]
    phan = []
    for i, ch in enumerate(d["chuong"], 1):
        ds = [c for c in cau if c["chuong"] == ch["ma"]]
        phan.append((i, ch, ds))
    bang_phan = {"cot": [L("trang_ct.cot_phan", "Phần"), L("trang_ct.cot_cau", "Câu"), L("trang_ct.cot_so_cau", "Số câu")],
                 "dong": [[f"{i}. {ch['ten']}", f"{ds[0]['thu_tu']}–{ds[-1]['thu_tu']}", str(len(ds))]
                          for i, ch, ds in phan]}
    muc = [{"tieu_de": L("trang_ct.la_gi", "Bài phú này là gì, đọc thế nào"),
            "doan": tr["gioi_thieu"].format(so_phan=len(phan)), "bang": bang_phan}]
    for i, ch, ds in phan:
        muc.append({"tieu_de": L("trang_ct.phan", "Phần {i}. {ten}", i=i, ten=ch["ten"]),
                    "doan": L("trang_ct.phan_doan", "{gt} (câu {a}–{b})", gt=ch["gioi_thieu"], a=ds[0]["thu_tu"], b=ds[-1]["thu_tu"]),
                    "trich_dan": [trich(c) for c in ds],
                    **({"xem_them": x} if (x := _link_phan(ds)) else {})})
    # Bảng cách cục bài phú nhắc tới: tên + câu + điều kiện (KB cách cục — cùng điều kiện engine dùng trên lá số).
    theo_cach: dict[str, list[int]] = {}
    for c in cau:
        for m in c["cach_cuc"]:
            theo_cach.setdefault(m, []).append(c["thu_tu"])
    muc.append({"tieu_de": L("trang_ct.cach_cuc", "Các cách cục bài phú nhắc tới"),
                "doan": L("trang_ct.cach_cuc_doan",
                          "{n} cách cục dưới đây có trong bài phú và có điều kiện rõ trên lá số. Khi lập lá "
                          "số, Hiểu Bản Thân dò đúng các điều kiện này; câu phú chỉ là lời bình của sách xưa.", n=len(theo_cach)),
                "bang": {"cot": [L("trang_ct.cot_cach", "Cách cục"), L("trang_ct.cot_cau", "Câu"),
                                 L("trang_ct.cot_dieu_kien", "Điều kiện trên lá số")],
                         "dong": [[f"{cc[m]['ten']} ({cc[m]['ten_han']})", ", ".join(map(str, so)), cc[m]["dieu_kien"]]
                                  for m, so in theo_cach.items()]}})
    muc.append({"tieu_de": L("trang_ct.phan_nang", "Đọc những câu phán nặng thế nào"), "doan": tr["cach_doc"]})
    t = _t()
    return {
        "loai": "co_thu", "slug": slug,
        "tieu_de": tr["tieu_de"],
        "mo_ta": t._cat(tr["mo_ta"]),
        "tra_loi_nhanh": tr["tra_loi_nhanh"].format(so_cau=len(cau)),
        "muc": muc, "hoi_dap": list(tr["hoi_dap"]),
        "nguon": [d["source"]["cot_tuy_phu"], L("trang_ct.nguon_bbt", "Phiên âm Hán Việt và nghĩa đời thường: Ban biên tập Hiểu Bản Thân.")],
        "trang_thai": d.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "sao", "slug": "sao-tu-vi"}, {"loai": "cung", "slug": "cung-menh"},
                      {"loai": "sao", "slug": "sao-that-sat"}, {"loai": "hoa_cung", "slug": "hoa-loc-cung-menh"}],
        # Hình vòng 12 cung sáng cung Mệnh — bài phú xoay quanh cung Mệnh và tam phương tứ chính.
        "minh_hoa": {"kieu": "cung", "chi_so": 0, "vong": _vong_hien()},
    }


TRANG = {"co_thu": (ds_co_thu, trang_co_thu)}
TEN_NGAN = {"co_thu": lambda k: sach()}


def _vong_hien() -> list[str]:
    from app.kb import trang_tuvi as ttv
    return ttv.vong_hien()
