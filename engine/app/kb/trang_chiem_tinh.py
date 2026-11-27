# -*- coding: utf-8 -*-
"""CHT-1 — cụm trang kiến thức "12 cung hoàng đạo" `/chiem-tinh/cung-hoang-dao/{slug}`, loại `cung_hd`.

Tầng KB: chỉ ĐỌC + GHÉP. Dữ kiện TÍNH (giờ Mặt Trời vào / rời cung từng năm, ngày giáp ranh) lấy từ `calc.cung_hoang_dao`
(một bộ tính với tiết khí + bản đồ sao); nghĩa lấy từ KB `chiem_tinh_hanh_tinh_cung_kb.json` (tên, nguyên tố, nhóm, chủ tinh,
Mặt Trời × cung) và `chiem_tinh_cung_hoang_dao_kb.json` (điểm mạnh, điểm dễ vấp, tình yêu, công việc, việc nên làm).
Không phán số phận, không điểm hợp – khắc, không chẩn đoán. Nội dung không phụ thuộc ngày chạy (bảng năm cố định 1976–2035)
để sổ ngày cập nhật chỉ đổi khi chữ thật sự đổi.

EN-ALL: chữ khuôn qua `L()` (data/en/loi/trang_chiem_tinh.json), nghĩa qua bản phủ `data/en/…`. Bản Việt là gốc.
"""
from __future__ import annotations

from collections import Counter

from app import ngon_ngu
from app.calc import cung_hoang_dao as chd
from app.kb import nap
from app.kb.loi import L, danh_sach as _noi

DUONG_CONG_CU = "/chiem-tinh"
DUONG_CUM = "/chiem-tinh/cung-hoang-dao"        # = web lib/chuyen-huong.json chu_de["cung-hoang-dao"]
NAM_BANG = (1976, 2035)                          # cả hai miền cùng UTC+7 từ 13/06/1975 → một cột giờ
_BO_TRO = {"lua": "khi", "khi": "lua", "dat": "nuoc", "nuoc": "dat"}


def _t():
    from app.kb import trang
    return trang


@nap.nho
def _kb() -> dict:
    return nap.doc("chiem_tinh_cung_hoang_dao_kb.json")


@nap.nho
def _ht() -> dict:
    return nap.doc("chiem_tinh_hanh_tinh_cung_kb.json")


def _cung(ma: str) -> dict:
    return _ht()["cung_hoang_dao"][ma]


def _ten(ma: str) -> str:
    return _cung(ma)["ten"]


def _hanh_tinh(ma: str) -> str:
    return _ht()["hanh_tinh"][ma]["ten"]


@ngon_ngu.theo_viet
def ds_cung() -> list[tuple[str, str]]:
    t = _t()
    return [(ma, t._slug(_ht()["cung_hoang_dao"][ma]["ten"])) for ma in chd.CUNG]


def _slug_cua(ma: str) -> str:
    return dict(ds_cung())[ma]


_THANG_EN = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def _dm(md: tuple[int, int]) -> str:
    """(tháng, ngày) → "20/3" (bản Việt) / "Mar 20" (bản Anh)."""
    return f"{md[1]}/{md[0]}" if ngon_ngu.la_viet() else f"{_THANG_EN[md[0] - 1]} {md[1]}"


@nap.nho
def _nam_bang(ma: str) -> list[tuple[int, object, object]]:
    """[(năm, giờ vào cung VN, giờ rời cung VN)] cho các năm của bảng (giờ đồng hồ Việt Nam, miền Bắc = miền Nam)."""
    ra = []
    for nam in range(NAM_BANG[0], NAM_BANG[1] + 1):
        k = chd.khoang_cung(nam, ma)
        ra.append((nam, chd.gio_dia_phuong(k["bat_dau_utc"]), chd.gio_dia_phuong(k["ket_thuc_utc"])))
    return ra


def _pho_bien(c: Counter) -> tuple[int, int]:
    return max(c.items(), key=lambda x: (x[1], -x[0][0], -x[0][1]))[0]


