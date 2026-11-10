# -*- coding: utf-8 -*-
"""EN-ALL giai đoạn 0 — bộ LƯỢT GỌI CỐ ĐỊNH phủ mọi route engine người dùng cuối, dùng chung cho:

- `scripts/chup_dau_ra.py` → ghi `fixtures/golden/dau_ra_vi/` (băm sha256 từng phản hồi + mẫu nguyên văn);
- `tests/test_dau_ra_vi_bat_bien.py` → bản tiếng Việt KHÔNG đổi một byte sau mỗi giai đoạn chuyển thể tiếng Anh;
- `tests/test_dau_ra_en.py` → cùng lượt gọi với `x-ngon-ngu: en`: không còn chữ Việt, không `{slot}` sót, và các
  dữ kiện (mã kiểm chứng, mức, số) giống hệt bản Việt.

Thời gian được ĐÓNG BĂNG (`dong_bang()`): mọi `datetime.now()` / `date.today()` trong `app.*` trả mốc `LUC`, để route
không nhận `ngay_xem` cũng cho kết quả lặp lại. Không gọi AI (xoá khoá trong lúc chụp), không gieo ngẫu nhiên (quẻ gieo
tay, bài xáo theo hạt giống). Thêm route mới → thêm lượt gọi ở đây rồi chạy lại script (golden cũ không đổi, chỉ thêm).
"""
from __future__ import annotations

import contextlib
import datetime as _dt
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterator

GOC = Path(__file__).resolve().parents[1]
THU_MUC = GOC / "fixtures" / "golden" / "dau_ra_vi"
CAU_HOI = GOC / "fixtures" / "cau_hoi"
XEM = "2026-11-10"
LUC = _dt.datetime(2026, 11, 10, 9, 30, 0)          # giờ Việt Nam
_VN = _dt.timezone(_dt.timedelta(hours=7))


# ------------------------------------------------------------------ đóng băng thời gian
class _MetaDT(type(_dt.datetime)):
    def __instancecheck__(cls, x):  # datetime thật (pydantic tạo) vẫn là "datetime" với mã đang dùng lớp đóng băng
        return isinstance(x, _dt.datetime)


class _DT(_dt.datetime, metaclass=_MetaDT):
    @classmethod
    def now(cls, tz=None):
        co_mui = LUC.replace(tzinfo=_VN)
        return LUC if tz is None else co_mui.astimezone(tz)

    @classmethod
    def utcnow(cls):
        return LUC - _dt.timedelta(hours=7)

    @classmethod
    def today(cls):
        return LUC


class _MetaD(type(_dt.date)):
    def __instancecheck__(cls, x):
        return isinstance(x, _dt.date)


class _D(_dt.date, metaclass=_MetaD):
    @classmethod
    def today(cls):
        return LUC.date()


class _ModDT:
    """Thay cho module `datetime` trong không gian tên của module `app.*` (import datetime as dt)."""
    datetime = _DT
    date = _D

    def __getattr__(self, ten):
        return getattr(_dt, ten)


@contextlib.contextmanager
def dong_bang() -> Iterator[None]:
    """Đóng băng đồng hồ cho mọi module `app.*` đã nạp; trả lại nguyên trạng khi ra."""
    gia = _ModDT()
    da_doi: list[tuple[Any, str, Any]] = []
    for ten, mod in list(sys.modules.items()):
        if not (ten == "app" or ten.startswith("app.")) or mod is None:
            continue
        for k, v in list(vars(mod).items()):
            moi = gia if v is _dt else _DT if v is _dt.datetime else _D if v is _dt.date else None
            if moi is not None:
                da_doi.append((mod, k, v))
                setattr(mod, k, moi)
    khoa_cu = {k: os.environ.pop(k, None) for k in ("OPENROUTER_API_KEY", "NHAN_TUONG_DOC_ANH")}
    try:
        yield
    finally:
        for mod, k, v in da_doi:
            setattr(mod, k, v)
        for k, v in khoa_cu.items():
            if v is not None:
                os.environ[k] = v


# ------------------------------------------------------------------ hồ sơ cố định (~40)
def _ls(ngay: str, gio: str, gt: str, **kw) -> dict:
    return {"birth_date": ngay, "birth_time": gio, "gender": gt, **kw}


