# -*- coding: utf-8 -*-
"""SEO-G — cụm trang thần số học theo câu người Việt hay tìm, dựng từ KB (chỉ ĐỌC + GHÉP, không sinh nghĩa mới).

Năm loại trang (danh sách + hàm dựng), đăng ký vào `trang._TRANG` để dùng chung sitemap, bản .md, trang chủ đề:
  cap_so      "Số chủ đạo A và B có hợp nhau không?"   45 cặp 1–9 (thanso_cap_so) — KHÔNG chấm điểm hợp/khắc
  nghe        "Số chủ đạo N hợp nghề gì?"               12 số (chân dung công việc + lĩnh vực sự nghiệp/tiền bạc)
  tinh_yeu    "Số chủ đạo N trong tình yêu"             12 số (chân dung tình cảm + lĩnh vực tình yêu)
  nam_ca_nhan "Năm cá nhân số N nên làm gì?"            9 số (depth.nam_ca_nhan)
  no_nghiep   "Nợ nghiệp 13/14/16/19 là gì?"           4 số (chỉ số phụ)

EN-ALL GĐ 7: chữ khuôn qua `L()` (data/en/loi/trang_thanso.json); chữ KB qua bản phủ `data/en/thanso_*.json` — bản Việt
giữ nguyên từng byte.
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb.loi import L

import re

_SO = ("1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33")
_SO_GOC = {"11": "2", "22": "4", "33": "6"}


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _mh_so(so: str) -> dict:
    return {"kieu": "so", "so": int(so), "so_cai": so in _SO_GOC, "so_goc": int(_SO_GOC.get(so, so))}


def _nguon_tho(*ten: str) -> list[str]:
    t = _t()
    ra = []
    for f in ten:
        d = t._doc(f)
        s = d.get("source")
        x = f"{s['ten']} — {s['luu_y']}" if isinstance(s, dict) and "ten" in s else d.get("_nguon", f)
        # EN-ALL GĐ 7: nguồn chân dung khác nguồn lĩnh vực ở phần "khung mục" — bản phủ tiếng Anh gộp mất, nêu lại ở đây.
        ra.append(L("trang_ts.nguon.chan_dung", x) if f == "thanso_chan_dung.json" else x)
    return ra


def _nguon(*ten: str) -> list[str]:
    # EN-ALL GĐ 7: bỏ dòng trùng theo bản Việt (bản dịch có thể gộp hai nguồn Việt khác chữ thành một câu Anh) → cùng số dòng.
    vi = ngon_ngu.theo_viet(_nguon_tho)(*ten)
    ra = _nguon_tho(*ten)
    return [x for i, x in enumerate(ra) if vi[i] not in vi[:i]]


def _tu_khoa(so: str) -> str:
    return _t()._doc("thanso_meanings.json")["so_meanings"][so]["tu_khoa"]


def _thuong(s: str) -> str:
    return s[:1].lower() + s[1:]


# ---- cặp số ----------------------------------------------------------------------
@ngon_ngu.theo_viet
def ds_cap_so() -> list[tuple[str, str]]:
    return [(k, f"so-chu-dao-{k.replace('-', '-va-')}") for k in _t()._doc("thanso_cap_so.json")["cap"]]


def trang_cap_so(k: str, slug: str) -> dict:
    t = _t()
    c = t._doc("thanso_cap_so.json")["cap"][k]
    a, b = k.split("-")
    qh = t._doc("thanso_quan_he.json")["theo_so"]
    ld = t._doc("thanso_linh_vuc.json")["noi_dung"]
    tra_loi = L("trang_ts.cap.tra_loi", "Trong thần số học, cặp số chủ đạo {a} và {b} không chấm điểm hợp hay khắc: dễ hoà ở chỗ "
                "{hoa_t} Dễ va ở chỗ {va_t}", a=a, b=b, hoa=c["hoa"], va=c["va"], hoa_t=_thuong(c["hoa"]), va_t=_thuong(c["va"]))
    muc = [{"tieu_de": L("trang_ts.cap.hoa", "Dễ hoà ở đâu"), "doan": c["hoa"]},
           {"tieu_de": L("trang_ts.cap.va", "Dễ va ở đâu"), "doan": c["va"]},
           {"tieu_de": L("trang_ts.cap.cung_lam", "Cùng làm gì để êm"), "doan": c["cung_lam"]}]
    for x, y in ((a, b), (b, a)) if a != b else ((a, b),):
        r = qh[x]["nguoi_yeu"]
        muc.append({"tieu_de": L("trang_ts.cap.nguoi_so", "Người số {x} trong tình cảm", x=x), "danh_sach": [
            L("trang_ts.cap.vai", "Vai thường thấy: {x}", x=r["vai"]), L("trang_ts.cap.can", "Cần được: {x}", x=r["can"]),
            L("trang_ts.cap.tranh", "Nên tránh với họ: {x}", x=r["tranh"]),
            L("trang_ts.cap.cach_noi", "Cách nói dễ lọt tai: {x}", x=r["cach_noi"])]})
    muc.append({"tieu_de": L("trang.tu_soi", "Câu hỏi tự soi"),
                "doan": L("trang_ts.cap.tu_soi", "{cau} — và người kia sẽ trả lời câu này thế nào?", cau=ld[a]["tinh_yeu"]["cau_tu_soi"])})
    hoi_dap = [
        {"hoi": L("trang_ts.cap.hd.hop", "Số chủ đạo {a} và {b} có hợp nhau không?", a=a, b=b), "dap": tra_loi},
        {"hoi": L("trang_ts.cap.hd.mau_thuan", "Số {a} và số {b} hay mâu thuẫn chuyện gì?", a=a, b=b), "dap": c["va"]},
        {"hoi": L("trang_ts.cap.hd.hoa_hop", "Làm sao để số {a} và số {b} hoà hợp hơn?", a=a, b=b), "dap": c["cung_lam"]},
        {"hoi": L("trang_ts.cap.hd.cuoi", "Thần số học có kết luận được hai người có nên cưới không?"),
         "dap": L("trang_ts.cap.hd.cuoi_dap", "Không. Con số chỉ gợi khung để hai người hiểu nhịp của nhau; quyết định là của hai bạn, "
                  "dựa trên cách đối xử thật hằng ngày.")},
    ]
    ds = ds_cap_so()
    i = [s for _, s in ds].index(slug)
    return {
        "loai": "cap_so", "slug": slug,
        "tieu_de": L("trang_ts.cap.tieu_de", "Số chủ đạo {a} và {b} có hợp nhau không? Thần số học hợp đôi", a=a, b=b),
        "mo_ta": t._cat(L("trang_ts.cap.mo_ta", "Số chủ đạo {a} và {b}: dễ hoà ở đâu, dễ va ở đâu, cùng làm gì để êm. Không chấm điểm hợp – khắc, "
                          "kèm câu hỏi tự soi.", a=a, b=b)),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_cap_so.json", "thanso_quan_he.json"),
        "trang_thai": t._doc("thanso_cap_so.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "cap_so", "slug": ds[j][1]} for j in (i - 1, i + 1) if 0 <= j < len(ds)]
        + [{"loai": "tinh_yeu", "slug": f"so-{a}-trong-tinh-yeu"}]
        + ([{"loai": "tinh_yeu", "slug": f"so-{b}-trong-tinh-yeu"}] if b != a else []),
        "minh_hoa": {"kieu": "cap_so", "a": int(a), "b": int(b)},
    }


# ---- nghề nghiệp ------------------------------------------------------------------
@ngon_ngu.theo_viet
def ds_nghe() -> list[tuple[str, str]]:
    return [(s, f"so-{s}-hop-nghe-gi") for s in _SO]


def trang_nghe(so: str, slug: str) -> dict:
    t = _t()
    cv = t._doc("thanso_chan_dung.json")["so"][so]["cong_viec"]
    lv = t._doc("thanso_linh_vuc.json")["noi_dung"][so]
    sn, tc = lv["su_nghiep"], lv["tai_chinh"]
    tra_loi = L("trang_ts.nghe.tra_loi", "Theo thần số học, {xh_t} Thế mạnh: {tm_t}", xh=sn["xu_huong"], xh_t=_thuong(sn["xu_huong"]),
                tm=t._cau(cv["the_manh"]), tm_t=t._cau(_thuong(cv["the_manh"])))
    muc = [{"tieu_de": L("trang_ts.nghe.nghe_hop", "Nghề thường hợp với số {so}", so=so), "danh_sach": cv["nghe"]},
           {"tieu_de": L("trang_ts.nghe.the_manh", "Thế mạnh trong công việc"), "doan": t._cau(cv["the_manh"])},
           {"tieu_de": L("trang_ts.nghe.moi_truong", "Môi trường làm việc hợp"), "doan": t._cau(cv["moi_truong"])},
           {"tieu_de": L("trang_ts.nghe.vai_tro", "Vai trò dễ toả sáng"), "doan": t._cau(cv["vai_tro"])},
           {"tieu_de": L("trang_ts.nghe.cai_bay", "Cái bẫy nghề nghiệp"), "doan": t._cau(cv["cai_bay"]) + " " + t._cau(sn["mat_toi"])},
           {"tieu_de": L("trang_ts.nghe.tien", "Số {so} với tiền bạc", so=so),
            "doan": L("trang_ts.nghe.tien_doan", "{a} {b} Gợi ý: {c}", a=t._cau(cv["tien_bac"]), b=tc["xu_huong"], c=tc["goi_y"])},
           {"tieu_de": L("trang.tu_soi", "Câu hỏi tự soi"), "doan": sn["cau_tu_soi"]}]
    hoi_dap = [{"hoi": L("trang_ts.nghe.hd.nghe", "Số chủ đạo {so} hợp nghề gì?", so=so),
                "dap": L("trang_ts.nghe.hd.nghe_dap", "{xh} Ví dụ: {vd}.", xh=sn["xu_huong"], vd=", ".join(cv["nghe"][:4]).lower())},
               {"hoi": L("trang_ts.nghe.hd.moi_truong", "Số {so} nên làm môi trường thế nào?", so=so), "dap": t._cau(cv["moi_truong"])},
               {"hoi": L("trang_ts.nghe.hd.diem_yeu", "Điểm yếu trong công việc của số {so}?", so=so), "dap": t._cau(cv["cai_bay"])},
               {"hoi": L("trang_ts.nghe.hd.quyet", "Con số có quyết định tôi nên chọn nghề gì không?"),
                "dap": L("trang_ts.nghe.hd.quyet_dap", "Không. Đây là gợi ý theo khuynh hướng tính cách để tham khảo; kỹ năng, hoàn cảnh và "
                         "lựa chọn của bạn mới quyết định.")}]
    i = _SO.index(so)
    return {
        "loai": "nghe", "slug": slug,
        "tieu_de": L("trang_ts.nghe.tieu_de", "Số chủ đạo {so} hợp nghề gì? Thần số học về sự nghiệp", so=so),
        "mo_ta": t._cat(L("trang_ts.nghe.mo_ta", "Số chủ đạo {so} ({tk}) hợp nghề gì: thế mạnh, môi trường, vai trò, cái bẫy và chuyện tiền bạc.",
                          so=so, tk=_tu_khoa(so).lower())),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_chan_dung.json", "thanso_linh_vuc.json"),
        "trang_thai": t._doc("thanso_chan_dung.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "so", "slug": f"so-{so}"}, {"loai": "tinh_yeu", "slug": f"so-{so}-trong-tinh-yeu"}]
        + [{"loai": "nghe", "slug": f"so-{_SO[j]}-hop-nghe-gi"} for j in (i - 1, i + 1) if 0 <= j < len(_SO)],
        "minh_hoa": _mh_so(so),
    }


# ---- tình yêu ------------------------------------------------------------------------
@ngon_ngu.theo_viet
def ds_tinh_yeu() -> list[tuple[str, str]]:
    return [(s, f"so-{s}-trong-tinh-yeu") for s in _SO]


def trang_tinh_yeu(so: str, slug: str) -> dict:
    t = _t()
    tc = t._doc("thanso_chan_dung.json")["so"][so]["tinh_cam"]
    ty = t._doc("thanso_linh_vuc.json")["noi_dung"][so]["tinh_yeu"]
    goc = _SO_GOC.get(so, so)
    tra_loi = L("trang_ts.ty.tra_loi", "Theo thần số học, {xh_t} {cy}", xh=ty["xu_huong"], xh_t=_thuong(ty["xu_huong"]),
                cy=t._cau(tc["cach_yeu"]))
    muc = [{"tieu_de": L("trang_ts.ty.cach_yeu", "Cách yêu"), "doan": t._cau(tc["cach_yeu"])},
           {"tieu_de": L("trang_ts.ty.can_duoc", "Cần được"), "doan": t._cau(tc["can_duoc"])},
           {"tieu_de": L("trang_ts.ty.diem_mu", "Điểm mù trong tình cảm"), "doan": t._cau(tc["diem_mu"]) + " " + t._cau(ty["mat_toi"])},
           {"tieu_de": L("trang_ts.ty.hop_kieu", "Thường hợp kiểu người"), "doan": t._cau(tc["hop_kieu_nguoi"])},
           {"tieu_de": L("trang_ts.ty.lech", "Dấu hiệu đang lệch nhịp"), "doan": t._cau(tc["dau_hieu_lech"])},
           {"tieu_de": L("trang_ts.ty.hon_nhan", "Hôn nhân"), "doan": t._cau(tc["hon_nhan"])},
           {"tieu_de": L("trang_ts.ty.goi_y", "Gợi ý"), "doan": t._cau(ty["goi_y"])},
           {"tieu_de": L("trang.tu_soi", "Câu hỏi tự soi"), "doan": ty["cau_tu_soi"]}]
    hoi_dap = [{"hoi": L("trang_ts.ty.hd.the_nao", "Số chủ đạo {so} trong tình yêu thế nào?", so=so), "dap": tra_loi},
               {"hoi": L("trang_ts.ty.hd.hop", "Số {so} hợp với kiểu người nào?", so=so), "dap": t._cau(tc["hop_kieu_nguoi"])},
               {"hoi": L("trang_ts.ty.hd.can", "Người số {so} cần gì ở nửa kia?", so=so), "dap": t._cau(tc["can_duoc"])}]
    i = _SO.index(so)
    cap = [f"so-chu-dao-{min(int(goc), x)}-va-{max(int(goc), x)}" for x in (int(goc),)]
    return {
        "loai": "tinh_yeu", "slug": slug,
        "tieu_de": L("trang_ts.ty.tieu_de", "Số chủ đạo {so} trong tình yêu: cách yêu, điểm mù, hợp kiểu người nào", so=so),
        "mo_ta": t._cat(L("trang_ts.ty.mo_ta", "Số chủ đạo {so} trong tình yêu: cách yêu, cần được gì, điểm mù, hợp kiểu người nào, "
                          "dấu hiệu lệch nhịp và câu hỏi tự soi.", so=so)),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_chan_dung.json", "thanso_linh_vuc.json"),
        "trang_thai": t._doc("thanso_chan_dung.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "so", "slug": f"so-{so}"}, {"loai": "nghe", "slug": f"so-{so}-hop-nghe-gi"},
                      {"loai": "cap_so", "slug": cap[0]}]
        + [{"loai": "tinh_yeu", "slug": f"so-{_SO[j]}-trong-tinh-yeu"} for j in (i - 1, i + 1) if 0 <= j < len(_SO)],
        "minh_hoa": _mh_so(so),
    }


# ---- năm cá nhân --------------------------------------------------------------------
@ngon_ngu.theo_viet
def ds_nam_ca_nhan() -> list[tuple[str, str]]:
    return [(s, f"nam-ca-nhan-{s}") for s in _t()._doc("thanso_depth.json")["nam_ca_nhan"]]


def trang_nam_ca_nhan(so: str, slug: str) -> dict:
    t = _t()
    n = t._doc("thanso_depth.json")["nam_ca_nhan"][so]
    nen_tranh = L("trang_ts.nam.nen_tranh", "Nên: {nen} Tránh: {tranh}", nen=t._cau(n["nen"]), tranh=t._cau(n["tranh"]))
    tra_loi = L("trang_ts.nam.tra_loi", "Năm cá nhân số {so} là {cd}: {y} {nt}", so=so, cd=n["chu_de"].lower(), y=n["y_nghia"], nt=nen_tranh)
    muc = [{"tieu_de": L("trang_ts.nam.chu_de", "Chủ đề của năm"), "doan": f"{n['chu_de']}. {n['y_nghia']}"},
           {"tieu_de": L("trang_ts.nam.nen", "Nên làm"), "doan": t._cau(n["nen"])},
           {"tieu_de": L("trang_ts.nam.tranh", "Nên tránh"), "doan": t._cau(n["tranh"])},
           {"tieu_de": L("trang_ts.nam.hay_gap", "Hay gặp trong năm này"), "doan": t._cau(n["hay_gap"])},
           {"tieu_de": L("trang_ts.nam.cach_tinh", "Cách tính năm cá nhân"),
            "doan": L("trang_ts.nam.cach_tinh_doan",
                      "Cộng ngày sinh + tháng sinh (dương lịch) + năm đang xét, rút gọn về một chữ số 1–9. "
                      "Ví dụ sinh 24/10, năm 2026: 2+4 + 1+0 + 2+0+2+6 = 17 → 1+7 = 8, tức năm cá nhân số 8. "
                      "Năm cá nhân đi theo chu kỳ 9 năm và đổi vào ngày sinh nhật hoặc đầu năm, tuỳ trường phái.")}]
    hoi_dap = [{"hoi": L("trang_ts.nam.hd.nen", "Năm cá nhân số {so} nên làm gì?", so=so), "dap": nen_tranh},
               {"hoi": L("trang_ts.nam.hd.hay_gap", "Năm cá nhân số {so} hay gặp chuyện gì?", so=so), "dap": t._cau(n["hay_gap"])},
               {"hoi": L("trang_ts.nam.hd.tinh", "Năm cá nhân tính thế nào?"),
                "dap": L("trang_ts.nam.hd.tinh_dap", "Cộng ngày + tháng sinh với năm đang xét rồi rút gọn về 1–9. Trang Thần số học tính sẵn "
                         "năm, tháng, ngày cá nhân của bạn.")}]
    ds = [s for s, _ in ds_nam_ca_nhan()]
    i = ds.index(so)
    return {
        "loai": "nam_ca_nhan", "slug": slug,
        "tieu_de": L("trang_ts.nam.tieu_de", "Năm cá nhân số {so}: {cd} — nên làm gì, tránh gì", so=so, cd=n["chu_de"].lower()),
        "mo_ta": t._cat(L("trang_ts.nam.mo_ta", "Năm cá nhân số {so} ({cd}): ý nghĩa, nên làm, nên tránh, chuyện hay gặp và cách tự tính "
                          "năm cá nhân.", so=so, cd=n["chu_de"].lower())),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [L("trang_ts.nguon.depth", t._doc("thanso_depth.json")["_nguon"])],
        # thanso_depth.json do AI soạn (commit 7887b88), không phải chủ dự án viết → chờ thẩm định (EEAT-1).
        "trang_thai": t._doc("thanso_depth.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "nam_ca_nhan", "slug": f"nam-ca-nhan-{ds[j % len(ds)]}"} for j in (i - 1, i + 1)]
        + [{"loai": "so", "slug": f"so-{so}"}],
        "minh_hoa": _mh_so(so),
    }


# ---- nợ nghiệp -----------------------------------------------------------------------
@ngon_ngu.theo_viet
def ds_no_nghiep() -> list[tuple[str, str]]:
    return [(s, f"no-nghiep-{s}") for s in _t()._doc("thanso_chi_so_phu.json")["no_nghiep"]]


def trang_no_nghiep(so: str, slug: str) -> dict:
    t = _t()
    kb = t._doc("thanso_chi_so_phu.json")
    n = kb["no_nghiep"][so]
    m = re.search(r"\((\d+)/(\d+)\)", n["ten"])            # KB ghi "Nợ nghiệp 13 (13/4)" → số gốc lấy từ KB
    goc = m.group(2) if m else so
    tra_loi = L("trang_ts.nn.tra_loi", "{y} Gợi ý: {g}", y=n["y_nghia"], g=t._cau(n["goi_y"]))
    muc = [{"tieu_de": L("trang_ts.nn.y_nghia", "Ý nghĩa"), "doan": n["y_nghia"]},
           {"tieu_de": L("trang_ts.nn.goi_y", "Gợi ý"), "doan": t._cau(n["goi_y"])},
           {"tieu_de": L("trang_ts.nn.khi_nao", "Khi nào được xem là có nợ nghiệp"),
            "doan": L("trang_ts.nn.khi_nao_doan",
                      "Khi một trong các con số chính (đường đời, sứ mệnh, linh hồn, nhân cách, ngày sinh) đi qua tổng {so} "
                      "trước khi rút gọn về {goc}. Ví dụ sinh ngày {so} thì số ngày sinh mang nợ nghiệp {so}/{goc}.", so=so, goc=goc)},
           {"tieu_de": L("trang_ts.nn.hieu", "Nên hiểu thế nào"),
            "doan": L("trang_ts.nn.hieu_doan", "Truyền thống gọi là 'nợ nghiệp' nhưng nên đọc như một bài học lặp lại cần luyện, không phải "
                      "hình phạt hay điềm xấu. Không ai bị định đoạt bởi con số.")}]
    hoi_dap = [{"hoi": L("trang_ts.nn.hd.la_gi", "Nợ nghiệp {so} là gì?", so=so), "dap": tra_loi},
               {"hoi": L("trang_ts.nn.hd.biet", "Làm sao biết mình có nợ nghiệp {so}?", so=so),
                "dap": L("trang_ts.nn.hd.biet_dap", "Xem các số chính có đi qua tổng {so} trước khi rút gọn không; trang Thần số học tự kiểm "
                         "và báo cho bạn.", so=so)},
               {"hoi": L("trang_ts.nn.hd.xau", "Nợ nghiệp có phải điềm xấu không?"),
                "dap": L("trang_ts.nn.hd.xau_dap", "Không. Nên hiểu là bài học cần luyện, kèm gợi ý hành động cụ thể.")}]
    ds = [s for s, _ in ds_no_nghiep()]
    i = ds.index(so)
    return {
        "loai": "no_nghiep", "slug": slug,
        "tieu_de": L("trang_ts.nn.tieu_de", "Nợ nghiệp {so} trong thần số học là gì? Ý nghĩa và cách hiểu", so=so),
        "mo_ta": t._cat(L("trang_ts.nn.mo_ta", "Nợ nghiệp {so} ({so}/{goc}) trong thần số học: ý nghĩa, khi nào được xem là có, cách hiểu "
                          "như bài học cần luyện và gợi ý cụ thể.", so=so, goc=goc)),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_chi_so_phu.json"),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "no_nghiep", "slug": f"no-nghiep-{ds[j % len(ds)]}"} for j in (i - 1, i + 1)]
        + [{"loai": "so", "slug": f"so-{goc}"}],
        "minh_hoa": {"kieu": "so", "so": int(so), "so_cai": False, "so_goc": int(goc)},
    }


# ---- số kép Chaldea 10–52 (TS-PHAI → SEO) ----------------------------------------------------------------
@ngon_ngu.theo_viet
def ds_so_kep() -> list[tuple[str, str]]:
    return [(s, f"so-kep-{s}") for s in _t()._doc("thanso_chaldean.json")["kep"]]


def trang_so_kep(so: str, slug: str) -> dict:
    t = _t()
    kb = t._doc("thanso_chaldean.json")
    k = kb["kep"][so]
    goc = so
    while int(goc) > 9:
        goc = str(sum(int(c) for c in goc))
    g = kb["goc"].get(goc, {})
    bang = "; ".join(f"{v}: {c}" for v, c in kb["bang_chu"].items())
    tra_loi = L("trang_ts.kep.tra_loi", "Số kép {so} — “{bt}”. {xh}", so=so, bt=k["bieu_tuong"], xh=k["xu_huong"])
    muc = [{"tieu_de": L("trang_ts.kep.bieu_tuong", "Biểu tượng: {bt}", bt=k["bieu_tuong"]), "doan": k["xu_huong"]},
           {"tieu_de": L("trang_ts.kep.mat_toi", "Mặt tối cần để ý"), "doan": k["mat_toi"]},
           {"tieu_de": L("trang.tu_soi", "Câu hỏi tự soi"), "doan": k["cau_tu_soi"]},
           {"tieu_de": L("trang_ts.kep.rut_gon", "Rút gọn về số gốc {goc}", goc=goc)
            + (L("trang_ts.kep.rut_gon_ten", " — {ten} ({ht})", ten=g["ten"], ht=g["hanh_tinh"]) if g else ""),
            "doan": (L("trang_ts.kep.cong", "Cộng các chữ số của {so} được số gốc {goc}. ", so=so, goc=goc)
                     + (g.get("xu_huong", "") + " " if g else "")
                     + L("trang_ts.kep.doc_truoc", "Phái Chaldea đọc số kép trước để thêm sắc thái, rồi mới đến số gốc."))},
           {"tieu_de": L("trang_ts.kep.khi_nao", "Khi nào bạn mang số kép này"),
            "doan": L("trang_ts.kep.khi_nao_doan",
                      "Khi tổng chữ cái của tên (theo bảng Chaldea — {bang}; không chữ nào mang số 9) hoặc tổng ngày sinh "
                      "đi qua {so} trên đường rút gọn. Phái này coi trọng tên người khác thường gọi bạn hằng ngày.", bang=bang, so=so)},
           {"tieu_de": L("trang_ts.kep.khac_pitago", "Chaldea khác Pythagoras thế nào"), "doan": " ".join(kb["gioi_thieu"]["khac_pitago"][:3])},
           {"tieu_de": L("trang_ts.kep.cach_doc", "Nên đọc thế nào"), "doan": kb["gioi_thieu"]["cach_doc"]}]
    hoi_dap = [{"hoi": L("trang_ts.kep.hd.nghia", "Số kép {so} trong thần số Chaldea nghĩa là gì?", so=so), "dap": tra_loi},
               {"hoi": L("trang_ts.kep.hd.goc", "Số kép {so} rút gọn về số mấy?", so=so),
                "dap": L("trang_ts.kep.hd.goc_dap", "Về số gốc {goc}", goc=goc)
                + (L("trang_ts.kep.hd.goc_ten", " ({ten}).", ten=g["ten"]) if g else ".")},
               {"hoi": L("trang_ts.kep.hd.ten", "Làm sao biết tên mình có số kép {so}?", so=so),
                "dap": L("trang_ts.kep.hd.ten_dap", "Trang Thần số học có công tắc “Trường phái” → Chaldea: nhập họ tên và tên thường gọi, "
                         "trang tự tính số kép.")}]
    ds = [s_ for s_, _ in ds_so_kep()]
    i = ds.index(so)
    cat = L("trang_ts.kep.tieu_de_cat", ", mặt tối")
    return {
        "loai": "so_kep", "slug": slug,
        # ≤ 70 ký tự (rà SEO-E): biểu tượng dài thì bỏ đuôi "mặt tối" (mô tả vẫn nêu).
        "tieu_de": (lambda tt: tt if len(tt) <= 70 else tt.removesuffix(cat))(
            L("trang_ts.kep.tieu_de", "Số kép {so} thần số Chaldea: {bt} — ý nghĩa, mặt tối", so=so, bt=k["bieu_tuong"].lower())),
        "mo_ta": t._cat(L("trang_ts.kep.mo_ta", "Số kép {so} trong thần số học Chaldea ({bt}): ý nghĩa, mặt tối, rút gọn về số {goc}, "
                          "cách biết tên mình mang số này.", so=so, bt=k["bieu_tuong"].lower(), goc=goc)),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [L("trang_ts.nguon.chaldea", "Hệ thần số Chaldea — Cheiro, Book of Numbers (1926), diễn đạt lại bằng lời mới")],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "so_kep", "slug": f"so-kep-{ds[j % len(ds)]}"} for j in (i - 1, i + 1)],
        "minh_hoa": {"kieu": "so", "so": int(so), "so_cai": False, "so_goc": int(goc)},
    }


TRANG = {"so_kep": (ds_so_kep, trang_so_kep), "cap_so": (ds_cap_so, trang_cap_so), "nghe": (ds_nghe, trang_nghe), "tinh_yeu": (ds_tinh_yeu, trang_tinh_yeu),
         "nam_ca_nhan": (ds_nam_ca_nhan, trang_nam_ca_nhan), "no_nghiep": (ds_no_nghiep, trang_no_nghiep)}

TEN_NGAN = {
    "cap_so": lambda k: L("trang_ts.ten_ngan.cap_so", "Số {a} và số {b}", a=k.split("-")[0], b=k.split("-")[1]),
    "nghe": lambda s: L("trang_ts.ten_ngan.nghe", "Số {so} hợp nghề gì", so=s),
    "tinh_yeu": lambda s: L("trang_ts.ten_ngan.tinh_yeu", "Số {so} trong tình yêu", so=s),
    "nam_ca_nhan": lambda s: L("trang_ts.ten_ngan.nam_ca_nhan", "Năm cá nhân số {so}", so=s),
    "no_nghiep": lambda s: L("trang_ts.ten_ngan.no_nghiep", "Nợ nghiệp {so}", so=s),
    "so_kep": lambda s: L("trang_ts.ten_ngan.so_kep", "Số kép {so} (Chaldea)", so=s),
}