def _ngay_thuong(ma: str) -> tuple[str, str]:
    """(ngày bắt đầu hay gặp nhất, ngày cuối hay gặp nhất) — ngày cuối = trước ngày cung sau hay bắt đầu một ngày."""
    import datetime as dt  # noqa: PLC0415
    rows = _nam_bang(ma)
    bd = _pho_bien(Counter((r[1].month, r[1].day) for r in rows))
    kt_md = _pho_bien(Counter((r[2].month, r[2].day) for r in rows))
    kt = dt.date(2001, kt_md[0], kt_md[1]) - dt.timedelta(days=1)
    return _dm(bd), _dm((kt.month, kt.day))


def khoang_thuong(ma: str) -> str:
    a, b = _ngay_thuong(ma)
    return f"{a}–{b}"


def _gio(t) -> str:
    return L("trang_ct.gio", "{dm} lúc {h}", dm=_dm((t.month, t.day)), h=t.strftime("%H:%M"))


def _giap_ranh(ma: str, ben: str) -> list[str]:
    """Câu cho từng ngày giáp ranh ở đầu (`ben`="dau") hoặc cuối cung: bao nhiêu năm cả ngày là cung nào, bao nhiêu năm đổi
    cung ngay trong ngày (khi đó phải xem giờ sinh)."""
    import datetime as dt  # noqa: PLC0415
    i = chd.CUNG.index(ma)
    rows = _nam_bang(ma)
    moc = [(r[1] if ben == "dau" else r[2]) for r in rows]
    truoc, sau = (chd.CUNG[(i - 1) % 12], ma) if ben == "dau" else (ma, chd.CUNG[(i + 1) % 12])
    ngay_moc = sorted({(m.month, m.day) for m in moc})
    n = len(moc)
    ra = []
    for md in ngay_moc:
        trong = sum(1 for m in moc if (m.month, m.day) == md)
        # năm mà mốc rơi TRƯỚC ngày này → cả ngày đã là cung sau; mốc rơi SAU → cả ngày vẫn là cung trước
        d0 = dt.date(2001, md[0], md[1])
        som = sum(1 for m in moc if dt.date(2001, m.month, m.day) < d0)
        muon = n - trong - som
        phan = [L("trang_ct.gr.trong", "{k} năm Mặt Trời sang {sau} ngay trong ngày (sinh trước giờ mốc là {truoc}, sau giờ mốc là {sau})",
                  k=trong, truoc=_ten(truoc), sau=_ten(sau))]
        if som:
            phan.append(L("trang_ct.gr.som", "{k} năm cả ngày đã là {sau}", k=som, sau=_ten(sau)))
        if muon:
            phan.append(L("trang_ct.gr.muon", "{k} năm cả ngày vẫn là {truoc}", k=muon, truoc=_ten(truoc)))
        ra.append(L("trang_ct.gr.cau", "Sinh ngày {ngay}: trong {n} năm {a}–{b}, {phan}.", ngay=_dm(md), n=n,
                    a=NAM_BANG[0], b=NAM_BANG[1], phan="; ".join(phan)))
    return ra


def _hop(ma: str) -> tuple[list[str], list[str]]:
    """(cung dễ đồng điệu: cùng nguyên tố + nguyên tố bổ trợ, cung dễ va: cùng nhóm khác nguyên tố) — luật phổ biến của
    chiêm tinh phương Tây, chỉ để gợi ý cách hiểu nhau, không chấm điểm."""
    nt, pc = _cung(ma)["nguyen_to"], _cung(ma)["pham_chat"]
    cd = _ht()["cung_hoang_dao"]
    doi = chd.CUNG[(chd.CUNG.index(ma) + 6) % 12]       # cung đối diện nói riêng (vừa bổ trợ nguyên tố vừa cùng nhóm)
    dong = [x for x in chd.CUNG if x not in (ma, doi) and cd[x]["nguyen_to"] in (nt, _BO_TRO[nt])]
    va = [x for x in chd.CUNG if x not in (ma, doi) and cd[x]["pham_chat"] == pc and cd[x]["nguyen_to"] != nt]
    return dong, va