HO_SO: list[dict] = [
    # (tên, lá số) — nam/nữ, có/không giờ, 23:xx, tháng nhuận, miền Nam 1960–75, nước ngoài, Nam bán cầu, <18, >60
    {"ten": ["Nguyễn Đức Luân"], "ls": _ls("1988-10-24", "08:30", "nam", noi_sinh="ha-noi")},
    {"ten": ["Trần Thị Mai", "Mai"], "ls": _ls("1990-05-17", "12:10", "nu", noi_sinh="tp-ho-chi-minh")},
    {"ten": ["Lê Văn An"], "ls": _ls("1975-03-09", "22:15", "nam", noi_sinh="da-nang")},
    {"ten": ["Phạm Thu Hà"], "ls": _ls("2001-12-31", "00:20", "nu", noi_sinh="hai-phong")},
    {"ten": ["Hoàng Minh Quân"], "ls": _ls("1960-07-07", "05:45", "nam", vung="south")},
    {"ten": ["Đỗ Thị Lan"], "ls": _ls("1993-02-28", "23:30", "nu", noi_sinh="ha-noi")},                      # Tý muộn
    {"ten": ["Vũ Đình Khôi"], "ls": _ls("1984-01-30", "23:05", "nam", vung="north", gio_ty="sang_ngay")},
    {"ten": ["Bùi Ngọc Ánh"], "ls": _ls("1968-02-15", "07:00", "nu", vung="south")},                         # miền Nam 1960–75
    {"ten": ["Đặng Văn Tám"], "ls": _ls("1972-11-03", "15:40", "nam", vung="south", lich="trung")},
    {"ten": ["Ngô Thị Bích"], "ls": _ls("1950-06-20", "10:00", "nu", vung="south")},                         # UTC+8 1947–55
    {"ten": ["Dương Quốc Bảo"], "ls": _ls("1995-08-08", "12:00", "nam", do_tin_gio="unknown", noi_sinh="can-tho")},
    {"ten": ["Lý Hải Yến"], "ls": _ls("1987-06-06", "09:00", "nu", do_tin_gio="approx", noi_sinh="nghe-an")},
    {"ten": ["Trịnh Gia Huy"], "ls": _ls("2012-04-21", "14:25", "nam", noi_sinh="ha-noi")},                  # < 18
    {"ten": ["Mai Khánh Linh"], "ls": _ls("2015-09-02", "06:10", "nu", noi_sinh="tp-ho-chi-minh")},          # < 18
    {"ten": ["Cao Bá Thịnh"], "ls": _ls("1948-12-12", "03:30", "nam", vung="north")},                        # > 60
    {"ten": ["Tạ Thị Sáu"], "ls": _ls("1957-01-25", "19:50", "nu", vung="north")},                           # > 60
    {"ten": ["Kevin Nguyen"], "ls": _ls("1992-03-15", "07:20", "nam", vung="abroad", noi_sinh="nuoc_ngoai", mui_gio="us-san_jose")},
    {"ten": ["Anna Tran"], "ls": _ls("1989-07-04", "16:45", "nu", vung="abroad", noi_sinh="nuoc_ngoai", mui_gio="us-los_angeles")},
    {"ten": ["Sophie Le"], "ls": _ls("1996-01-10", "11:15", "nu", vung="abroad", noi_sinh="nuoc_ngoai", mui_gio="au-sydney")},  # Nam bán cầu
    {"ten": ["Liam Pham"], "ls": _ls("1983-12-25", "21:05", "nam", vung="abroad", noi_sinh="nuoc_ngoai", mui_gio="au-sydney",
                                    dieu_hau="noi_sinh", gio_sinh="mat_troi")},
    {"ten": ["Emma O'Brien"], "ls": _ls("1991-10-31", "04:40", "nu", vung="abroad", noi_sinh="nuoc_ngoai", utc_noi_sinh=0.0)},
    {"ten": ["Wei Tan"], "ls": _ls("1979-08-18", "13:00", "nam", vung="abroad", noi_sinh="nuoc_ngoai", utc_noi_sinh=8.0, lich="trung")},
    {"ten": ["Nguyễn Thị Nhuận"], "ls": _ls("1995-08-20", "10:30", "nu", calendar_type="am", am_nhuan=True, noi_sinh="ha-noi")},  # nhuận 8 Ất Hợi
    {"ten": ["Phan Văn Nhuận"], "ls": _ls("2004-02-25", "18:00", "nam", calendar_type="am", am_nhuan=True, noi_sinh="ha-noi",
                                         thang_nhuan="thang_chinh")},
    {"ten": ["Hồ Thị Giêng"], "ls": _ls("1986-01-01", "02:00", "nu", calendar_type="am", noi_sinh="quang-nam")},
    {"ten": ["Đinh Công Tráng"], "ls": _ls("1999-12-29", "23:59", "nam", calendar_type="am", noi_sinh="thanh-hoa")},
    {"ten": ["Lâm Mỹ Duyên"], "ls": _ls("1985-02-08", "06:30", "nu", vung="south", hoa_linh="trung")},
    {"ten": ["Tô Vĩnh Phúc"], "ls": _ls("1978-02-04", "17:10", "nam", vung="north", luu_nguyet="tieu_han")},   # sát Lập xuân
    {"ten": ["Châu Kim Ngân"], "ls": _ls("2000-02-05", "08:08", "nu", vung="south", tinh_trang="doc_than")},
    {"ten": ["Quách Tuấn Kiệt"], "ls": _ls("1982-09-09", "20:20", "nam", vung="north", tinh_trang="co_doi")},
    {"ten": ["Thái Bảo Trâm"], "ls": _ls("1997-07-17", "01:10", "nu", vung="north", gio_mua_he=False)},
    {"ten": ["Kiều Anh Dũng"], "ls": _ls("1966-04-04", "12:30", "nam", vung="north")},
    {"ten": ["La Thị Hồng"], "ls": _ls("1970-10-10", "09:45", "nu", vung="south", lich="trung")},
    {"ten": ["Mạc Đăng Khoa"], "ls": _ls("2008-08-08", "08:08", "nam", vung="north")},
    {"ten": ["Ông Thị Út"], "ls": _ls("1944-05-05", "05:05", "nu", vung="south")},
    {"ten": ["Giang Hoài Nam"], "ls": _ls("1994-11-11", "11:11", "nam", vung="south", gio_sinh="mat_troi", noi_sinh="ca-mau")},
    {"ten": ["An"], "ls": _ls("1998-06-30", "15:00", "nu", vung="north")},                                   # tên một từ
    {"ten": ["Nguyen Van Binh"], "ls": _ls("1981-03-03", "03:03", "nam", vung="north")},                     # không dấu
    {"ten": ["Đoàn Thị Điểm"], "ls": _ls("1973-01-23", "13:30", "nu", vung="north", truong_phai="vvt")},
    {"ten": ["Yên Thế Phong"], "ls": _ls("2003-03-21", "22:50", "nam", vung="north", che_do="tptc")},
]
assert len(HO_SO) == 40


def _dmy(h: dict) -> dict:
    """Ngày sinh DƯƠNG của hồ sơ cho route thần số (hồ sơ nhập âm lịch → dùng nguyên con số, route chỉ cần số hợp lệ)."""
    y, m, d = (int(x) for x in h["ls"]["birth_date"].split("-"))
    d = min(d, 28) if h["ls"].get("calendar_type") == "am" else d
    return {"ngay": d, "thang": m, "nam": y}


def _ts(h: dict, **kw) -> dict:
    return {"ho_ten": h["ten"], **_dmy(h), **kw}


def _sinh(h: dict, **kw) -> dict:
    d = _dmy(h)
    return {"birth_date": f"{d['nam']:04d}-{d['thang']:02d}-{d['ngay']:02d}", "gender": h["ls"]["gender"], **kw}


# ------------------------------------------------------------------ dữ liệu phụ cố định
TL_DAY = {"khuon_mat": "vuong", "tam_dinh": "can_doi", "sac_tong": "hong_nhuan", "tran": "rong_cao", "long_may": "dai_qua_mat",
          "an_duong": "rong_sang", "mat_than": "sang_dinh", "son_can": "cao_thang", "chuan_dau": "tron_day", "luong_quyen": "day_co_thit",
          "mieng": "khoe_len", "cam": "day_tron", "tai": "day_dai"}
CELTIC = [{"id": "dai_0"}, {"id": "gay_5", "nguoc": True}, {"id": "coc_2"}, {"id": "kiem_10"}, {"id": "dai_19"}, {"id": "tien_4"},
          {"id": "dai_13", "nguoc": True}, {"id": "gay_2"}, {"id": "coc_9"}, {"id": "dai_21"}]
BA_LA = [{"id": "dai_9"}, {"id": "kiem_3", "nguoc": True}, {"id": "tien_10"}]
HAO = ([7, 7, 8, 7, 7, 9], [6, 8, 7, 8, 8, 7], [9, 9, 9, 7, 7, 7], [8, 8, 8, 8, 8, 8], [7, 9, 8, 6, 7, 8])
BO_CUC = {"phien_ban": "0.2", "loai_nha": "nha_pho", "huong_nha_do": 180.0,
          "vi_tri": {"cua_chinh": "Nam", "phong_ngu_chinh": "Tây Nam", "bep": "Đông", "ve_sinh": "Trung cung", "ban_tho": "Bắc"},
          "dau_hieu": {"duong_dam": {"co": True}, "xa_ngang": {"co": True}, "wc_giua_nha": {"co": True}, "be_ca": {"co": True}}}
