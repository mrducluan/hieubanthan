# -*- coding: utf-8 -*-
"""SEO-G — cụm trang thần số học theo câu người Việt hay tìm, dựng từ KB (chỉ ĐỌC + GHÉP, không sinh nghĩa mới).

Năm loại trang (danh sách + hàm dựng), đăng ký vào `trang._TRANG` để dùng chung sitemap, bản .md, trang chủ đề:
  cap_so      "Số chủ đạo A và B có hợp nhau không?"   45 cặp 1–9 (thanso_cap_so) — KHÔNG chấm điểm hợp/khắc
  nghe        "Số chủ đạo N hợp nghề gì?"               12 số (chân dung công việc + lĩnh vực sự nghiệp/tiền bạc)
  tinh_yeu    "Số chủ đạo N trong tình yêu"             12 số (chân dung tình cảm + lĩnh vực tình yêu)
  nam_ca_nhan "Năm cá nhân số N nên làm gì?"            9 số (depth.nam_ca_nhan)
  no_nghiep   "Nợ nghiệp 13/14/16/19 là gì?"           4 số (chỉ số phụ)
"""
from __future__ import annotations

import re

_SO = ("1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33")
_SO_GOC = {"11": "2", "22": "4", "33": "6"}


def _t():                       # tránh vòng import: trang.py nạp module này ở cuối
    from app.kb import trang
    return trang


def _mh_so(so: str) -> dict:
    return {"kieu": "so", "so": int(so), "so_cai": so in _SO_GOC, "so_goc": int(_SO_GOC.get(so, so))}


def _nguon(*ten: str) -> list[str]:
    t = _t()
    ra = []
    for f in ten:
        d = t._doc(f)
        s = d.get("source")
        ra.append(f"{s['ten']} — {s['luu_y']}" if isinstance(s, dict) and "ten" in s else d.get("_nguon", f))
    return list(dict.fromkeys(ra))


def _tu_khoa(so: str) -> str:
    return _t()._doc("thanso_meanings.json")["so_meanings"][so]["tu_khoa"]


# ---- cặp số ----------------------------------------------------------------------
def ds_cap_so() -> list[tuple[str, str]]:
    return [(k, f"so-chu-dao-{k.replace('-', '-va-')}") for k in _t()._doc("thanso_cap_so.json")["cap"]]


