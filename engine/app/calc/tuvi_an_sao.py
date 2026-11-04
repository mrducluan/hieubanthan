# -*- coding: utf-8 -*-
"""SPEC-005 — an sao tử vi đầy đủ qua iztro chạy cục bộ (Node subprocess).

Quyết định 2026-08-15: Python engine gọi iztro qua Node, KHÔNG viết lại logic an
sao. Quyết định 2026-09-30: ghim iztro bản đã sinh golden — 2.6.0 (2.5.8/2.6.0/
2.6.1 cho kết quả trùng khít 8 lá golden; 2.6.0 là bản mới nhất trên npm lúc
commit golden c173a95). Nâng bản = sinh lại golden + tăng ENGINE_VERSION.

Tầng CALC: tất định (cùng đầu vào → cùng lá số), không LLM, không DB, không mạng.
Giờ Tý tử vi theo iztro: 23:00–23:59 là giờ Tý của NGÀY HÔM SAU (time_index 12).
"""
from __future__ import annotations

import atexit
import datetime as dt
import json
import os
import queue
import select
import subprocess
import threading
from collections import OrderedDict
from functools import lru_cache
from pathlib import Path

from app import config
from app.calc import lunar, tuvi_hoa_linh_vn

THU_MUC = Path(__file__).resolve().parents[2] / "ziwei"
SCRIPT = THU_MUC / "an_sao.mjs"
TIMEOUT_GIAY = 20


class AnSaoLoi(RuntimeError):
    """Không chạy được iztro (thiếu Node / thiếu node_modules / lỗi đầu vào)."""


def time_index(gio: int, phut: int) -> int:
    """Giờ đồng hồ (đã quy về kinh tuyến lịch) → chỉ số giờ của iztro.

    0 = Tý sớm 00:00–00:59 · 1 = Sửu 01–02:59 · … · 11 = Hợi 21–22:59 · 12 = Tý muộn 23:xx.
    """
    if not (0 <= gio <= 23 and 0 <= phut <= 59):
        raise ValueError("giờ/phút không hợp lệ")
    if gio == 0:
        return 0
    if gio == 23:
        return 12
    return (gio + 1) // 2


def _node() -> str:
    return os.environ.get("NODE_BIN", "node")


@lru_cache(maxsize=1)
def phien_ban_iztro() -> str:
    p = THU_MUC / "node_modules" / "iztro" / "package.json"
    if not p.exists():
        raise AnSaoLoi("Chưa cài iztro: chạy `npm ci --prefix engine/ziwei`.")
    return json.loads(p.read_text(encoding="utf-8"))["version"]


def _am(x: dt.date, tz_lich: float) -> str:
    """Âm lịch VIỆT NAM (Hồ Ngọc Đức) của ngày dương `x` theo múi giờ lịch `tz_lich`, dạng JSON cho an_sao.mjs."""
    ng, th, na, nh = lunar.solar_to_lunar(x.day, x.month, x.year, tz_lich)
    return json.dumps({"nam": na, "thang": th, "ngay": ng, "nhuan": bool(nh),
                       "so_ngay": lunar.so_ngay_thang(th, na, nh, tz_lich)})


# EN-1 HT-1: mỗi tiến trình Node (iztro) chiếm tới ~67 MB; pool luồng FastAPI 120 → vài chục lượt Tử vi cùng lúc làm
# engine (Render Starter 512 MB) hết RAM. Giới hạn số Node chạy đồng thời; lượt thứ N+1 chờ (thêm độ trễ, không sập).
def _so_node() -> int:
    try:
        return max(1, int(os.environ.get("NODE_DONG_THOI", "3")))
    except ValueError:                       # đặt sai kiểu → mặc định, không làm engine sập lúc khởi động
        return 3


_NODE_TOI_DA = threading.BoundedSemaphore(_so_node())


# Bộ nhớ kết quả iztro theo đúng tham số (trước là lru_cache) — dict riêng để lời gọi GỘP (`nap_truoc`) điền sẵn.
_NHO: "OrderedDict[tuple, str]" = OrderedDict()
_NHO_KHOA = threading.Lock()
_NHO_TOI_DA = 512


def _xoa_nho() -> None:
    with _NHO_KHOA:
        _NHO.clear()