BO_CUC_HO = {"phien_ban": "0.2", "loai_nha": "can_ho", "huong_nha": "Đông Nam",
             "mat_bang": {"luoi": ["111100", "111100", "111111", "111111", "111111", "111111"],
                          "phong": {"phong_ngu_chinh": [0, 0], "bep": [0, 3], "ve_sinh": [2, 3], "cua_chinh": [5, 2], "phong_lam_viec": [3, 0]},
                          "ban_cong": [0, 2]}}
CAU_KD = "Tôi có nên chuyển việc sang công ty mới không?"
THOI_DIEM = "2026-11-10T09:30:00"


def _doc_jsonl(ten: str) -> list[dict]:
    p = CAU_HOI / ten
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()] if p.exists() else []


def _cau_theo_mo_dun() -> dict[str, list[tuple[str, str]]]:
    """(mã, câu) theo mô-đun từ MỌI kho câu hỏi có nhãn hiện có."""
    ra: dict[str, list[tuple[str, str]]] = {k: [] for k in ("thanso", "tuvi", "battu", "phongthuy", "kinhdich")}
    for i, d in enumerate(_doc_jsonl("thanso_cau_hoi.jsonl")):
        ra["thanso"].append((d.get("id") or f"ts{i}", d["cau_hoi"]))
    for tep in ("huyenhoc_cau_hoi.jsonl", "holdout_v2.jsonl", "dev_en3.jsonl", "dev_en3c.jsonl", "dev_en3d.jsonl", "holdout_mt_ds.jsonl"):
        goc = tep.split(".")[0]
        for i, d in enumerate(_doc_jsonl(tep)):
            m = {"than_so": "thanso", "tu_vi": "tuvi", "bat_tu": "battu", "phong_thuy": "phongthuy", "kinh_dich": "kinhdich"}.get(d.get("mo_dun"), d.get("mo_dun"))
            if m in ra:
                ra[m].append((f"{goc}.{d.get('id') or i}", d["cau_hoi"]))
    for tep in ("an_toan_v1.json", "an_toan_sk1.json"):
        d = json.loads((CAU_HOI / tep).read_text(encoding="utf-8"))
        for nhom, ds in d.items():
            if nhom.startswith("_") or not isinstance(ds, list):
                continue
            for i, c in enumerate(ds):
                cau = c if isinstance(c, str) else c.get("cau_hoi") or c.get("cau") or ""
                if cau:
                    for m in ra:
                        ra[m].append((f"{tep.split('.')[0]}.{nhom}.{i}", cau))
    return ra


# ------------------------------------------------------------------ danh sách lượt gọi
Luot = tuple[str, str, str, Any]     # (mã, phương thức, đường dẫn, thân JSON | None)


