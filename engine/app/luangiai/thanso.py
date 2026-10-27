# -*- coding: utf-8 -*-
"""Tầng RULES (3) + NARRATIVE (4) cho thần số — ghép luận từ KB.

Chuỗi: CALC (đã có) → chọn nghĩa từ KB theo độ nhạy → dựng văn.

Ba nguyên tắc bất di bất dịch:
  1. Chỉ ghép nội dung TỪ KB. Không có nghĩa trong KB thì im lặng, không bịa.
  2. Mỗi luận giải BẮT BUỘC kèm mặt tối + câu phản chứng (chống Barnum).
  3. Chỉ số KHÔNG xác định (độ nhạy ra nhiều giá trị) phải nói thẳng là chưa
     chốt được, KHÔNG chọn bừa một giá trị rồi luận như thật.

NARRATIVE ở đây là chế độ TEMPLATE (tất định, không LLM) — chạy được ngay không
cần OpenRouter. LLM chỉ là lớp tô điểm thêm về sau, và kể cả khi có LLM, nó chỉ
được diễn đạt lại các trường dưới đây, cấm thêm dữ kiện (CLAUDE.md tầng 4).
"""
from __future__ import annotations

import datetime

from app.calc import thanso, thanso_dong_doi, thanso_mo_rong as mr
from app.config import ENGINE_VERSION
from app.kb import store, thanso_v2 as kb2

VI_TRI_THU_TU = ["duong_doi", "su_menh", "linh_hon", "nhan_cach"]
SO_NAM_DU_BAO = 3   # năm cá nhân: hiện tại + 2 năm tới


def luan_chieu_sau(ngay: int, thang: int, nam_sinh: int,
                   nam_moc: int | None = None, quy_uoc: str = "tong_het") -> dict:
    """Chiều sâu: đỉnh cao (theo tuổi), thử thách chính, năm cá nhân sắp tới.

    Phép tính từ engine (tất định); nghĩa từ KB chiều sâu (có nguồn). Nếu KB
    chưa có nghĩa cho một giá trị → để None, tầng hiển thị im lặng, không bịa.
    """
    nam_moc = nam_moc or datetime.date.today().year
    dd = thanso.duong_doi(ngay, thang, nam_sinh, quy_uoc)

    dinh_cao = [
        {**p, "nghia": store.nghia_dinh_cao(p["so"])}
        for p in thanso.dinh_cao(ngay, thang, nam_sinh, dd)
    ]

    tt = thanso.thu_thach(ngay, thang, nam_sinh)
    thu_thach_chinh = {
        "so": tt["thu_thach_chinh"],
        "nghia": store.nghia_thu_thach(tt["thu_thach_chinh"]),
    }

    bang = thanso.chu_ky_9_nam(ngay, thang, nam_sinh, nam_moc,
                               nam_moc + SO_NAM_DU_BAO - 1)
    nam_ca_nhan = [
        {
            "nam": r["nam"],
            "tuoi": r["tuoi_that"],
            "so": r["moc_duong_lich"],
            "nghia": store.nghia_nam_ca_nhan(r["moc_duong_lich"]),
        }
        for r in bang
    ]

    return {
        "dinh_cao": dinh_cao,
        "thu_thach_chinh": thu_thach_chinh,
        "nam_ca_nhan": nam_ca_nhan,
        "dong_doi": luan_dong_doi(ngay, thang, nam_sinh, nam_moc, quy_uoc),
        "trich_nguon": store.trich_nguon_depth(),
        "cach_doc_chieu_sau": (
            "Đỉnh cao là mạch năng lượng chủ đạo của từng GIAI ĐOẠN đời (theo tuổi). "
            "Thử thách là bài học khó lặp lại. Năm cá nhân là nhịp của từng năm dương "
            "lịch. Tất cả là mẫu hình để ĐỐI CHIẾU với đời thực, không phải mệnh lệnh."
        ),
    }


NHAN_MOC = {"chuyen_dinh": "Sang giai đoạn đời mới — đỉnh số {so}",
            "khoi_chu_ky": "Mở chu kỳ 9 năm mới (năm cá nhân 1)",
            "khep_chu_ky": "Khép chu kỳ 9 năm (năm cá nhân 9)"}