def _cat(k: tuple, v: str) -> None:
    with _NHO_KHOA:
        _NHO[k] = v
        _NHO.move_to_end(k)
        while len(_NHO) > _NHO_TOI_DA:
            _NHO.popitem(last=False)


def _chay(ngay: str, ti: int, gioi_tinh: str, ngon_ngu: str, ngay_xem: str = "",
          am: str = "", am_xem: str = "", fix_leap: bool = True) -> str:
    k = (ngay, ti, gioi_tinh, ngon_ngu, ngay_xem, am, am_xem, fix_leap)
    with _NHO_KHOA:
        if k in _NHO:
            _NHO.move_to_end(k)
            return _NHO[k]
    ra = _chay_that(*k)
    _cat(k, ra)
    return ra


def _chay_that(ngay: str, ti: int, gioi_tinh: str, ngon_ngu: str, ngay_xem: str = "",
               am: str = "", am_xem: str = "", fix_leap: bool = True) -> str:
    phien_ban_iztro()   # kiểm tra đã cài
    v = dict(ngay=ngay, ti=ti, gioi_tinh=gioi_tinh, ngon_ngu=ngon_ngu, ngay_xem=ngay_xem, am=am, am_xem=am_xem,
             fix_leap=fix_leap)
    if _dung_chay_san():
        try:
            return _may().goi(v)
        except AnSaoLoi:
            raise                              # lỗi của chính dữ liệu (iztro báo) — đường cũ cũng sẽ lỗi y vậy
        except Exception:  # noqa: BLE001 — tiến trình chạy sẵn hỏng / treo → quay về đường cũ, người dùng không thấy lỗi
            pass
    with _NODE_TOI_DA:
        return _chay_node(**v)


# ---- EN-4 (mục 1): iztro CHẠY SẴN — 1–2 tiến trình Node nhận việc theo từng dòng JSON (ziwei/may_chu.mjs), bỏ ~110 ms
# khởi động Node mỗi lượt. Kết quả trùng khít đường cũ (tests/test_en4_node_chay_san.py, 60 lá golden). Tiến trình chết /
# treo quá TIMEOUT_GIAY → giết, dựng lại ở lượt sau; thay tiến trình sau NODE_CHAY_SAN_LUOT lượt (tránh rò bộ nhớ).
# Tắt: NODE_CHAY_SAN=0. Số tiến trình: NODE_CHAY_SAN_SO (mặc định 2, ≤ NODE_DONG_THOI).
MAY_CHU = THU_MUC / "may_chu.mjs"


def _dung_chay_san() -> bool:
    # Windows: select() không đọc được ống tiến trình → tắt chạy sẵn, dùng đường cũ (mỗi lượt một tiến trình)
    return os.environ.get("NODE_CHAY_SAN", "1") != "0" and os.name != "nt"


def _so_env(ten: str, mac_dinh: int) -> int:
    try:
        return max(1, int(os.environ.get(ten, str(mac_dinh))))
    except ValueError:
        return mac_dinh


class _TienTrinh:
    def __init__(self) -> None:
        self.p: subprocess.Popen | None = None
        self.luot = 0

    def _mo(self) -> None:
        self.p = subprocess.Popen([_node(), str(MAY_CHU)], cwd=THU_MUC, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True, bufsize=1, encoding="utf-8")
        self.luot = 0

    def dong(self) -> None:
        if self.p is not None:
            try:
                self.p.kill()
                self.p.wait(timeout=2)
            except Exception:  # noqa: BLE001
                pass
        self.p = None

    def goi(self, dong_vao: str) -> dict:
        if self.p is None or self.p.poll() is not None or self.luot >= _so_env("NODE_CHAY_SAN_LUOT", 500):
            self.dong()
            self._mo()
        assert self.p and self.p.stdin and self.p.stdout
        self.p.stdin.write(dong_vao + "\n")
        self.p.stdin.flush()
        san, _, _ = select.select([self.p.stdout], [], [], TIMEOUT_GIAY)
        if not san:
            self.dong()
            raise TimeoutError("iztro chạy sẵn quá thời gian")
        ra = self.p.stdout.readline()
        if not ra:
            self.dong()
            raise BrokenPipeError("iztro chạy sẵn đã thoát")
        self.luot += 1
        return json.loads(ra)