def trang_cap_so(k: str, slug: str) -> dict:
    t = _t()
    c = t._doc("thanso_cap_so.json")["cap"][k]
    a, b = k.split("-")
    qh = t._doc("thanso_quan_he.json")["theo_so"]
    ld = t._doc("thanso_linh_vuc.json")["noi_dung"]
    tra_loi = (f"Thần số học không chấm điểm hợp hay khắc. Với số chủ đạo {a} và {b}: dễ hoà ở chỗ "
               f"{c['hoa'][:1].lower() + c['hoa'][1:]} Dễ va ở chỗ {c['va'][:1].lower() + c['va'][1:]}")
    muc = [{"tieu_de": "Dễ hoà ở đâu", "doan": c["hoa"]},
           {"tieu_de": "Dễ va ở đâu", "doan": c["va"]},
           {"tieu_de": "Cùng làm gì để êm", "doan": c["cung_lam"]}]
    for x, y in ((a, b), (b, a)) if a != b else ((a, b),):
        r = qh[x]["nguoi_yeu"]
        muc.append({"tieu_de": f"Người số {x} trong tình cảm", "danh_sach": [
            f"Vai thường thấy: {r['vai']}", f"Cần được: {r['can']}", f"Nên tránh với họ: {r['tranh']}",
            f"Cách nói dễ lọt tai: {r['cach_noi']}"]})
    muc.append({"tieu_de": "Câu hỏi tự soi", "doan": f"{ld[a]['tinh_yeu']['cau_tu_soi']} — và người kia sẽ trả lời câu này thế nào?"})
    hoi_dap = [
        {"hoi": f"Số chủ đạo {a} và {b} có hợp nhau không?", "dap": tra_loi},
        {"hoi": f"Số {a} và số {b} hay mâu thuẫn chuyện gì?", "dap": c["va"]},
        {"hoi": f"Làm sao để số {a} và số {b} hoà hợp hơn?", "dap": c["cung_lam"]},
        {"hoi": "Thần số học có kết luận được hai người có nên cưới không?",
         "dap": "Không. Con số chỉ gợi khung để hai người hiểu nhịp của nhau; quyết định là của hai bạn, dựa trên cách đối xử thật hằng ngày."},
    ]
    ds = ds_cap_so()
    i = [s for _, s in ds].index(slug)
    return {
        "loai": "cap_so", "slug": slug,
        "tieu_de": f"Số chủ đạo {a} và {b} có hợp nhau không? Thần số học hợp đôi",
        "mo_ta": t._cat(f"Số chủ đạo {a} và {b}: dễ hoà ở đâu, dễ va ở đâu, cùng làm gì để êm. Không chấm điểm hợp – khắc, kèm câu hỏi tự soi."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_cap_so.json", "thanso_quan_he.json"),
        "trang_thai": t._doc("thanso_cap_so.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "cap_so", "slug": ds[j][1]} for j in (i - 1, i + 1) if 0 <= j < len(ds)]
        + [{"loai": "tinh_yeu", "slug": f"so-{a}-trong-tinh-yeu"}]
        + ([{"loai": "tinh_yeu", "slug": f"so-{b}-trong-tinh-yeu"}] if b != a else []),
        "minh_hoa": {"kieu": "cap_so", "a": int(a), "b": int(b)},
    }


# ---- nghề nghiệp ------------------------------------------------------------------
def ds_nghe() -> list[tuple[str, str]]:
    return [(s, f"so-{s}-hop-nghe-gi") for s in _SO]


def trang_nghe(so: str, slug: str) -> dict:
    t = _t()
    cv = t._doc("thanso_chan_dung.json")["so"][so]["cong_viec"]
    lv = t._doc("thanso_linh_vuc.json")["noi_dung"][so]
    sn, tc = lv["su_nghiep"], lv["tai_chinh"]
    tra_loi = f"{sn['xu_huong']} Thế mạnh: {t._cau(cv['the_manh'][:1].lower() + cv['the_manh'][1:])}"
    muc = [{"tieu_de": f"Nghề thường hợp với số {so}", "danh_sach": cv["nghe"]},
           {"tieu_de": "Thế mạnh trong công việc", "doan": t._cau(cv["the_manh"])},
           {"tieu_de": "Môi trường làm việc hợp", "doan": t._cau(cv["moi_truong"])},
           {"tieu_de": "Vai trò dễ toả sáng", "doan": t._cau(cv["vai_tro"])},
           {"tieu_de": "Cái bẫy nghề nghiệp", "doan": t._cau(cv["cai_bay"]) + " " + t._cau(sn["mat_toi"])},
           {"tieu_de": f"Số {so} với tiền bạc", "doan": f"{t._cau(cv['tien_bac'])} {tc['xu_huong']} Gợi ý: {tc['goi_y']}"},
           {"tieu_de": "Câu hỏi tự soi", "doan": sn["cau_tu_soi"]}]
    hoi_dap = [{"hoi": f"Số chủ đạo {so} hợp nghề gì?", "dap": f"{sn['xu_huong']} Ví dụ: {', '.join(cv['nghe'][:4]).lower()}."},
               {"hoi": f"Số {so} nên làm môi trường thế nào?", "dap": t._cau(cv["moi_truong"])},
               {"hoi": f"Điểm yếu trong công việc của số {so}?", "dap": t._cau(cv["cai_bay"])},
               {"hoi": "Con số có quyết định tôi nên chọn nghề gì không?",
                "dap": "Không. Đây là gợi ý theo khuynh hướng tính cách để tham khảo; kỹ năng, hoàn cảnh và lựa chọn của bạn mới quyết định."}]
    i = _SO.index(so)
    return {
        "loai": "nghe", "slug": slug,
        "tieu_de": f"Số chủ đạo {so} hợp nghề gì? Thần số học về sự nghiệp",
        "mo_ta": t._cat(f"Số chủ đạo {so} ({_tu_khoa(so).lower()}) hợp nghề gì: thế mạnh, môi trường, vai trò, cái bẫy và chuyện tiền bạc."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_chan_dung.json", "thanso_linh_vuc.json"),
        "trang_thai": t._doc("thanso_chan_dung.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "so", "slug": f"so-{so}"}, {"loai": "tinh_yeu", "slug": f"so-{so}-trong-tinh-yeu"}]
        + [{"loai": "nghe", "slug": f"so-{_SO[j]}-hop-nghe-gi"} for j in (i - 1, i + 1) if 0 <= j < len(_SO)],
        "minh_hoa": _mh_so(so),
    }


# ---- tình yêu ------------------------------------------------------------------------
def ds_tinh_yeu() -> list[tuple[str, str]]:
    return [(s, f"so-{s}-trong-tinh-yeu") for s in _SO]


def trang_tinh_yeu(so: str, slug: str) -> dict:
    t = _t()
    tc = t._doc("thanso_chan_dung.json")["so"][so]["tinh_cam"]
    ty = t._doc("thanso_linh_vuc.json")["noi_dung"][so]["tinh_yeu"]
    goc = _SO_GOC.get(so, so)
    tra_loi = f"{ty['xu_huong']} {t._cau(tc['cach_yeu'])}"
    muc = [{"tieu_de": "Cách yêu", "doan": t._cau(tc["cach_yeu"])},
           {"tieu_de": "Cần được", "doan": t._cau(tc["can_duoc"])},
           {"tieu_de": "Điểm mù trong tình cảm", "doan": t._cau(tc["diem_mu"]) + " " + t._cau(ty["mat_toi"])},
           {"tieu_de": "Thường hợp kiểu người", "doan": t._cau(tc["hop_kieu_nguoi"])},
           {"tieu_de": "Dấu hiệu đang lệch nhịp", "doan": t._cau(tc["dau_hieu_lech"])},
           {"tieu_de": "Hôn nhân", "doan": t._cau(tc["hon_nhan"])},
           {"tieu_de": "Gợi ý", "doan": t._cau(ty["goi_y"])},
           {"tieu_de": "Câu hỏi tự soi", "doan": ty["cau_tu_soi"]}]
    hoi_dap = [{"hoi": f"Số chủ đạo {so} trong tình yêu thế nào?", "dap": tra_loi},
               {"hoi": f"Số {so} hợp với kiểu người nào?", "dap": t._cau(tc["hop_kieu_nguoi"])},
               {"hoi": f"Người số {so} cần gì ở nửa kia?", "dap": t._cau(tc["can_duoc"])}]
    i = _SO.index(so)
    cap = [f"so-chu-dao-{min(int(goc), x)}-va-{max(int(goc), x)}" for x in (int(goc),)]
    return {
        "loai": "tinh_yeu", "slug": slug,
        "tieu_de": f"Số chủ đạo {so} trong tình yêu: cách yêu, điểm mù, hợp kiểu người nào",
        "mo_ta": t._cat(f"Số chủ đạo {so} trong tình yêu: cách yêu, cần được gì, điểm mù, hợp kiểu người nào, dấu hiệu lệch nhịp và câu hỏi tự soi."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_chan_dung.json", "thanso_linh_vuc.json"),
        "trang_thai": t._doc("thanso_chan_dung.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "so", "slug": f"so-{so}"}, {"loai": "nghe", "slug": f"so-{so}-hop-nghe-gi"},
                      {"loai": "cap_so", "slug": cap[0]}]
        + [{"loai": "tinh_yeu", "slug": f"so-{_SO[j]}-trong-tinh-yeu"} for j in (i - 1, i + 1) if 0 <= j < len(_SO)],
        "minh_hoa": _mh_so(so),
    }


# ---- năm cá nhân --------------------------------------------------------------------
def ds_nam_ca_nhan() -> list[tuple[str, str]]:
    return [(s, f"nam-ca-nhan-{s}") for s in _t()._doc("thanso_depth.json")["nam_ca_nhan"]]


def trang_nam_ca_nhan(so: str, slug: str) -> dict:
    t = _t()
    n = t._doc("thanso_depth.json")["nam_ca_nhan"][so]
    tra_loi = f"Năm cá nhân số {so} là {n['chu_de'].lower()}: {n['y_nghia']} Nên: {t._cau(n['nen'])} Tránh: {t._cau(n['tranh'])}"
    muc = [{"tieu_de": "Chủ đề của năm", "doan": f"{n['chu_de']}. {n['y_nghia']}"},
           {"tieu_de": "Nên làm", "doan": t._cau(n["nen"])},
           {"tieu_de": "Nên tránh", "doan": t._cau(n["tranh"])},
           {"tieu_de": "Hay gặp trong năm này", "doan": t._cau(n["hay_gap"])},
           {"tieu_de": "Cách tính năm cá nhân",
            "doan": ("Cộng ngày sinh + tháng sinh (dương lịch) + năm đang xét, rút gọn về một chữ số 1–9. "
                     "Ví dụ sinh 24/10, năm 2026: 2+4 + 1+0 + 2+0+2+6 = 17 → 1+7 = 8, tức năm cá nhân số 8. "
                     "Năm cá nhân đi theo chu kỳ 9 năm và đổi vào ngày sinh nhật hoặc đầu năm, tuỳ trường phái.")}]
    hoi_dap = [{"hoi": f"Năm cá nhân số {so} nên làm gì?", "dap": f"Nên: {t._cau(n['nen'])} Tránh: {t._cau(n['tranh'])}"},
               {"hoi": f"Năm cá nhân số {so} hay gặp chuyện gì?", "dap": t._cau(n["hay_gap"])},
               {"hoi": "Năm cá nhân tính thế nào?",
                "dap": "Cộng ngày + tháng sinh với năm đang xét rồi rút gọn về 1–9. Trang Thần số học tính sẵn năm, tháng, ngày cá nhân của bạn."}]
    ds = [s for s, _ in ds_nam_ca_nhan()]
    i = ds.index(so)
    return {
        "loai": "nam_ca_nhan", "slug": slug,
        "tieu_de": f"Năm cá nhân số {so}: {n['chu_de'].lower()} — nên làm gì, tránh gì",
        "mo_ta": t._cat(f"Năm cá nhân số {so} ({n['chu_de'].lower()}): ý nghĩa, nên làm, nên tránh, chuyện hay gặp và cách tự tính năm cá nhân."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": [t._doc("thanso_depth.json")["_nguon"]],
        # thanso_depth.json do AI soạn (commit 7887b88), không phải chủ dự án viết → chờ thẩm định (EEAT-1).
        "trang_thai": t._doc("thanso_depth.json").get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "nam_ca_nhan", "slug": f"nam-ca-nhan-{ds[j % len(ds)]}"} for j in (i - 1, i + 1)]
        + [{"loai": "so", "slug": f"so-{so}"}],
        "minh_hoa": _mh_so(so),
    }


# ---- nợ nghiệp -----------------------------------------------------------------------
def ds_no_nghiep() -> list[tuple[str, str]]:
    return [(s, f"no-nghiep-{s}") for s in _t()._doc("thanso_chi_so_phu.json")["no_nghiep"]]


def trang_no_nghiep(so: str, slug: str) -> dict:
    t = _t()
    kb = t._doc("thanso_chi_so_phu.json")
    n = kb["no_nghiep"][so]
    m = re.search(r"\((\d+)/(\d+)\)", n["ten"])            # KB ghi "Nợ nghiệp 13 (13/4)" → số gốc lấy từ KB
    goc = m.group(2) if m else so
    tra_loi = f"{n['y_nghia']} Gợi ý: {t._cau(n['goi_y'])}"
    muc = [{"tieu_de": "Ý nghĩa", "doan": n["y_nghia"]},
           {"tieu_de": "Gợi ý", "doan": t._cau(n["goi_y"])},
           {"tieu_de": "Khi nào được xem là có nợ nghiệp",
            "doan": (f"Khi một trong các con số chính (đường đời, sứ mệnh, linh hồn, nhân cách, ngày sinh) đi qua tổng {so} "
                     f"trước khi rút gọn về {goc}. Ví dụ sinh ngày {so} thì số ngày sinh mang nợ nghiệp {so}/{goc}.")},
           {"tieu_de": "Nên hiểu thế nào",
            "doan": ("Truyền thống gọi là 'nợ nghiệp' nhưng nên đọc như một bài học lặp lại cần luyện, không phải hình phạt "
                     "hay điềm xấu. Không ai bị định đoạt bởi con số.")}]
    hoi_dap = [{"hoi": f"Nợ nghiệp {so} là gì?", "dap": tra_loi},
               {"hoi": f"Làm sao biết mình có nợ nghiệp {so}?",
                "dap": f"Xem các số chính có đi qua tổng {so} trước khi rút gọn không; trang Thần số học tự kiểm và báo cho bạn."},
               {"hoi": "Nợ nghiệp có phải điềm xấu không?", "dap": "Không. Nên hiểu là bài học cần luyện, kèm gợi ý hành động cụ thể."}]
    ds = [s for s, _ in ds_no_nghiep()]
    i = ds.index(so)
    return {
        "loai": "no_nghiep", "slug": slug,
        "tieu_de": f"Nợ nghiệp {so} trong thần số học là gì? Ý nghĩa và cách hiểu",
        "mo_ta": t._cat(f"Nợ nghiệp {so} ({so}/{goc}) trong thần số học: ý nghĩa, khi nào được xem là có, cách hiểu như bài học cần luyện và gợi ý cụ thể."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": _nguon("thanso_chi_so_phu.json"),
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "no_nghiep", "slug": f"no-nghiep-{ds[j % len(ds)]}"} for j in (i - 1, i + 1)]
        + [{"loai": "so", "slug": f"so-{goc}"}],
        "minh_hoa": {"kieu": "so", "so": int(so), "so_cai": False, "so_goc": int(goc)},
    }


# ---- số kép Chaldea 10–52 (TS-PHAI → SEO) ----------------------------------------------------------------
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
    tra_loi = f"Số kép {so} — “{k['bieu_tuong']}”. {k['xu_huong']}"
    muc = [{"tieu_de": f"Biểu tượng: {k['bieu_tuong']}", "doan": k["xu_huong"]},
           {"tieu_de": "Mặt tối cần để ý", "doan": k["mat_toi"]},
           {"tieu_de": "Câu hỏi tự soi", "doan": k["cau_tu_soi"]},
           {"tieu_de": f"Rút gọn về số gốc {goc}" + (f" — {g['ten']} ({g['hanh_tinh']})" if g else ""),
            "doan": (f"Cộng các chữ số của {so} được số gốc {goc}. " + (g.get("xu_huong", "") + " " if g else "")
                     + "Phái Chaldea đọc số kép trước để thêm sắc thái, rồi mới đến số gốc.")},
           {"tieu_de": "Khi nào bạn mang số kép này",
            "doan": (f"Khi tổng chữ cái của tên (theo bảng Chaldea — {bang}; không chữ nào mang số 9) hoặc tổng ngày sinh "
                     f"đi qua {so} trên đường rút gọn. Phái này coi trọng tên người khác thường gọi bạn hằng ngày.")},
           {"tieu_de": "Chaldea khác Pythagoras thế nào", "doan": " ".join(kb["gioi_thieu"]["khac_pitago"][:3])},
           {"tieu_de": "Nên đọc thế nào", "doan": kb["gioi_thieu"]["cach_doc"]}]
    hoi_dap = [{"hoi": f"Số kép {so} trong thần số Chaldea nghĩa là gì?", "dap": tra_loi},
               {"hoi": f"Số kép {so} rút gọn về số mấy?", "dap": f"Về số gốc {goc}" + (f" ({g['ten']})." if g else ".")},
               {"hoi": f"Làm sao biết tên mình có số kép {so}?",
                "dap": "Trang Thần số học có công tắc “Trường phái” → Chaldea: nhập họ tên và tên thường gọi, trang tự tính số kép."}]
    ds = [s_ for s_, _ in ds_so_kep()]
    i = ds.index(so)
    return {
        "loai": "so_kep", "slug": slug,
        # ≤ 70 ký tự (rà SEO-E): biểu tượng dài thì bỏ đuôi "mặt tối" (mô tả vẫn nêu).
        "tieu_de": (lambda tt: tt if len(tt) <= 70 else tt.removesuffix(", mặt tối"))(
            f"Số kép {so} thần số Chaldea: {k['bieu_tuong'].lower()} — ý nghĩa, mặt tối"),
        "mo_ta": t._cat(f"Số kép {so} trong thần số học Chaldea ({k['bieu_tuong'].lower()}): ý nghĩa, mặt tối, rút gọn về số {goc}, cách biết tên mình mang số này."),
        "tra_loi_nhanh": tra_loi, "muc": muc, "hoi_dap": hoi_dap,
        "nguon": ["Hệ thần số Chaldea — Cheiro, Book of Numbers (1926), diễn đạt lại bằng lời mới"],
        "trang_thai": kb.get("trang_thai", "nhap_ai"),
        "lien_quan": [{"loai": "so_kep", "slug": f"so-kep-{ds[j % len(ds)]}"} for j in (i - 1, i + 1)],
        "minh_hoa": {"kieu": "so", "so": int(so), "so_cai": False, "so_goc": int(goc)},
    }


TRANG = {"so_kep": (ds_so_kep, trang_so_kep), "cap_so": (ds_cap_so, trang_cap_so), "nghe": (ds_nghe, trang_nghe), "tinh_yeu": (ds_tinh_yeu, trang_tinh_yeu),
         "nam_ca_nhan": (ds_nam_ca_nhan, trang_nam_ca_nhan), "no_nghiep": (ds_no_nghiep, trang_no_nghiep)}

TEN_NGAN = {
    "cap_so": lambda k: f"Số {k.split('-')[0]} và số {k.split('-')[1]}",
    "nghe": lambda s: f"Số {s} hợp nghề gì",
    "tinh_yeu": lambda s: f"Số {s} trong tình yêu",
    "nam_ca_nhan": lambda s: f"Năm cá nhân số {s}",
    "no_nghiep": lambda s: f"Nợ nghiệp {s}",
    "so_kep": lambda s: f"Số kép {s} (Chaldea)",
}