def luan_dong_doi(ngay: int, thang: int, nam_sinh: int, nam_xem: int, quy_uoc: str = "tong_het") -> dict:
    """Trục đời: 4 giai đoạn (đỉnh + thử thách, có nghĩa) và các năm bước ngoặt theo nhịp số."""
    dd = thanso_dong_doi.dong_doi(ngay, thang, nam_sinh, nam_xem, quy_uoc=quy_uoc)
    return {
        **dd,
        "giai_doan": [{**g, "nghia": store.nghia_dinh_cao(g["so"]),
                       "nghia_thu_thach": store.nghia_thu_thach(g["thu_thach"])} for g in dd["giai_doan"]],
        "buoc_ngoat": [{**b, "nhan": NHAN_MOC[b["loai"]].format(so=b["so"])} for b in dd["buoc_ngoat"]],
        "cach_doc": ("Bước ngoặt ở đây là nhịp của con số — năm chuyển giai đoạn, năm mở và khép chu kỳ 9 năm. "
                     "Nhiều người thấy những năm này trùng với đổi việc, chuyển nhà, gắn bó hay chia tay; "
                     "hãy đối chiếu với chính đời bạn, đừng coi là lời báo trước."),
    }


def luan_mo_rong(ten: str, ngay: int, thang: int, nam: int,
                 ngay_xem: datetime.date | None = None, quy_uoc: str = "tong_het") -> dict:
    """Chỉ số v2 kèm nghĩa từ KB v2: biểu đồ ngày sinh, mũi tên, chỉ số phụ, nghiệp,
    tháng cá nhân. Thiếu nghĩa trong KB → None (tầng hiển thị im lặng)."""
    hn = ngay_xem or datetime.date.today()
    cs = mr.chi_so_mo_rong(ten, ngay, thang, nam, hn.year, hn.month, hn.day, quy_uoc)
    bd = cs["bieu_do"]
    return {
        "bieu_do": {
            "luoi": bd["luoi"],
            "so_thieu": bd["so_thieu"],
            "mui_ten": ([{"ma": m["ma"], "trong": False, **(kb2.nghia_mui_ten(m["ma"], False) or {})}
                         for m in bd["mui_ten_du"]] +
                        [{"ma": m["ma"], "trong": True, **(kb2.nghia_mui_ten(m["ma"], True) or {})}
                         for m in bd["mui_ten_trong"]]),
        },
        "so_ngay_sinh": {"so": cs["so_ngay_sinh"], "nghia": kb2.nghia_phu("ngay_sinh", ngay)},
        "so_thai_do": {"so": cs["so_thai_do"], "nghia": kb2.nghia_phu("thai_do", cs["so_thai_do"])},
        "so_truong_thanh": {"so": cs["so_truong_thanh"],
                            "nghia": kb2.nghia_phu("truong_thanh", cs["so_truong_thanh"])},
        "thang_ca_nhan": {"thang": hn.month, "nam": hn.year, "so": cs["thang_ca_nhan"],
                          "nghia": kb2.nghia_phu("thang_ca_nhan", cs["thang_ca_nhan"])},
        "no_nghiep": [{**n, "nghia": kb2.nghia_phu("no_nghiep", n["so"])} for n in cs["no_nghiep"]],
        "bai_hoc_nghiep": [{"so": s, "nghia": kb2.nghia_phu("bai_hoc_nghiep", s)}
                           for s in cs["bai_hoc_nghiep"]],
        "trich_nguon": kb2.meta_phu()["nguon"],
        "trang_thai": kb2.meta_phu()["trang_thai"],
    }


MAT_CHAN_DUNG = ("tong_quan", "tinh_cam", "cong_viec", "bien_co")


def _lop(nhan: str, so: int, khoi: str, truong: tuple[str, ...], so_truc: int) -> dict | None:
    m = kb2.nghia_linh_vuc(so, khoi)
    if not m:
        return None
    noi = " ".join(m[t] for t in truong if m.get(t))
    if so == so_truc:
        noi = "Trùng số Đường đời — nét này càng đậm. " + noi
    return {"nhan": nhan, "so": so, "noi_dung": noi}