def trang_cung(ma: str, slug: str) -> dict:
    t = _t()
    c, kb = _cung(ma), _kb()
    k = kb["cung"][ma]
    mt = _ht()["hanh_tinh"]["mat_troi"]["theo_cung"][ma]
    ten, i = c["ten"], chd.CUNG.index(ma)
    truoc, sau, doi = chd.CUNG[(i - 1) % 12], chd.CUNG[(i + 1) % 12], chd.CUNG[(i + 6) % 12]
    nt, pc = kb["nguyen_to"][c["nguyen_to"]], kb["pham_chat"][c["pham_chat"]]
    chu = _hanh_tinh(c["chu_tinh"])
    chu_hd = k.get("chu_tinh_hien_dai")
    bd, kt = _ngay_thuong(ma)
    rows = _nam_bang(ma)
    cung_nt = [x for x in chd.CUNG if x != ma and _cung(x)["nguyen_to"] == c["nguyen_to"]]
    som = min(rows, key=lambda r: (r[1].month, r[1].day, r[1].hour, r[1].minute))
    muon = max(rows, key=lambda r: (r[1].month, r[1].day, r[1].hour, r[1].minute))

    tra_loi = L("trang_ct.tra_loi",
                "Cung {ten} ({en}) là cung thứ {so} của vòng hoàng đạo, dành cho người sinh khoảng {bd} đến {kt}. Ngày đổi cung "
                "xê dịch theo năm: từ {a} đến {b}, Mặt Trời vào {ten} sớm nhất {som} ({nam_som}) và muộn nhất {muon} ({nam_muon}), "
                "giờ Việt Nam. {ten} thuộc nguyên tố {nt}, nhóm {pc}, chủ tinh {chu}. {tom}",
                ten=ten, en=k["ten_en"], so=i + 1, bd=bd, kt=kt, a=NAM_BANG[0], b=NAM_BANG[1], som=_gio(som[1]), nam_som=som[0],
                muon=_gio(muon[1]), nam_muon=muon[0], nt=nt["ten"], pc=pc["ten"], chu=chu, tom=c["tom_tat"])
    muc = []
    muc.append({"tieu_de": L("trang_ct.td.ngay", "Cung {ten} từ ngày nào đến ngày nào?", ten=ten),
                "doan": L("trang_ct.ngay", "Cung hoàng đạo theo ngày sinh là cung Mặt Trời đang đi qua lúc bạn sinh. Mặt Trời vào {ten} "
                          "khi tới {do}° trên hoàng đạo và rời {ten} khi sang {sau} ở {do2}°. Vì một năm dương lịch dài hơn 365 ngày một "
                          "chút và năm nhuận chen vào, mốc này trôi qua lại trong vài giờ, có năm sang hẳn ngày bên cạnh. Bảng dưới ghi giờ "
                          "đồng hồ Việt Nam (UTC+7) của từng năm.", ten=ten, sau=_ten(sau), do=i * 30, do2=(i + 1) * 30 % 360),
                "bang": {"cot": [L("trang_ct.cot.nam", "Năm"), L("trang_ct.cot.vao", "Mặt Trời vào {ten}", ten=ten),
                                 L("trang_ct.cot.roi", "Sang {sau}", sau=_ten(sau))],
                         "dong": [[str(r[0]), _gio(r[1]), _gio(r[2])] for r in rows]}})
    muc.append({"tieu_de": L("trang_ct.td.giap_ranh", "Sinh ngày giáp ranh: {ten} hay {truoc}, {ten} hay {sau}?", ten=ten,
                             truoc=_ten(truoc), sau=_ten(sau)),
                "doan": L("trang_ct.giap_ranh", "Sinh đúng ngày đổi cung thì phải có giờ sinh mới biết chắc. Tra năm sinh của bạn trong "
                          "bảng trên: sinh trước giờ ghi trong bảng là cung trước, sau giờ đó là cung sau. Sinh trước năm 1976 thì dùng ô "
                          "tra theo ngày sinh ở trang 12 cung hoàng đạo: ô này tính theo giờ đồng hồ thời ấy (có những giai "
                          "đoạn đồng hồ miền Nam chạy UTC+8, nhanh hơn bây giờ một giờ, như 1960–1975)."),
                "danh_sach": _giap_ranh(ma, "dau") + _giap_ranh(ma, "cuoi")})
    dong_nt = L("trang_ct.nt", "Nguyên tố {nt}: {y}. Cùng nguyên tố với {ds}.", nt=nt["ten"], y=nt["y"], ds=_noi([_ten(x) for x in cung_nt]))
    ds3 = [dong_nt,
           L("trang_ct.pc", "Nhóm {pc}: {y}.", pc=pc["ten"], y=pc["y"]),
           (L("trang_ct.chu2", "Chủ tinh: {chu} theo lối cổ điển; lối hiện đại gán thêm {hd}.", chu=chu, hd=_hanh_tinh(chu_hd))
            if chu_hd else L("trang_ct.chu", "Chủ tinh: {chu}.", chu=chu)),
           L("trang_ct.hinh", "Hình tượng: {h}, ký hiệu {kh}.", h=k["hinh_tuong"], kh=c["ky_hieu"]),
           L("trang_ct.doi", "Cung đối diện: {doi} — hai cung nằm hai đầu vòng hoàng đạo, nhìn cùng một chuyện từ hai phía.", doi=_ten(doi))]
    muc.append({"tieu_de": L("trang_ct.td.nt", "Cung {ten} thuộc nguyên tố gì, chủ tinh là gì?", ten=ten), "danh_sach": ds3})
    muc.append({"tieu_de": L("trang_ct.td.manh", "Điểm mạnh của người cung {ten}", ten=ten),
                "danh_sach": [mt["diem_sang"], *k["diem_manh"]]})
    muc.append({"tieu_de": L("trang_ct.td.mu", "Điểm dễ vấp của người cung {ten}", ten=ten),
                "danh_sach": [mt["nen_de_y"], *k["diem_mu"]]})
    dong, va = _hop(ma)
    muc.append({"tieu_de": L("trang_ct.td.yeu", "Cung {ten} trong tình yêu", ten=ten),
                "doan": k["tinh_yeu"],
                "danh_sach": [L("trang_ct.dong", "Dễ đồng điệu: {ds} — cùng nguyên tố hoặc nguyên tố bổ trợ, hay hiểu nhịp của nhau.",
                                ds=_noi([_ten(x) for x in dong])),
                              L("trang_ct.va", "Dễ va hơn: {ds} — cùng nhóm {pc} nhưng khác nguyên tố, cần thoả thuận nhiều hơn; "
                                "không có nghĩa là không hợp.", ds=_noi([_ten(x) for x in va]), pc=pc["ten"].lower()),
                              L("trang_ct.doi_yeu", "Cung đối diện {doi}: hay hút nhau vì mỗi bên có cái bên kia thiếu, cũng hay giằng co "
                                "vì nhìn ngược hướng — hợp khi cả hai chịu học cách của nhau.", doi=_ten(doi))]})
    muc.append({"tieu_de": L("trang_ct.td.viec", "Cung {ten} trong công việc và tiền bạc", ten=ten),
                "doan": f"{k['cong_viec']} {k['tien_bac']}",
                "danh_sach": [L("trang_ct.nghe", "Lĩnh vực hay hợp: {ds}.", ds="; ".join(k["nghe"]))]})
    muc.append({"tieu_de": L("trang_ct.td.lam", "Việc nên làm cho người cung {ten}", ten=ten),
                "danh_sach": [mt["viec_ung_dung"], *k["viec"], L("trang_ct.tu_soi", "Câu tự hỏi: {c}", c=k["tu_soi"])]})
    muc.append({"tieu_de": L("trang_ct.td.mot_phan", "Cung {ten} chỉ là một phần của bản đồ sao", ten=ten),
                "doan": L("trang_ct.mot_phan", "Cung theo ngày sinh mới nói về Mặt Trời — điều bạn hướng tới. Hai người cùng cung {ten} vẫn có "
                          "thể khác nhau nhiều vì Mặt Trăng (nhu cầu cảm xúc), Cung Mọc (cách người khác thấy bạn lúc đầu) và các hành tinh "
                          "khác nằm ở cung khác. Muốn xem đủ, lập bản đồ sao theo ngày, giờ và nơi sinh.", ten=ten)})
    hoi_dap = [
        {"hoi": L("trang_ct.hd.ngay", "Sinh ngày nào là cung {ten}?", ten=ten),
         "dap": L("trang_ct.hd.ngay_dap", "Khoảng {bd} đến {kt}. Mốc chính xác đổi theo năm vài giờ; sinh đúng ngày đổi cung thì cần giờ "
                  "sinh và tra bảng theo năm trên trang này.", bd=bd, kt=kt)},
        {"hoi": L("trang_ct.hd.hop", "Cung {ten} hợp với cung nào?", ten=ten),
         "dap": L("trang_ct.hd.hop_dap", "Theo cách hiểu phổ biến, {ten} dễ đồng điệu với {ds}. Đây là gợi ý về nhịp tính cách, không "
                  "phải điểm hợp – không hợp; hai người vẫn cần nói chuyện và thoả thuận.", ten=ten, ds=_noi([_ten(x) for x in dong]))},
        {"hoi": L("trang_ct.hd.chu", "Chủ tinh của cung {ten} là gì?", ten=ten),
         "dap": (L("trang_ct.hd.chu_dap2", "{chu} theo lối cổ điển, {hd} theo lối hiện đại.", chu=chu, hd=_hanh_tinh(chu_hd))
                 if chu_hd else L("trang_ct.hd.chu_dap", "{chu}.", chu=chu))},
        {"hoi": L("trang_ct.hd.nt", "Cung {ten} thuộc nguyên tố gì?", ten=ten),
         "dap": L("trang_ct.hd.nt_dap", "Nguyên tố {nt} ({y}), nhóm {pc}.", nt=nt["ten"], y=nt["y"], pc=pc["ten"])},
    ]
    mo_ta = t._cat(L("trang_ct.mo_ta", "Cung {ten} ({bd}–{kt}): giờ Mặt Trời vào cung từng năm {a}–{b}, sinh ngày giáp ranh là cung gì, "
                     "tính cách, tình yêu, công việc.", ten=ten, bd=bd, kt=kt, a=NAM_BANG[0], b=NAM_BANG[1]))
    tieu_de = L("trang_ct.tieu_de", "Cung {ten} ({bd}–{kt}): tính cách, tình yêu, công việc", ten=ten, bd=bd, kt=kt)
    y_chinh = [L("trang_ct.yc.ngay", "{ten}: sinh khoảng {bd}–{kt}", ten=ten, bd=bd, kt=kt),
               L("trang_ct.yc.nt", "Nguyên tố {nt}, nhóm {pc}, chủ tinh {chu}", nt=nt["ten"], pc=pc["ten"], chu=chu),
               k["diem_manh"][0], L("trang_ct.yc.mu", "Nên để ý: {x}", x=k["diem_mu"][0][:1].lower() + k["diem_mu"][0][1:])]
    return {"loai": "cung_hd", "slug": slug, "tieu_de": tieu_de, "mo_ta": mo_ta, "tra_loi_nhanh": tra_loi,
            "muc": muc, "hoi_dap": hoi_dap, "y_chinh": y_chinh,
            "lien_quan": [{"loai": "cung_hd", "slug": _slug_cua(x)} for x in dict.fromkeys((truoc, sau, doi))],
            "lien_ket_ngoai": [{"duong": DUONG_CONG_CU, "ten": L("trang_ct.lk", "Lập bản đồ sao của bạn")}],
            "minh_hoa": {"kieu": "cung_hd", "ma": ma, "so": i + 1, "ten": ten, "ky_hieu": c["ky_hieu"], "nguyen_to": c["nguyen_to"]},
            "trang_thai": "nhap_ai",
            "nguon": [L("trang_ct.nguon1", "Ban biên tập Hiểu Bản Thân — cung Mặt Trời trong chiêm tinh phương Tây, theo cách hiểu phổ biến"),
                      L("trang_ct.nguon2", "Giờ Mặt Trời vào cung: lịch thiên văn tất định của Hiểu Bản Thân, đổi sang giờ đồng hồ Việt Nam")]}


TRANG = {"cung_hd": (ds_cung, trang_cung)}
TEN_NGAN = {"cung_hd": lambda ma: L("trang_ct.ten_ngan", "Cung {ten}", ten=_ten(ma)) if ma in chd.CUNG else ma}