class _MayChay:
    """Hàng tiến trình chạy sẵn: lấy một tiến trình rảnh (chờ tối đa TIMEOUT_GIAY), gửi một dòng, trả lại hàng."""

    def __init__(self, so: int) -> None:
        self._ds = [_TienTrinh() for _ in range(so)]
        self._ranh: queue.Queue[_TienTrinh] = queue.Queue()
        for w in self._ds:
            self._ranh.put(w)

    def goi(self, v: dict) -> str:
        dong_vao = json.dumps({"ngay": v["ngay"], "time_index": v["ti"], "gioi_tinh": v["gioi_tinh"],
                               "ngon_ngu": v["ngon_ngu"], **({"ngay_xem": v["ngay_xem"]} if v.get("ngay_xem") else {}),
                               **({"am": json.loads(v["am"])} if v.get("am") else {}),
                               **({"am_xem": json.loads(v["am_xem"])} if v.get("am_xem") else {}),
                               **({"ds_xem": v["ds_xem"]} if v.get("ds_xem") else {}),
                               "fix_leap": v.get("fix_leap", True)}, ensure_ascii=False)
        w = self._ranh.get(timeout=TIMEOUT_GIAY)
        try:
            ra = w.goi(dong_vao)
        finally:
            self._ranh.put(w)
        if not ra.get("ok"):
            raise AnSaoLoi("iztro lỗi: " + str(ra.get("loi", ""))[:300])
        return json.dumps(ra["kq"], ensure_ascii=False)

    def dong_het(self) -> None:
        for w in self._ds:
            w.dong()


_MAY: _MayChay | None = None
_MAY_KHOA = threading.Lock()


def _may() -> _MayChay:
    global _MAY
    with _MAY_KHOA:
        if _MAY is None:
            _MAY = _MayChay(min(_so_env("NODE_CHAY_SAN_SO", 2), _so_node()))
            atexit.register(_MAY.dong_het)
        return _MAY


def _chay_node(ngay: str, ti: int, gioi_tinh: str, ngon_ngu: str, ngay_xem: str,
               am: str, am_xem: str, fix_leap: bool) -> str:
    try:
        kq = subprocess.run([_node(), str(SCRIPT)], cwd=THU_MUC, capture_output=True, text=True,
                            timeout=TIMEOUT_GIAY, check=False,
                            input=json.dumps({"ngay": ngay, "time_index": ti,
                                              "gioi_tinh": gioi_tinh, "ngon_ngu": ngon_ngu,
                                              **({"ngay_xem": ngay_xem} if ngay_xem else {}),
                                              **({"am": json.loads(am)} if am else {}),
                                              **({"am_xem": json.loads(am_xem)} if am_xem else {}),
                                              "fix_leap": fix_leap}))
    except FileNotFoundError as e:
        raise AnSaoLoi("Không tìm thấy Node.js (đặt NODE_BIN nếu không ở PATH).") from e
    except subprocess.TimeoutExpired as e:
        raise AnSaoLoi("iztro chạy quá thời gian.") from e
    if kq.returncode != 0:
        raise AnSaoLoi("iztro lỗi: " + kq.stderr.strip()[:300])
    return kq.stdout


def tu_kiem() -> None:
    """Tự kiểm lúc build ảnh Docker (engine/Dockerfile): an một lá mẫu qua CẢ HAI đường — mỗi lượt một tiến trình
    (`an_sao.mjs`) và tiến trình chạy sẵn (`may_chu.mjs`) — gọi thẳng, không qua bộ nhớ và không rơi về đường kia (đường
    dự phòng che mất lỗi của đường chính). Thiếu tệp .mjs / node_modules → AnSaoLoi, build hỏng. Sự cố 2026-11-02:
    ảnh thiếu an_sao_lib.mjs → mọi lượt an sao trên production lỗi 503."""
    for tep in (SCRIPT, MAY_CHU, THU_MUC / "an_sao_lib.mjs"):
        if not tep.is_file():
            raise AnSaoLoi(f"Thiếu {tep.name} trong {THU_MUC}")
    v = dict(ngay="1988-10-24", ti=4, gioi_tinh="nam", ngon_ngu="vi-VN", ngay_xem="2027-02-06", am="", am_xem="",
             fix_leap=True)
    may = _MayChay(1)
    try:
        ket_qua = {"an_sao.mjs": json.loads(_chay_node(**v)), "may_chu.mjs": json.loads(may.goi(v))}
    except AnSaoLoi:
        raise
    except Exception as e:  # noqa: BLE001 — tiến trình chạy sẵn thoát / treo: báo rõ thay vì lỗi lạ
        raise AnSaoLoi(f"may_chu.mjs không chạy được: {e}") from e
    finally:
        may.dong_het()
    for ten, la in ket_qua.items():
        if len(la.get("palaces") or []) != 12 or not la.get("horoscope"):
            raise AnSaoLoi(f"{ten}: lá số mẫu không đủ 12 cung / thiếu vận hạn")
    if ket_qua["an_sao.mjs"] != ket_qua["may_chu.mjs"]:
        raise AnSaoLoi("an_sao.mjs và may_chu.mjs cho lá số mẫu khác nhau")