def luan_chan_dung(chinh: dict[str, int], ngay: int, thang: int, nam: int) -> dict | None:
    """Chân dung 4 mặt: trục là Đường đời (KB chân dung), mỗi mặt thêm một lớp từ chỉ số khác
    (Linh hồn cho bên trong + tình cảm, Nhân cách cho vẻ ngoài, Sứ mệnh cho công việc,
    Thử thách chính cho biến cố) — để hai người cùng Đường đời vẫn ra chân dung khác nhau."""
    so = chinh["duong_doi"]
    cd = kb2.chan_dung(so)
    if cd is None:
        return None
    lh, nc, sm = chinh["linh_hon"], chinh["nhan_cach"], chinh["su_menh"]
    tt = thanso.thu_thach(ngay, thang, nam)["thu_thach_chinh"]
    ntt = store.nghia_thu_thach(tt)
    nnc = store.nghia_so(nc)
    lop = {
        "tong_quan": [_lop(f"Bên trong — Linh hồn {lh}", lh, "ban_than", ("xu_huong",), so),
                      {"nhan": f"Người ngoài thấy trước — Nhân cách {nc}", "so": nc,
                       "noi_dung": f"{nnc['tu_khoa']}. Mặt dễ bị hiểu lầm: {nnc['mat_toi'].lower()}."} if nnc else None],
        "tinh_cam": [_lop(f"Điều trái tim muốn — Linh hồn {lh}", lh, "tinh_yeu", ("xu_huong", "mat_toi"), so)],
        "cong_viec": [_lop(f"Hướng vun đắp — Sứ mệnh {sm}", sm, "su_nghiep", ("xu_huong", "goi_y"), so),
                      _lop(f"Với tiền bạc — Sứ mệnh {sm}", sm, "tai_chinh", ("xu_huong",), so)],
        "bien_co": [{"nhan": f"Bài học lặp lại — Thử thách chính {tt}", "so": tt,
                     "noi_dung": f"{ntt['mo_ta']}. {ntt['y_nghia']} Cách vượt: {ntt['cach_vuot']}"} if ntt else None],
    }
    ten = kb2.ten_mat_chan_dung()
    return {
        "so_truc": so,
        "mat": [{"ma": m, "ten": ten[m], **cd[m], "lop_them": [x for x in lop[m] if x]} for m in MAT_CHAN_DUNG],
        "cach_doc": ("Trục chân dung là số Đường đời; mỗi mặt có thêm một lớp từ con số khác của riêng bạn. "
                     "Đây là các xu hướng thường được mô tả — đọc để tự đối chiếu, chỗ nào không đúng với bạn thì bỏ qua."),
        "nguon": kb2._meta("chan_dung")["nguon"],
        "trang_thai": cd["trang_thai"],
    }


def _nghia_cua(gia_tri: int) -> dict | None:
    """Lấy nghĩa một số từ KB, kèm trích nguồn. None nếu KB chưa có."""
    m = store.nghia_so(gia_tri)
    if m is None:
        return None
    src = store.nguon(m["source_id"])
    return {
        "gia_tri": gia_tri,
        "tu_khoa": m["tu_khoa"],
        "mat_toi": m["mat_toi"],          # bắt buộc (chống Barnum)
        "phan_chung": m["phan_chung"],    # bắt buộc
        "so_cai": m["so_cai"],
        "trich_nguon": src["ten"] if src else m["source_id"],
    }