def luot_goi(client=None) -> list[Luot]:
    """Mọi lượt gọi. `client` (TestClient) dùng để đọc mục lục KB / danh mục rồi sinh lượt gọi từng trang."""
    ra: list[Luot] = []
    g = lambda ma, duong: ra.append((ma, "GET", duong, None))          # noqa: E731
    p = lambda ma, duong, than: ra.append((ma, "POST", duong, than))   # noqa: E731

    # ---- theo hồ sơ
    for i, h in enumerate(HO_SO):
        k, ls, d = f"hs{i:02d}", h["ls"], _dmy(h)
        gio_co = ls.get("do_tin_gio") != "unknown"
        # Thần số
        for qu in ("tong_het", "tung_phan"):
            p(f"thanso.luan_giai.{qu}.{k}", "/v1/thanso/luan-giai", _ts(h, quy_uoc_duong_doi=qu))
        p(f"thanso.chaldea.{k}", "/v1/thanso/chaldea", _ts(h))
        p(f"thanso.do_nhay.{k}", "/v1/thanso/do-nhay", _ts(h))
        p(f"thanso.ban_do.{k}", "/v1/thanso/ban-do-con-so", _ts(h, ngay_xem=XEM, quy_uoc_duong_doi="tung_phan"))
        p(f"thanso.tong_hop.{k}", "/v1/thanso/tong-hop", _ts(h, ngay_xem=XEM))
        p(f"thanso.noi_dau.{k}", "/v1/thanso/noi-dau", _ts(h, ngay_xem=XEM))
        p(f"thanso.the_ngay.{k}", "/v1/thanso/the-ngay", _ts(h, ngay_xem=XEM))
        p(f"thanso.ba_goc_nhin.{k}", "/v1/thanso/ba-goc-nhin", _ts(h, linh_vuc=("tinh_yeu", "su_nghiep", None)[i % 3]))
        p(f"thanso.chu_ky_so.{k}", "/v1/thanso/chu-ky-so", _ts(h, phai=("pitago", "chaldea", "tong_hop")[i % 3]))
        p(f"thanso.nhip.{k}", "/v1/thanso/nhip", {**d, "ngay_xem": XEM})
        p(f"thanso.hom_nay.{k}", "/v1/thanso/hom-nay", {**d, "ngay_xem": XEM, "y_dinh": ["cong_viec", "tinh_cam"][: i % 3]})
        p(f"thanso.chu_ky.{k}", "/v1/thanso/chu-ky", {**d, "tu_nam": 2024, "den_nam": 2030})
        # BT-UI đợt 2–3 (main #248–#249): tuần này của bạn, hôm nay của hai người
        p(f"thanso.tuan.{k}", "/v1/thanso/tuan", {**d, "ngay_xem": XEM, "gioi_tinh": ls["gender"]})
        kia0 = _dmy(HO_SO[(i + 7) % len(HO_SO)])
        p(f"thanso.hom_nay_hai.{k}", "/v1/thanso/hom-nay-hai", {"ngay": d["ngay"], "thang": d["thang"], "kia_ngay": kia0["ngay"], "kia_thang": kia0["thang"],
                                                                 "kia_nam": kia0["nam"], "ngay_xem": XEM})
        p(f"thanso.doi_chieu_nam.{k}", "/v1/thanso/doi-chieu-nam", {**d, "cac_nam": [2015, 2020, 2024]})
        kia = HO_SO[(i + 7) % len(HO_SO)]
        qh = ("nguoi_yeu", "ban_be", "dong_nghiep", "sep", "gia_dinh")[i % 5]
        p(f"thanso.hop_doi.{k}", "/v1/thanso/hop-doi", {"a": {"ho_ten": h["ten"], **d}, "b": {"ho_ten": kia["ten"], **_dmy(kia)},
                                                           "quan_he": qh, "quy_uoc_duong_doi": "tung_phan"})
        # Tử vi + Bát tự (cần lá số)
        p(f"tuvi.an_sao.{k}", "/v1/tuvi/an-sao", ls)
        p(f"tuvi.tuan_triet.{k}", "/v1/tuvi/tuan-triet", ls)
        p(f"battu.la_so.{k}", "/v1/battu/la-so", ls)
        p(f"tuvi.luan_giai.{k}", "/v1/tuvi/luan-giai", {"la_so": ls, "ngay_xem": XEM})
        p(f"battu.luan_giai.{k}", "/v1/battu/luan-giai", {"la_so": ls, "ngay_xem": XEM})
        p(f"tuvi.van_han.{k}", "/v1/tuvi/van-han", {"la_so": ls, "ngay_xem": XEM})
        p(f"tuvi.luu_nguyet.{k}", "/v1/tuvi/luu-nguyet", {"la_so": ls, "nam_am": 2027})
        p(f"tuvi.nhip_3_thang.{k}", "/v1/tuvi/nhip-3-thang", {"la_so": ls, "ngay_xem": XEM})
        p(f"tuvi.phi_hoa.{k}", "/v1/tuvi/phi-hoa", {"la_so": ls, "nam_xem": 2027})
        p(f"battu.luu_nien.{k}", "/v1/battu/luu-nien", {"la_so": ls, "nam_xem": 2027})
        p(f"battu.doi_chieu_cach.{k}", "/v1/battu/doi-chieu-cach", {"la_so": ls, "ngay_xem": XEM})
        kia_ls = kia["ls"]
        p(f"tuvi.hop_tham.{k}", "/v1/tuvi/hop-tham", {
            "la_so": ls, "quan_he": ("nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac")[i % 5],
            "nguoi_kia": {"birth_date": kia_ls["birth_date"], "calendar_type": kia_ls.get("calendar_type", "duong"),
                          "am_nhuan": kia_ls.get("am_nhuan", False), "gender": kia_ls["gender"],
                          **({"birth_time": kia_ls["birth_time"]} if i % 2 else {}), **({"vung": kia_ls["vung"]} if "vung" in kia_ls else {})}})
        if i % 4 == 0:
            p(f"tuvi.dinh_gio.{k}", "/v1/tuvi/dinh-gio", {"la_so": ls, "nam_doi_chieu": [2015, 2020], "tat_ca_gio": i % 8 == 0})
            p(f"chan_dung.{k}", "/v1/chan-dung", {"la_so": ls, "tra_loi": TL_DAY if i % 8 == 0 else {}, "ngay_xem": XEM})
            p(f"push.thang_hai_la_so.{k}", "/v1/push/thang-hai-la-so", {"ngay_xem": "2026-12-01", "nguoi": [{"la_so": ls}]})
        ngay_sinh = _sinh(h)["birth_date"]
        p(f"thoi_gian_toi.{k}", "/v1/thoi-gian-toi", {"ngay_sinh": ngay_sinh, "gioi_tinh": ls["gender"], "nam": 2027, "ngay_xem": XEM,
                                                      **({"la_so": ls} if gio_co and i % 2 == 0 else {})})
        # Gợi ý chéo + bản đồ
        hs = {**d, "gio": ls["birth_time"], "do_tin_gio": ls.get("do_tin_gio", "exact"), "gioi_tinh": ls["gender"], "ho_ten": h["ten"],
              "noi_sinh": ls.get("noi_sinh") if ls.get("vung") != "abroad" else None, "vung": ls.get("vung") if ls.get("vung") in ("north", "south") else None,
              "quy_uoc_duong_doi": "tung_phan", "ngay_xem": XEM}
        mang = ("than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich")[i % 5]
        p(f"goi_y_cheo.{k}", "/v1/goi-y-cheo", {**hs, "mang_hien_tai": mang})
        p(f"ban_do_5_mang.{k}", "/v1/ban-do-5-mang", hs)
        # Phong thuỷ + tuổi
        p(f"phongthuy.menh_quai.{k}", "/v1/phongthuy/menh-quai", _sinh(h, moc_nam=("lap_xuan", "tet_viet", "tet_trung")[i % 3]))
        p(f"phongthuy.do_huong.{k}", "/v1/phongthuy/do-huong", {"do_huong": (i * 37) % 360 + 0.5, "sinh": _sinh(h)})
        nha = {"huong_do": float((i * 45) % 360), "nam_xay": 1990 + i, "theo": ("cua", "ban_cong")[i % 2],
               **({"bo_cuc": BO_CUC if i % 6 == 0 else BO_CUC_HO} if i % 3 == 0 else {})}
        p(f"phongthuy.luan_giai.{k}", "/v1/phongthuy/luan-giai", {
            "sinh": _sinh(h), "nha": nha, "ngay_xem": XEM, "goc_nhin": ("sach_xua", "doi_song")[i % 2],
            "thanh_vien": [{"birth_year": _dmy(kia)["nam"], "gender": kia["ls"]["gender"], "vai": ("vo", "chong", "con", "cha_me")[i % 4]}] if i % 2 else [],
            **({"y_dinh": ("suc_khoe", "kinh_doanh_tien", "tinh_cam")[i % 3]} if i % 5 == 0 else {})})
        p(f"tuoi.lam_nha.{k}", "/v1/tuoi/lam-nha", {"nam_sinh": d["nam"], "thang_sinh": d["thang"], "ngay_sinh": d["ngay"], "nam_xay": 2027})
        p(f"tuoi.xong_dat.{k}", "/v1/tuoi/xong-dat", {"nam_sinh": d["nam"], "thang_sinh": d["thang"], "ngay_sinh": d["ngay"], "nam": 2027})
        p(f"tuoi.sao_han.{k}", "/v1/tuoi/sao-han", {"nam_sinh": d["nam"], "nam": 2027, "gioi_tinh": ls["gender"]})
        p(f"lich.ngay_tot.{k}", "/v1/lich/ngay-tot", {"nam_sinh": d["nam"], "thang_sinh": d["thang"], "ngay_sinh": d["ngay"], "ngay": XEM})
        if i % 5 == 0:
            p(f"nhan_tuong.luan_giai.{k}", "/v1/nhan-tuong/luan-giai", {
                "tra_loi": TL_DAY if i % 10 == 0 else {kk: v for j, (kk, v) in enumerate(TL_DAY.items()) if j % 2 == 0},
                "nam_sinh": d["nam"], "gioi_tinh": ls["gender"], "ngay_xem": XEM, **({"la_so": ls} if i % 10 == 0 else {})})
            p(f"tarot.doc_bai.celtic.{k}", "/v1/tarot/doc-bai", {"trai_bai": "celtic", "la": CELTIC, "cau_hoi": CAU_KD, "ngay_xem": XEM,
                                                              "nam_sinh": d["nam"], "gioi_tinh": ls["gender"]})
            p(f"tarot.la_ngay.{k}", "/v1/tarot/la-ngay", {"ngay": XEM, "ngay_sinh": ngay_sinh})
            p(f"lich.chon_ngay.{k}", "/v1/lich/chon-ngay", {"nam_sinh": d["nam"], "viec": ("cuoi_hoi", "khai_truong", "nhap_trach", "dong_tho")[(i // 5) % 4],
                                                         "tu": "2026-12-01", "den": "2027-01-31"})

    # ---- Lịch, năm, tuổi (GET công khai)
    for ngay in ("2026-11-10", "2027-02-06", "2027-02-07", "2026-12-22", "2027-06-15"):
        g(f"lich.ngay.{ngay}", f"/v1/lich/ngay-tot/{ngay}")
    for nam, th in ((2026, 11), (2026, 12), (2027, 1), (2027, 2), (2027, 7)):
        g(f"lich.thang.{nam}.{th}", f"/v1/lich/thang/{nam}/{th}")
        p(f"lich.thang_post.{nam}.{th}", "/v1/lich/thang", {"nam": nam, "thang": th})
        g(f"lich.viec_dem.{nam}.{th}", f"/v1/lich/viec-thang-dem/{nam}/{th}")
        for viec in ("cuoi_hoi", "khai_truong", "nhap_trach", "dong_tho", "xuat_hanh", "mua_xe"):
            g(f"lich.viec_thang.{viec}.{nam}.{th}", f"/v1/lich/viec-thang/{viec}/{nam}/{th}")
    g("lich.viec", "/v1/lich/viec")
    for nam in (2025, 2026, 2027, 2028):
        g(f"lich.nam.{nam}", f"/v1/lich/nam/{nam}")
        g(f"nam.{nam}", f"/v1/nam/{nam}")
        g(f"nam.cuoi_hoi.{nam}", f"/v1/nam/{nam}/cuoi-hoi")
        g(f"nam.sinh_con.{nam}", f"/v1/nam/{nam}/sinh-con")
        g(f"tuoi.han_nam.{nam}", f"/v1/tuoi/han-nam/{nam}")
        g(f"tuoi.sao_han_nam.{nam}", f"/v1/tuoi/sao-han/{nam}")
        g(f"tuoi.lam_nha_nam.{nam}", f"/v1/tuoi/lam-nha-nam/{nam}")
        g(f"tuoi.xong_dat_nam.{nam}", f"/v1/tuoi/xong-dat-nam/{nam}")
        g(f"sinh_nuoc_ngoai.{nam}", f"/v1/sinh-nuoc-ngoai?nam={nam}")
    for ns in range(1960, 2006, 3):
        for gon in ("", "?gon=1"):
            s = "gon" if gon else "day"
            g(f"nam.tuoi.2027.{ns}.{s}", f"/v1/nam/2027/tuoi/{ns}{gon}")
            g(f"tuoi.lam_nha.2027.{ns}.{s}", f"/v1/tuoi/lam-nha/2027/{ns}{gon}")
            g(f"tuoi.xong_dat.2027.{ns}.{s}", f"/v1/tuoi/xong-dat/2027/{ns}{gon}")
    for ch in ("am_sang_duong", "duong_sang_am"):
        for (dd, mm, yy, nh, lich, noi) in ((15, 8, 1995, False, "viet", None), (20, 8, 1995, True, "viet", None), (10, 2, 1968, False, "viet", "tp-ho-chi-minh"),
                                            (10, 2, 1968, False, "trung", None), (1, 1, 2027, False, "viet", None)):
            p(f"lich.doi.{ch}.{yy}{mm:02d}{dd:02d}.{int(nh)}.{lich}.{noi or 'x'}", "/v1/lich/doi",
              {"chieu": ch, "ngay": dd, "thang": mm, "nam": yy, "nhuan": nh and ch == "am_sang_duong", "lich": lich, "noi_sinh": noi})
    p("lich.chon_ngay_nhieu", "/v1/lich/chon-ngay-nhieu", {"viec": "cuoi_hoi", "tu": "2027-01-01", "den": "2027-12-31", "nguoi": [
        {"nam_sinh": 1997, "vai": "co_dau"}, {"nam_sinh": 1995, "vai": "chu_re"}, {"nam_sinh": 1968, "vai": "bo_co_dau"}]})
    p("timebase", "/v1/timebase/resolve", {"ngay": 24, "thang": 10, "nam": 1988, "gio": 23, "phut": 30, "vung": "north"})
    g("thoi_gian_toi.nam", "/v1/thoi-gian-toi/nam")
    g("dia_ly.tinh", "/v1/dia-ly/tinh")
    g("dia_ly.mui_gio", "/v1/dia-ly/mui-gio")
    for mg in ("us-san_jose", "au-sydney", "Europe/London"):
        p(f"dia_ly.mui_gio_tai.{mg}", "/v1/dia-ly/mui-gio/tai", {"mui_gio": mg, "ngay": "1992-07-15", "gio": "07:20"})

    # ---- Phong thuỷ còn lại
    g("phongthuy.danh_muc", "/v1/phongthuy/bo-cuc/danh-muc")
    g("phongthuy.cung_phi", "/v1/phongthuy/cung-phi")
    g("phongthuy.tuoi", "/v1/phongthuy/tuoi")
    g("phongthuy.tuoi_gop", "/v1/phongthuy/tuoi-gop")
    for bc_ten, bc in (("pho", BO_CUC), ("ho", BO_CUC_HO)):
        for gn in ("sach_xua", "doi_song"):
            p(f"phongthuy.bo_cuc.{bc_ten}.{gn}", "/v1/phongthuy/bo-cuc", {"bo_cuc": bc, "sinh": _sinh(HO_SO[0]), "goc_nhin": gn})
        p(f"phongthuy.viec_tuan.{bc_ten}", "/v1/phongthuy/viec-tuan", {"dau_hieu": ["duong_dam", "xa_ngang"], "loai_nha": bc["loai_nha"], "ngay_xem": XEM, "bo_cuc": bc})
    p("phongthuy.huong_ban_do", "/v1/phongthuy/huong-ban-do", {"tam": [21.0285, 105.8542], "truoc": [21.0280, 105.8545], "sinh": _sinh(HO_SO[1])})
    for nx, toa, do in ((2008, None, 182.0), (1995, "Tý", None), (2024, None, 47.5), (2010, None, 355.0)):
        p(f"phongthuy.huyen_khong.{nx}.{toa or do}", "/v1/phongthuy/huyen-khong", {"nam_xay": nx, "toa": toa, "do": do, "nam_xem": 2027})
        p(f"phongthuy.thang_nay.{nx}.{toa or do}", "/v1/phongthuy/thang-nay", {"huong_do": do, "huong": None if do is not None else "Nam", "toa": toa, "nam_xay": nx, "ngay_xem": XEM})
    p("phongthuy.doc_anh.tat", "/v1/phongthuy/doc-anh", {"anh": [{"du_lieu": "AAAA", "loai": "image/jpeg"}]})
    p("push.sang_nay", "/v1/push/sang-nay", {"ngay_xem": "2026-12-01", "ngay_sinh": ["24-10", "17-05", "29-02"], "nha": [{"huong_do": 180.0}, {"huong": "Đông"}]})
    g("kb.chuyen_gia.duc_luan", "/v1/kb/chuyen-gia/duc-luan")
    for ngay_push in ("2026-11-09", "2026-11-10"):     # thứ Hai (có nội dung) và thứ Ba (null)
        p(f"push.tuan.{ngay_push}", "/v1/push/tuan", {"ngay_xem": ngay_push, "nguoi": [{"ngay_sinh": "1988-10-24"}, {"ngay_sinh": "1990-05-17"}]})
    p("nhan_tuong.doc_anh.tat", "/v1/nhan-tuong/doc-anh", {"anh": [{"du_lieu": "AAAA", "loai": "image/jpeg", "goc": "thang"}], "dong_y": True})
    p("push.sang_nay.tet", "/v1/push/sang-nay", {"ngay_xem": "2027-02-06", "ngay_sinh": ["01-01"], "nha": []})

    # ---- Kinh Dịch
    g("kinhdich.chu_de", "/v1/kinhdich/chu-de")
    for j, hao in enumerate(HAO):
        for cd in ("tu_dong", "nghia_ly", "day_du"):
            p(f"kinhdich.hoi.{cd}.{j}", "/v1/kinhdich/hoi", {"cau_hoi": CAU_KD, "che_do": cd, "cach_ra_que": "gieo_tay", "gia_tri_hao": hao, "thoi_diem": THOI_DIEM})
        for tp in ("nghia_ly", "luc_hao", "mai_hoa"):
            p(f"kinhdich.khoi_que.{tp}.{j}", "/v1/kinhdich/khoi-que", {"cau_hoi": CAU_KD, "truong_phai": tp, "gia_tri_hao": hao, **({"dung_than": "Quan Quỷ"} if tp == "luc_hao" else {})})
    for so in ([3, 8], [12, 45], [100, 7]):
        p(f"kinhdich.que_rieng.{so[0]}_{so[1]}", "/v1/kinhdich/que-rieng", {"so": so, "thoi_diem": THOI_DIEM})
        p(f"kinhdich.hoi.mai_hoa_so.{so[0]}", "/v1/kinhdich/hoi", {"cau_hoi": CAU_KD, "cach_ra_que": "mai_hoa_so", "so_mai_hoa": so, "thoi_diem": THOI_DIEM})
    for lich in ("viet", "trung"):
        p(f"kinhdich.hoi.mai_hoa.{lich}", "/v1/kinhdich/hoi", {"cau_hoi": CAU_KD, "cach_ra_que": "mai_hoa", "thoi_diem": THOI_DIEM, "lich": lich})
    p("kinhdich.hoi.mai_hoa_phuong", "/v1/kinhdich/hoi", {"cau_hoi": CAU_KD, "cach_ra_que": "mai_hoa_phuong", "phuong_mai_hoa": "Đông Nam", "thoi_diem": THOI_DIEM})
    for j, d in enumerate(_doc_jsonl("kinhdich_hieu_cau_dev.jsonl")):
        p(f"kinhdich.hieu_cau.{j}", "/v1/kinhdich/hieu-cau", {"cau_hoi": d.get("cau_hoi") or d.get("cau") or ""})

    # ---- Tarot
    g("tarot.bo_bai", "/v1/tarot/bo-bai")
    g("tarot.la_ngay", f"/v1/tarot/la-ngay?ngay={XEM}")
    p("tarot.xao_bai", "/v1/tarot/xao-bai", {"hat_giong": "ab12cd34ef56ab12cd34ef56ab12cd34", "nguoc": True})
    for ten_tb, la, kw in (("mot_la", [{"id": "dai_13"}], {"chu_de": "tinh_cam"}), ("ba_la_thoi_gian", BA_LA, {}),
                           ("nam_la", [{"id": "gay_2", "nguoc": True}, {"id": "gay_5"}, {"id": "dai_19"}, {"id": "coc_2"}, {"id": "tien_4"}], {"chu_de": "tien_bac"}),
                           ("hai_lua_chon", [{"id": "dai_7"}, {"id": "kiem_2"}, {"id": "tien_8"}, {"id": "coc_5", "nguoc": True}, {"id": "dai_17"}],
                            {"cau_hoi": "Tôi nên ở lại công ty cũ hay sang công ty mới?"}),
                           ("khi_nao", [{"id": "gay_3"}, {"id": "dai_10"}, {"id": "coc_6"}], {"cau_hoi": "Khi nào tôi có việc mới?"}),
                           ("celtic", CELTIC, {"chu_de": "cong_viec", "tra_loi_nhan_tuong": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam"})):
        p(f"tarot.doc_bai.{ten_tb}", "/v1/tarot/doc-bai", {"trai_bai": ten_tb, "la": la, "ngay_xem": XEM, **kw})
        p(f"tarot.the.{ten_tb}", "/v1/tarot/the", {"trai_bai": ten_tb, "la": la, "y_dinh": "quyet_dinh", "viec": "doi_viec", "linh_vuc": "cong_viec"})
        p(f"tarot.hoi.{ten_tb}", "/v1/tarot/hoi", {"cau_hoi": "Lá ở vị trí kết quả nói gì?", "trai_bai": ten_tb, "la": la})
    for tep in ("tarot_y_dinh_dev.jsonl", "tarot_y_dinh_holdout.jsonl"):
        for j, d in enumerate(_doc_jsonl(tep)):
            cau = d.get("cau_hoi") or d.get("cau") or ""
            p(f"tarot.hieu_cau.{tep[12:15]}.{j}", "/v1/tarot/hieu-cau", {"cau_hoi": cau})
            if j % 10 == 0:
                p(f"tarot.hoi_cau.{tep[12:15]}.{j}", "/v1/tarot/hoi", {"cau_hoi": cau})

    # ---- Nhân tướng
    g("nhan_tuong.khao_sat", "/v1/nhan-tuong/khao-sat")
    g("nhan_tuong.cau_hinh", "/v1/nhan-tuong/cau-hinh")
    p("nhan_tuong.luan_giai.trong", "/v1/nhan-tuong/luan-giai", {"tra_loi": {}, "ngay_xem": XEM})
    p("nhan_tuong.do_anh", "/v1/nhan-tuong/do-anh", {"chan_toc": {"x": 0.5, "y": 0.1}, "an_duong": {"x": 0.5, "y": 0.36},
                                                     "chuan_dau": {"x": 0.5, "y": 0.62}, "cam": {"x": 0.5, "y": 0.9}})
    for cau in ("Trán cao nói gì?", "Nốt ruồi ở cằm có ý nghĩa gì?", "Năm 35 tuổi nhìn vào đâu trên mặt?", "Xem tướng sếp tôi có tốt không?",
                "Mũi của tôi nói gì về tiền bạc?", "Tôi có nên đi sửa mũi không?"):
        p(f"nhan_tuong.hoi.{hashlib.md5(cau.encode()).hexdigest()[:6]}", "/v1/nhan-tuong/hoi", {"cau_hoi": cau, "tra_loi": TL_DAY, "nam_sinh": 1988, "gioi_tinh": "nam"})

    # ---- Khác
    g("tu_dien", "/v1/tu-dien")
    for m in ("tuvi", "battu", "phongthuy", "kinhdich", "thanso"):
        g(f"tu_dien.{m}", f"/v1/tu-dien?mo_dun={m}")
    g("y_dinh", "/v1/y-dinh")
    g("hoi.cau_chuan", "/v1/hoi/cau-chuan")
    g("kb.status", "/v1/kb/status")
    g("tuvi.la_so_mau", "/v1/tuvi/la-so-mau")
    for a in (1, 4, 7, 9, 11, 22, 33):
        g(f"thanso.so.{a}", f"/v1/thanso/so/{a}")
        for b in (2, 5, 8):
            p(f"thanso.cap_so.{a}.{b}", "/v1/thanso/cap-so", {"a": {"duong_doi": a, "linh_hon": b}, "b": {"duong_doi": b, "su_menh": a}, "quan_he": "nguoi_yeu"})
    PHIEU = [{"ma": "ds.su_nghiep.thien_co.sang.thuan", "ket_qua": "dung"}, {"ma": "ds.bt.su_nghiep.chinh_quan.thuan.hien_tai", "ket_qua": "dung"},
             {"ma": "ds.bt.tien_bac.chinh_tai.can_chu_dong.hien_tai", "ket_qua": "dung"}, {"ma": "ds.tien_bac.vu_khuc.can_chu_dong", "ket_qua": "dung"},
             {"ma": "ds.tinh_cam.tham_lang.can_bang", "ket_qua": "dung"}, {"ma": "ds.bt.tinh_cam.thuc_than.can_bang.hien_tai", "ket_qua": "chua_dung"}]
    for n in (0, 2, 4, 6):
        p(f"giao_thoa.{n}", "/v1/giao-thoa", {"phieu": PHIEU[:n]})

    # ---- Danh mục + trang kiến thức (cần client để đọc mục lục)
    if client is not None:
        ml = client.get("/v1/kb/trang").json().get("trang", [])
        g("kb.trang", "/v1/kb/trang")
        for t in ml:
            g(f"kb.trang.{t['loai']}.{t['slug']}", f"/v1/kb/trang/{t['loai']}/{t['slug']}")
        for s in client.get("/v1/tuvi/la-so-mau").json().get("ds", []):
            g(f"tuvi.la_so_mau.{s['slug']}", f"/v1/tuvi/la-so-mau/{s['slug']}")
        for s in client.get("/v1/phongthuy/cung-phi").json().get("cung", []):
            g(f"phongthuy.cung_phi.{s['slug']}", f"/v1/phongthuy/cung-phi/{s['slug']}")
        for s in (client.get("/v1/phongthuy/tuoi-gop").json().get("tuoi") or [])[::5]:
            if isinstance(s, dict) and s.get("slug"):
                g(f"phongthuy.tuoi_gop.{s['slug']}", f"/v1/phongthuy/tuoi-gop/{s['slug']}")
        for s in (client.get("/v1/phongthuy/tuoi").json().get("tuoi") or [])[::9]:
            if isinstance(s, dict) and s.get("slug"):
                g(f"phongthuy.tuoi.{s['slug']}", f"/v1/phongthuy/tuoi/{s['slug']}")
        for n in client.get("/v1/sinh-nuoc-ngoai?nam=2026").json().get("nuoc", []):
            g(f"sinh_nuoc_ngoai.{n['ma']}", f"/v1/sinh-nuoc-ngoai/{n['ma']}?nam=2026")
        for la_id in client.get("/v1/tarot/bo-bai").json().get("la", {}):
            g(f"tarot.la.{la_id}", f"/v1/tarot/la/{la_id}")
        yd = client.get("/v1/y-dinh").json().get("y_dinh", [])
        for y in yd:
            g(f"phongthuy.do_thi.{y['ma']}", f"/v1/phongthuy/do-thi/{y['ma']}")
            for m in ("tuvi", "battu", "phongthuy", "kinhdich", "thanso"):
                g(f"y_dinh.goi_mo.{y['ma']}.{m}", f"/v1/y-dinh/goi-mo?ma={y['ma']}&mo_dun={m}")

    # ---- Hỏi đáp: MỌI câu trong kho có nhãn, hồ sơ xoay vòng (chỉ hồ sơ có giờ)
    co_gio = [h for h in HO_SO if h["ls"].get("do_tin_gio") != "unknown"]
    cau = _cau_theo_mo_dun()
    for j, (ma, c) in enumerate(cau["thanso"]):
        h = co_gio[j % len(co_gio)]
        than = _ts(h, cau_hoi=c, ngay_xem=XEM, quy_uoc_duong_doi="tung_phan", phai=("pitago", "pitago", "chaldea", "tong_hop")[j % 4])
        if j % 6 == 0:
            than["nguoi_kia"] = {"ho_ten": HO_SO[(j + 3) % 40]["ten"], **_dmy(HO_SO[(j + 3) % 40])}
        p(f"hoi.thanso.{ma}", "/v1/thanso/hoi", than)
        if j % 25 == 0:
            p(f"thanso.ngu_canh.{ma}", "/v1/thanso/ngu-canh", _ts(h, cau_hoi=c, ngay_xem=XEM))
            p(f"hoi.dac_biet.{ma}", "/v1/hoi/dac-biet", {"cau_hoi": c})
    for j, (ma, c) in enumerate(cau["tuvi"]):
        h = co_gio[j % len(co_gio)]
        p(f"hoi.tuvi.{ma}", "/v1/tuvi/hoi", {"cau_hoi": c, "che_do": ("tham_khao", "chi_tiet")[j % 2], "ngay_xem": XEM,
                                              **({"la_so": h["ls"]} if j % 7 else {})})
    for j, (ma, c) in enumerate(cau["battu"]):
        h = co_gio[j % len(co_gio)]
        p(f"hoi.battu.{ma}", "/v1/battu/hoi", {"cau_hoi": c, "ngay_xem": XEM, **({"la_so": h["ls"]} if j % 7 else {})})
    for j, (ma, c) in enumerate(cau["phongthuy"]):
        h = co_gio[j % len(co_gio)]
        p(f"hoi.phongthuy.{ma}", "/v1/phongthuy/hoi", {"cau_hoi": c, "ngay_xem": XEM, **({"sinh": _sinh(h)} if j % 5 else {}),
                                                        **({"nha": {"huong_do": 135.0, "nam_xay": 2012, "bo_cuc": BO_CUC}} if j % 9 == 0 else {})})
    for j, (ma, c) in enumerate(cau["kinhdich"]):
        p(f"hoi.kinhdich.{ma}", "/v1/kinhdich/hoi", {"cau_hoi": c, "che_do": ("tu_dong", "nghia_ly", "day_du")[j % 3], "cach_ra_que": "gieo_tay",
                                                      "gia_tri_hao": HAO[j % len(HAO)], "thoi_diem": THOI_DIEM})
    ma_set: set[str] = set()
    for ma, *_ in ra:
        assert ma not in ma_set, f"trùng mã lượt gọi: {ma}"
        ma_set.add(ma)
    return ra


# ------------------------------------------------------------------ chạy + băm
def goi(client, luot: Luot, ngon_ngu: str = "vi") -> tuple[int, bytes]:
    _, pt, duong, than = luot
    # Không gửi `x-nguoi-goi`: hạn mức 120 lượt/phút tính theo người gọi (app/gioi_han.py) — khi chạy cùng cả bộ test, bộ đếm
    # đã dựng sẵn với mức mặc định nên hàng nghìn lượt liên tiếp sẽ nhận 429.
    dau = {"x-ngon-ngu": ngon_ngu}
    r = client.get(duong, headers=dau) if pt == "GET" else client.post(duong, json=than, headers=dau)
    return r.status_code, r.content


def bam(ma_http: int, noi_dung: bytes) -> str:
    return hashlib.sha256(str(ma_http).encode() + b"\n" + noi_dung).hexdigest()[:24]


def nhom(ma: str) -> str:
    """Tệp băm chứa lượt gọi: theo tiền tố đầu (hỏi đáp tách theo mảng)."""
    a = ma.split(".")
    return f"{a[0]}_{a[1]}" if a[0] == "hoi" else a[0]


def may_khach():
    """TestClient không hạn mức (golden gọi hàng nghìn lượt liên tiếp)."""
    os.environ.setdefault("ENGINE_LUOT_PHUT", "100000000")
    from fastapi.testclient import TestClient  # noqa: PLC0415

    from app.main import app  # noqa: PLC0415
    c = TestClient(app, raise_server_exceptions=False)   # lỗi 500 có sẵn cũng là hiện trạng cần chụp
    # FastAPI dựng tham số route ở lượt gọi ĐẦU (đọc chú thích kiểu từ không gian tên module) → làm trước khi đóng băng đồng hồ.
    app.openapi()
    c.get("/health")
    return c


# ------------------------------------------------------------------ bộ kiểm đầu ra tiếng Anh (mục 5.2 của prompt EN-ALL)
import re as _re  # noqa: E402

_VIET = _re.compile(r"[ăâđêôơưĂÂĐÊÔƠƯàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ"
                    r"ÀÁẠẢÃẦẤẬẨẪẰẮẶẲẴÈÉẸẺẼỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕỒỐỘỔỖỜỚỢỞỠÙÚỤỦŨỪỨỰỬỮỲÝỴỶỸ]")
_SLOT = _re.compile(r"\{[a-z_][a-z0-9_]*\}")
_RAC = _re.compile(r"\b(None|undefined|NaN)\b|  +|\.\.(?!\.)|,,|\?\?|!!| ,| \.(?!\.)")
# Khoá được phép mang chữ Việt / chữ Hán ở bản Anh: tên gốc để đối chiếu, mã nội bộ, slug bản Việt cho hreflang.
# `tdm_ten` = tên lá theo bộ Marseille (tiếng Pháp: "L'Impératrice").
KHOA_DUOC_PHEP = {"ten_viet", "ten_vi", "vi", "han", "chu_han", "han_viet", "slug_vi", "duong_vi", "nguyen_van", "phien_am", "ban_vi", "tdm_ten"}
_NGHIENG = _re.compile(r"_[^_\n]{1,40}_")      # từ nước ngoài trong trích dẫn nguyên văn (Waite: "_bien-être_")


def _chuoi_vao(than: Any, ra: set[str]) -> set[str]:
    if isinstance(than, str):
        if than.strip():
            ra.add(than)
    elif isinstance(than, dict):
        for v in than.values():
            _chuoi_vao(v, ra)
    elif isinstance(than, list):
        for v in than:
            _chuoi_vao(v, ra)
    return ra


def loi_en(du_lieu: Any, than: Any = None, toi_da: int = 8) -> list[str]:
    """Danh sách lỗi của MỘT phản hồi tiếng Anh: chữ Việt còn sót, `{slot}` chưa thay, rác ghép chuỗi. Chuỗi người gọi
    gửi vào (tên, câu hỏi) được bỏ khỏi chữ trước khi soát — engine được phép nhắc lại tên người dùng."""
    vao = sorted(_chuoi_vao(than, set()), key=len, reverse=True)
    ra: list[str] = []

    def di(x: Any, duong: str, khoa: str) -> None:
        if len(ra) >= toi_da:
            return
        if isinstance(x, dict):
            for k, v in x.items():
                if k in KHOA_DUOC_PHEP:
                    continue
                if isinstance(k, str) and _VIET.search(k):
                    ra.append(f"{duong}: khoá tiếng Việt «{k}»")
                di(v, f"{duong}.{k}", k)
        elif isinstance(x, list):
            for i, v in enumerate(x):
                di(v, f"{duong}[{i}]", khoa)
        elif isinstance(x, str):
            s = x
            for v in vao:
                s = s.replace(v, "")
            s = _NGHIENG.sub("", s)
            m = _VIET.search(s)
            if m:
                ra.append(f"{duong}: chữ Việt «{s[max(0, m.start() - 25):m.start() + 35]}»")
            elif _SLOT.search(s):
                ra.append(f"{duong}: slot chưa thay «{_SLOT.search(s).group(0)}»")
            elif khoa not in ("ma", "ma_mau", "slug", "duong", "id", "url") and len(s) > 20 and (r := _RAC.search(s)):
                ra.append(f"{duong}: rác ghép chuỗi «{s[max(0, r.start() - 20):r.start() + 20]}»")

    di(du_lieu, "$", "")
    return ra


def khung(x: Any, duong: str = "$", ra: list[str] | None = None) -> list[str]:
    """Dấu vân tay DỮ KIỆN của phản hồi: đường dẫn + kiểu của mọi nút, kèm GIÁ TRỊ của số / bool / mã (`ma_mau`, `muc`…).
    Ngôn ngữ chỉ được đổi chữ — hai bản vi / en của cùng lượt gọi phải có cùng khung."""
    ra = [] if ra is None else ra
    if isinstance(x, dict):
        for k in sorted(x):
            khung(x[k], f"{duong}.{k}", ra)
    elif isinstance(x, list):
        ra.append(f"{duong}#{len(x)}")
        for i, v in enumerate(x):
            khung(v, f"{duong}[{i}]", ra)
    elif isinstance(x, str):
        la_ma = duong.rsplit(".", 1)[-1].split("[")[0] in ("ma_mau", "muc", "ma", "id", "phai", "loai", "kieu", "trang_thai", "xu_ly")
        ra.append(f"{duong}={x}" if la_ma else f"{duong}:s")
    else:
        ra.append(f"{duong}={x!r}")
    return ra


def khoa_route(ma: str) -> str:
    """Nhóm báo cáo / xfail của lượt gọi: hai đoạn đầu của mã ("thanso.luan_giai", "hoi.tuvi", "kb.trang")."""
    a = ma.split(".")
    if len(a) < 3 or _re.fullmatch(r"hs\d+|\d+", a[1]):
        return a[0]
    return ".".join(a[:2])