THANG_NHUAN = ("thang_sau", "thang_chinh")   # nửa sau tháng nhuận: tính sang tháng sau (iztro) / như tháng chính
HOA_LINH = ("viet", "trung")                 # lối Việt (Nam phái) / Trung Châu (iztro)


_TEN_HOA_LINH = {"Hỏa Tinh": "Hỏa Tinh", "火星": "Hỏa Tinh", "Linh Tinh": "Linh Tinh", "铃星": "Linh Tinh"}


def _dat_hoa_linh_viet(la: dict, ngay: dt.date, ti: int, gioi_tinh: str, tz_lich: float) -> None:
    """Chuyển Hoả Tinh, Linh Tinh của iztro sang vị trí lối Việt (tuvi_hoa_linh_vn). Tý muộn đã được `_ty_muon` đổi
    thành ngày hôm sau, giờ Tý trước khi gọi."""
    ngay, ti = _ty_muon(ngay, ti)
    can, chi = lunar.can_chi_nam(lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, tz_lich)[2])
    dich = dict(zip(("Hỏa Tinh", "Linh Tinh"), tuvi_hoa_linh_vn.vi_tri(can, chi, ti, gioi_tinh)))
    sao = {}
    for p in la["palaces"]:
        for s in [x for x in p["minorStars"] if x["name"] in _TEN_HOA_LINH]:
            p["minorStars"].remove(s)
            sao[_TEN_HOA_LINH[s["name"]]] = {**s, "brightness": ""}   # độ sáng phái Trung không còn đúng cung mới
    for p in la["palaces"]:
        for ten, s in sao.items():
            if p["earthlyBranch"] == dich[ten] or p["earthlyBranch"] == _CHI_HAN.get(dich[ten]):
                p["minorStars"].append(s)


LICH = ("viet", "trung")
TZ_TRUNG = 8.0          # lịch Trung Quốc: kinh tuyến 120°E


def lich_khac(ngay: dt.date, tz_lich: float = config.CALENDAR_MERIDIAN_TZ) -> bool:
    """Ngày dương này có ngày âm (ngày/tháng/năm/nhuận) khác nhau giữa lịch đang dùng và lịch Trung Quốc."""
    return lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, tz_lich) != \
        lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, TZ_TRUNG)


_CHI_HAN = dict(zip(tuvi_hoa_linh_vn.CHI, "子丑寅卯辰巳午未申酉戌亥"))