def _luan_mot_vi_tri(vi_tri: str, gia_tri_chinh: int,
                     gia_tri_khac: list[int]) -> dict:
    """Luận một vị trí: kết quả CHÍNH theo quy tắc Y khoá, kèm ghi chú độ nhạy."""
    khung = store.khung_vi_tri(vi_tri)
    on_dinh = not gia_tri_khac  # không có giá trị khác dưới quy ước khác

    ket = {
        "vi_tri": vi_tri,
        "ten": khung["ten"] if khung else vi_tri,
        "khung": khung["khung"] if khung else "",
        "gia_tri": gia_tri_chinh,
        "nghia": _nghia_cua(gia_tri_chinh),
        "on_dinh": on_dinh,
        "gia_tri_khac": gia_tri_khac,
    }
    if not on_dinh:
        ket["ghi_chu_do_nhay"] = (
            f"Nếu tính theo tên thường gọi, số này là {', '.join(map(str, gia_tri_khac))}. "
            "Hai tên cho hai con số là chuyện bình thường; bài đọc dùng tên khai sinh."
        )
    if ket["nghia"] is None:
        ket["ghi_chu_do_nhay"] = "Kho quy tắc chưa có nghĩa cho giá trị này."
    return ket


TEN_NGAN_VI_TRI = {"duong_doi": "Đường đời", "su_menh": "Sứ mệnh", "linh_hon": "Linh hồn", "nhan_cach": "Nhân cách"}


def _kiem_chung(vi_tri: str, so: int, chinh: dict) -> dict | None:
    """Thẻ kiểm chứng (thay "Tự soi"): 3 nét mạnh + 3 điểm mù thường gặp của số (kho chân dung), người dùng tự tích nét
    đúng với mình (đếm trên máy). Kết quả theo ngưỡng; chưa khớp thì gợi ý số khác CỦA CHÍNH HỌ có thể đang trội hơn."""
    cd = (kb2.chan_dung(so) or {}).get("tong_quan") if so else None
    if not cd:
        return None
    khac = next((f"{TEN_NGAN_VI_TRI[v]} {chinh[v]}" for v in VI_TRI_THU_TU
                 if v != vi_tri and chinh.get(v) and chinh[v] != so and kb2.chan_dung(chinh[v])), None)
    return {
        "cau_hoi": "Bạn thấy mình ở những nét nào dưới đây? Tích những điều đúng với bạn.",
        "net": [{"loai": "manh", "chu": x} for x in cd["diem_manh"][:3]] + [{"loai": "mu", "chu": x} for x in cd["diem_mu"][:3]],
        "nguong": {"khop": 4, "mot_phan": 2},
        "ket_qua": {
            "khop": f"Số {so} khá đúng với bạn. Hướng lớn của số này: {cd['huong_lon']}",
            "mot_phan": (f"Đúng một phần. Có thể một con số khác của bạn đang trội hơn ở mặt này — đọc thêm {khac}."
                         if khac else "Đúng một phần — nét của số này có mặt nhưng chưa phải nét chính của bạn."),
            "chua_khop": ("Chưa giống bạn. Không sao, con số không phải khuôn. Nếu bạn hay được gọi bằng tên khác, thử thêm "
                          "tên đó vào hồ sơ."),
        },
        "huong_lon": cd["huong_lon"],
        "khi_cang_thang": cd["khi_cang_thang"],
    }


# Tên hiển thị của hai cách tính Đường đời (khớp nhãn lựa chọn trên web, lib/quy-uoc-dd.ts) — chữ hiện ra giao diện
# không bao giờ mang mã "tong_het" / "tung_phan".
TEN_QUY_UOC_DD = {"tong_het": "Cộng hết chữ số", "tung_phan": "Rút gọn con số"}


def _tom_tat_ten(ho_ten: list[str], chinh: dict, theo_bien_the: list[dict]) -> str:
    """Một câu đời thường khi tên thường gọi ra số khác tên khai sinh, vd "Theo tên thường gọi “Lan”, số Sứ mệnh là 5
    (tên khai sinh ra 7). Bài đọc dùng tên khai sinh." Không lệch → ""."""
    cau = []
    for ten, c in zip(ho_ten[1:], theo_bien_the[1:]):
        lech = [f"số {TEN_NGAN_VI_TRI[v]} là {c[v]} (tên khai sinh ra {chinh[v]})" for v in VI_TRI_THU_TU if c[v] != chinh[v]]
        if lech:
            cau.append(f"Theo tên thường gọi “{ten}”, " + ", ".join(lech) + ".")
    return " ".join(cau) + " Bài đọc dùng tên khai sinh." if cau else ""