def an_sao_tho(ngay_duong: dt.date, ti: int, gioi_tinh: str, ngon_ngu: str = "vi-VN",
               tz_lich: float = config.CALENDAR_MERIDIAN_TZ, hoa_linh: str = "viet",
               thang_nhuan: str = "thang_sau", lich: str = "viet") -> dict:
    """Lá số thô từ iztro. `ngay_duong` là ngày dương theo kinh tuyến lịch UTC+7; ngày âm dùng lịch VIỆT NAM
    theo `tz_lich` (7, hoặc 8 cho miền Nam 1960–1975) chứ không để iztro đổi theo lịch Trung Quốc.
    `lich="trung"` (TV-LICH, người dùng chọn xem phái Trung): để iztro tự đổi theo lịch Trung Quốc (UTC+8)."""
    if not 0 <= ti <= 12:
        raise ValueError("time_index phải trong 0..12")
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    if hoa_linh not in HOA_LINH or thang_nhuan not in THANG_NHUAN or lich not in LICH:
        raise ValueError("hoa_linh / thang_nhuan / lich không hợp lệ")
    if lich == "trung":
        tz_lich = TZ_TRUNG
    goc, ti_goc = ngay_duong, ti
    ngay_duong, ti = _ty_muon(ngay_duong, ti)
    la = json.loads(_chay(_d(ngay_duong), ti, gioi_tinh, ngon_ngu,
                          am=_am(ngay_duong, tz_lich) if lich == "viet" else "",
                          fix_leap=thang_nhuan == "thang_sau"))
    if ti_goc == 12:
        # nhãn hiển thị (ngày dương / âm, "Tý muộn") giữ theo ngày giờ người dùng nhập; sao, cung, tứ trụ theo ngày sau
        nhan = json.loads(_chay(_d(goc), 12, gioi_tinh, ngon_ngu, am=_am(goc, tz_lich) if lich == "viet" else "",
                                fix_leap=thang_nhuan == "thang_sau"))
        la.update({k: nhan[k] for k in ("solarDate", "lunarDate", "time", "timeRange")})
        la["ty_muon_an_ngay_sau"] = True
    if hoa_linh == "viet":
        _dat_hoa_linh_viet(la, ngay_duong, ti, gioi_tinh, tz_lich)
    return la


def _ty_muon(ngay: dt.date, ti: int) -> tuple[dt.date, int]:
    """EN-6 BI-2: Tử vi đổi ngày lúc 23:00 (quyết định 2026-08-15, theo iztro) — giờ Tý muộn (time_index 12) an ĐÚNG như
    sinh ngày hôm sau, giờ Tý. Trước đây ngày âm Việt của ngày sinh được đưa vào iztro rồi iztro tự cộng một ngày âm →
    sai ở ngày cuối tháng âm (30 → "31") và nửa sau tháng nhuận; đêm giao thừa lệch cả năm (Hoả / Linh)."""
    return (ngay + dt.timedelta(days=1), 0) if ti == 12 else (ngay, ti)


def chuan_sinh(sinh: dict | None) -> dict | None:
    """EN-6 BI-2 (sau review): chuẩn hoá giờ Tý muộn cho MỌI phép tính Python quanh lá số (lưu nguyệt, năm âm sinh,
    sao hạn…) — cùng ngày với lá số iztro. `tz_lich` của `sinh` phải đã tính cho ngày sau (`_DauVao` làm)."""
    if sinh and sinh.get("ti") == 12 and sinh.get("ngay"):
        ngay, ti = _ty_muon(sinh["ngay"], 12)
        return {**sinh, "ngay": ngay, "ti": ti}
    return sinh


def _d(x: dt.date) -> str:
    return f"{x.year}-{x.month}-{x.day}"


def van_han(ngay_duong: dt.date, ti: int, gioi_tinh: str, ngay_xem: dt.date,
            chi_tiet: bool = False, tz_lich: float = config.CALENDAR_MERIDIAN_TZ,
            thang_nhuan: str = "thang_sau", lich: str = "viet") -> dict:
    """Đại hạn / tiểu hạn / lưu niên tại `ngay_xem` (iztro astro.horoscope, tên tiếng Việt).

    `chi_so` là vị trí cung trong mảng 12 cung của lá số (0 = cung Dần); `cung_goc` là tên
    cung của lá số gốc tại vị trí đó. Tuổi là tuổi mụ (đổi vào Tết âm lịch).
    """
    if not 0 <= ti <= 12:
        raise ValueError("time_index phải trong 0..12")
    if gioi_tinh not in ("nam", "nu"):
        raise ValueError("gioi_tinh phải là 'nam' hoặc 'nu'")
    viet = lich != "trung"
    ngay_duong, ti = _ty_muon(ngay_duong, ti)
    la = json.loads(_chay(_d(ngay_duong), ti, gioi_tinh, "vi-VN", _d(ngay_xem),
                          am=_am(ngay_duong, tz_lich) if viet else "",
                          am_xem=_am(ngay_xem, config.CALENDAR_MERIDIAN_TZ) if viet else "",
                          fix_leap=thang_nhuan == "thang_sau"))
    h, cung = la["horoscope"], la["palaces"]

    def _lop(o: dict, tu_hoa: bool = True) -> dict:
        m = {"chi_so": o["index"], "can": o["heavenlyStem"], "chi": o["earthlyBranch"]}
        if tu_hoa:
            m["tu_hoa"] = o["mutagen"]
        if tu_hoa and chi_tiet:
            # Tên cung lưu + sao lưu đặt theo vị trí 12 cung của lá số gốc (để vẽ lớp phủ).
            m["ten_cung"] = o.get("palaceNames", [])
            m["sao"] = [[x["name"] for x in ds] for ds in o.get("stars", [])]
            m["tu_hoa_sao"] = _tu_hoa_sao(o["mutagen"], cung)
        return m

    dh = cung[h["decadal"]["index"]]["decadal"]["range"]
    if chi_tiet:
        _ln = h["yearly"]
        _ln_vong = _ln.get("suiqian12", [])
    return {
        "tuoi_mu": h["age"]["nominalAge"],
        "dai_han": {**_lop(h["decadal"]), "tu_tuoi": dh[0], "den_tuoi": dh[1],
                    "cung_goc": cung[h["decadal"]["index"]]["name"]},
        "tieu_han": {**_lop(h["age"], False), "cung_goc": cung[h["age"]["index"]]["name"]},
        "luu_nien": {**_lop(h["yearly"]), "cung_goc": cung[h["yearly"]["index"]]["name"],
                     **({"vong_thai_tue": _ln_vong} if chi_tiet else {})},
    }


_MA_HOA = ("loc", "quyen", "khoa", "ky")


def _tu_hoa_sao(tu_hoa: list[str], cung: list[dict]) -> list[dict]:
    """TV-HOA-HAN: bốn sao hoá [Lộc, Quyền, Khoa, Kỵ] của một lớp hạn (mảng `mutagen` iztro đã tính) + cung GỐC nơi sao
    đóng trên chính lá số đó — chỉ đọc vị trí, không tính thêm. `chi_so` theo mảng 12 cung của lá số (0 = cung Dần)."""
    noi = {s["name"]: (k, s in p["majorStars"]) for k, p in enumerate(cung) for s in p["majorStars"] + p["minorStars"]}
    ra = []
    for ma, sao in zip(_MA_HOA, tu_hoa):
        k, chinh = noi.get(sao, (None, False))
        ra.append({"hoa": ma, "sao": sao, "chi_so": k, "cung": cung[k]["name"] if k is not None else None,
                   "chi": cung[k]["earthlyBranch"] if k is not None else None, "chinh_tinh": chinh})
    return ra


# EN-5.2 — sao lưu năm: tên iztro (vi-VN) → mã; vị trí đọc từ kết quả iztro (stars + suiqian12), không tự tính lại.
_SAO_LUU = {"Lưu Lộc": "loc", "Lưu Dương": "kinh", "Lưu Đà": "da", "Lưu Mã": "ma", "Lưu Khôi": "khoi",
            "Lưu Việt": "viet", "Lưu Xương": "xuong", "Lưu Khúc": "khuc", "Lưu Loan": "loan", "Lưu Hỷ": "hy"}
_VONG_LUU = {"Tuế Kiện": "thai_tue", "Tang Môn": "tang_mon", "Bạch Hổ": "bach_ho", "Điếu Khách": "dieu_khach"}
_CHI_CUNG = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]   # chỉ số 0 = cung Dần


def sao_luu_nam(ngay_duong: dt.date, ti: int, gioi_tinh: str, ngay_xem: dt.date, **kw) -> dict:
    """Sao lưu của năm (lưu niên) tại `ngay_xem`: {"can", "chi", "sao": {mã: chi cung}, "vong": {mã: chi cung}}.
    Cùng lời gọi iztro (đã nhớ) với `van_han`."""
    ln = van_han(ngay_duong, ti, gioi_tinh, ngay_xem, chi_tiet=True, **kw)["luu_nien"]
    sao = {_SAO_LUU[t]: _CHI_CUNG[i] for i, ds in enumerate(ln.get("sao", [])) for t in ds if t in _SAO_LUU}
    vong = {_VONG_LUU[t]: _CHI_CUNG[i] for i, t in enumerate(ln.get("vong_thai_tue", [])) if t in _VONG_LUU}
    return {"can": ln["can"], "chi": ln["chi"], "sao": sao, "vong": vong}