QUY_UOC_DD = {
    "tong_het": "Cộng một lượt mọi chữ số của ngày sinh. Nhiều trang thần số ở Việt Nam dùng cách này.",
    "tung_phan": "Cộng riêng ngày, tháng, năm cho gọn rồi mới cộng lại. Đây là cách của sách thần số phương Tây.",
}


def luan_giai(ho_ten: list[str], ngay: int, thang: int, nam: int, quy_uoc: str = "tong_het") -> dict:
    """Luận giải thần số — kết quả xác định (quy tắc Y khoá) + có nguồn + chống Barnum.

    `ho_ten[0]` là tên chính (dùng cho kết quả chính thức). Các biến thể còn lại
    chỉ dùng để tính độ nhạy (ghi chú), không đổi kết quả chính.
    """
    ten_chinh = ho_ten[0]
    chinh = thanso.chi_so_xac_dinh(ten_chinh, ngay, thang, nam, quy_uoc)

    # Độ nhạy THẬT: áp CHÍNH quy tắc khoá lên từng biến thể tên, xem có lệch không.
    # (Không dùng do_nhay vì nó gộp cả các quy ước mà quy tắc khoá đã quyết.)
    theo_bien_the = [
        thanso.chi_so_xac_dinh(t, ngay, thang, nam, quy_uoc) for t in ho_ten
    ]

    vet = thanso.vet_tinh(ten_chinh, ngay, thang, nam, quy_uoc)
    cac_vi_tri = []
    for vt in VI_TRI_THU_TU:
        gia_tri_chinh = chinh[vt]
        gia_tri_khac = sorted(
            {c[vt] for c in theo_bien_the if c[vt] != gia_tri_chinh}
        )
        cac_vi_tri.append({**_luan_mot_vi_tri(vt, gia_tri_chinh, gia_tri_khac),
                           "cach_tinh": vet[vt], "kiem_chung": _kiem_chung(vt, gia_tri_chinh, chinh)})

    th, tp = thanso.duong_doi(ngay, thang, nam, "tong_het"), thanso.duong_doi(ngay, thang, nam, "tung_phan")
    return {
        "engine_version": ENGINE_VERSION,
        "ngay_sinh": f"{ngay:02d}/{thang:02d}/{nam}",
        "ten_chinh": ten_chinh,
        "ten_bien_the_da_quet": ho_ten,
        # TS-V3: hai cách cộng Đường đời, người dùng chọn; luôn trả cả hai số để giao diện báo khi lệch.
        "quy_uoc_duong_doi": quy_uoc,
        "duong_doi_hai_cach": {"tong_het": th, "tung_phan": tp, "lech": th != tp},
        "giai_thich_quy_uoc": QUY_UOC_DD,
        "cac_vi_tri": cac_vi_tri,
        "chieu_sau": luan_chieu_sau(ngay, thang, nam, quy_uoc=quy_uoc),
        "mo_rong": luan_mo_rong(ten_chinh, ngay, thang, nam, quy_uoc=quy_uoc),
        "chan_dung": luan_chan_dung(chinh, ngay, thang, nam),
        # Chỉ lên tiếng khi tên thường gọi cho số khác tên khai sinh (không có gì lệch → chuỗi rỗng, giao diện không hiện).
        "tom_tat_do_tin": _tom_tat_ten(ho_ten, chinh, theo_bien_the),
        "cach_doc": (
            "Mỗi con số đi kèm MẶT TỐI và một CÂU PHẢN CHỨNG — câu hỏi để bạn "
            "tự kiểm: nếu không trả lời được 'điều gì chứng tỏ tôi KHÔNG phải "
            "số này', thì con số đó chưa nói gì về bạn cả."
        ),
        "trich_nguon_chung": (
            "Nội dung theo dòng Balliett→Jordan (thần số học Pythagoras hiện đại, "
            "Mỹ 1905–1965). Các mô tả khác nhau tuỳ tác giả — tham khảo văn hoá, "
            "không phải dự báo."
        ),
    }