def nap_truoc(ngay_duong: dt.date, ti: int, gioi_tinh: str, ds_xem: list[dt.date],
              tz_lich: float = config.CALENDAR_MERIDIAN_TZ, thang_nhuan: str = "thang_sau", lich: str = "viet") -> None:
    """EN-4 (mục 1b): MỘT lời gọi iztro cho lá số + nhiều ngày xem, điền sẵn bộ nhớ cho `an_sao_tho(...)` và từng
    `van_han(..., ngay_xem)` cùng tham số (kết quả trùng khít gọi lẻ — tests/test_en4_node_chay_san.py). Tắt chạy sẵn /
    lỗi → không làm gì, các lời gọi lẻ vẫn chạy như cũ."""
    if not _dung_chay_san() or not 0 <= ti <= 12 or gioi_tinh not in ("nam", "nu"):
        return
    ngay_duong, ti = _ty_muon(ngay_duong, ti)
    viet = lich != "trung"
    tz_sinh = TZ_TRUNG if lich == "trung" else tz_lich
    ngay, am = _d(ngay_duong), (_am(ngay_duong, tz_sinh) if viet else "")
    fix = thang_nhuan == "thang_sau"
    am_vh = _am(ngay_duong, tz_lich) if viet else ""          # van_han dùng tz_lich (như hàm van_han)
    con = []
    for x in dict.fromkeys(ds_xem):
        k = (ngay, ti, gioi_tinh, "vi-VN", _d(x), am_vh, _am(x, config.CALENDAR_MERIDIAN_TZ) if viet else "", fix)
        with _NHO_KHOA:
            if k not in _NHO:
                con.append((x, k))
    k_la = (ngay, ti, gioi_tinh, "vi-VN", "", am, "", fix)
    with _NHO_KHOA:
        can_la = k_la not in _NHO
    if not con and not can_la:
        return
    try:
        phien_ban_iztro()
        ds = [{"ngay_xem": _d(x), **({"am_xem": json.loads(k[6])} if k[6] else {})} for x, k in con] or \
            [{"ngay_xem": _d(ngay_duong)}]
        ra = json.loads(_may().goi(dict(ngay=ngay, ti=ti, gioi_tinh=gioi_tinh, ngon_ngu="vi-VN", ngay_xem="",
                                        am=am_vh or am, am_xem="", fix_leap=fix, ds_xem=ds)))
    except Exception:  # noqa: BLE001 — chỉ là nạp trước; lỗi thì các lời gọi lẻ tự chạy
        return
    la = ra["la"]
    if can_la and am == (am_vh or am):
        _cat(k_la, json.dumps(la, ensure_ascii=False))
    for (x, k), h in zip(con, ra["xem"]):
        _cat(k, json.dumps({**la, "horoscope": h["horoscope"]}, ensure_ascii=False))


def ngay_xem_can(sinh: dict, ngay_xem: dt.date) -> list[dt.date]:
    """Các ngày xem một báo cáo / câu hỏi Tử vi sẽ cần (ngày xem + giữa năm âm này và năm sau — mốc mà lưu nguyệt và
    nhịp 3 tháng dùng) để `nap_truoc` gọi iztro một lần."""
    tz_xem = TZ_TRUNG if sinh.get("lich", "viet") == "trung" else config.CALENDAR_MERIDIAN_TZ
    nam_am = lunar.solar_to_lunar(ngay_xem.day, ngay_xem.month, ngay_xem.year, tz_xem)[2]
    ra = [ngay_xem]
    for n in (nam_am, nam_am + 1):
        d, m, y = lunar.lunar_to_solar(1, 7, n, 0, tz_xem)
        ra.append(dt.date(y, m, d))
    return ra


def nap_truoc_sinh(sinh: dict, ngay_xem: dt.date) -> None:
    sinh = chuan_sinh(sinh)
    nap_truoc(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], ngay_xem_can(sinh, ngay_xem),
              tz_lich=sinh.get("tz_lich", config.CALENDAR_MERIDIAN_TZ), thang_nhuan=sinh.get("thang_nhuan", "thang_sau"),
              lich=sinh.get("lich", "viet"))
