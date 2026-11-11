# -*- coding: utf-8 -*-
"""QTE-2 — MỘT hàm đọc tệp KB cho mọi module tầng KB, có LỚP PHỦ theo ngôn ngữ.

`doc("tuvi_kb.json")` trả JSON gốc tiếng Việt; khi ngôn ngữ của lượt gọi (`app.ngon_ngu.hien_tai()`) là "en" và có
`data/en/tuvi_kb.json` (bản phủ do `scripts/chuyen_ngu.py` sinh, người bản xứ duyệt) thì gộp: chuỗi nào bản phủ có thì
thay, chuỗi nào chưa dịch giữ tiếng Việt (web gắn nhãn theo `trang_thai_phu`). Không có bản phủ → kết quả y hệt
`json.loads` tệp gốc (test `tests/test_kb_nap.py` so từng tệp). Kết quả được nhớ theo (tệp, ngôn ngữ); `nho()` thay
`functools.lru_cache` cho mọi hàm tầng KB sinh ra CHỮ — khoá nhớ luôn kèm ngôn ngữ để bản Việt / bản Anh không lẫn nhau.

Quy tắc gộp (khớp bản phủ `quy_trinh.chuyen` sinh ra):
- dict ∘ dict → gộp từng khoá; khoá chỉ có ở bản phủ (vd `_trang_thai`) không đưa vào (bản phủ không thêm dữ kiện);
  bản phủ ghi `null` cho một khoá → khoá đó BỎ khỏi kết quả (QTE-2: để bản dịch tắt một trường chưa dịch — mã gọi
  phải có đường rơi về, vd lá Tarot không có `viec_lv` thì dùng `viec`);
- list ∘ list → gộp theo chỉ số (bản phủ ngắn hơn thì phần còn lại giữ gốc); phần tử `{}` ở bản phủ = chưa dịch; danh sách
  CHUỖI mà bản phủ dài hơn → nối thêm phần dư (từ khoá tiếng Anh có thể nhiều hơn);
- str ∘ str không rỗng → lấy bản phủ; mọi kiểu khác (số, bool) → giữ gốc (bản phủ không được đổi số liệu).
"""
from __future__ import annotations

import json
import threading
from collections.abc import Callable
from functools import wraps
from pathlib import Path
from typing import Any

from app import ngon_ngu

DATA = Path(__file__).parent / "data"
_KHOA = threading.Lock()
_NHO: dict[tuple[str, str, str | None], Any] = {}


def duong(ten: str, ngon_ngu_: str | None = None) -> Path:
    """Đường dẫn tệp: gốc ở `data/<ten>`, bản phủ ở `data/<ngôn ngữ>/<ten>`."""
    return DATA / ten if not ngon_ngu_ or ngon_ngu_ == ngon_ngu.MAC_DINH else DATA / ngon_ngu_ / ten


def gop(goc: Any, phu: Any) -> Any:
    """Trả BẢN SAO của `goc` đã phủ `phu` theo quy tắc ở đầu tệp (không sửa đối số)."""
    if isinstance(goc, dict):
        if not isinstance(phu, dict):
            return json.loads(json.dumps(goc))
        return {k: (gop(v, phu[k]) if k in phu else json.loads(json.dumps(v))) for k, v in goc.items()
                if not (k in phu and phu[k] is None)}
    if isinstance(goc, list):
        if not isinstance(phu, list):
            return json.loads(json.dumps(goc))
        ra = [gop(v, phu[i]) if i < len(phu) else json.loads(json.dumps(v)) for i, v in enumerate(goc)]
        # danh sách CHUỖI (từ khoá, bí danh) ở bản phủ dài hơn gốc → nối thêm (ngôn ngữ khác có thể cần nhiều từ khoá hơn)
        them = phu[len(goc):]
        if them and all(isinstance(x, str) and x.strip() for x in them) and all(isinstance(x, str) for x in goc):
            ra += list(them)
        return ra
    if isinstance(goc, str) and isinstance(phu, str) and phu.strip():
        return phu
    return goc


def _doc_tho(p: Path) -> Any:
    return json.loads(p.read_text(encoding="utf-8"))


def doc(ten: str) -> Any:
    """JSON của tệp KB `ten` theo ngôn ngữ hiện tại (nhớ theo tệp + ngôn ngữ). Tệp gốc không có → FileNotFoundError
    như `read_text` (module gọi tự quyết bắt hay không — giữ hành vi cũ)."""
    nn = ngon_ngu.hien_tai()
    bt = ngon_ngu.bien_the()          # Ý7: "en-us"… chồng lên bản phủ ngôn ngữ (vi → en → en-us)
    k = (ten, nn, bt)
    try:
        return _NHO[k]
    except KeyError:
        pass
    goc = _doc_tho(duong(ten))
    if nn != ngon_ngu.MAC_DINH:
        p = duong(ten, nn)
        if p.exists():
            goc = gop(goc, _doc_tho(p))
        if bt:
            pb = duong(ten, bt)
            if pb.exists():
                goc = gop(goc, _doc_tho(pb))
    with _KHOA:
        _NHO.setdefault(k, goc)
    return _NHO[k]


def trang_thai_phu(ten: str) -> str | None:
    """`_trang_thai` của bản phủ ngôn ngữ hiện tại (`nhap_may` / `da_duyet`), None khi đọc tiếng Việt hoặc chưa có bản phủ."""
    nn = ngon_ngu.hien_tai()
    if nn == ngon_ngu.MAC_DINH:
        return None
    p = duong(ten, nn)
    if not p.exists():
        return None
    d = _doc_tho(p)
    return d.get("_trang_thai") if isinstance(d, dict) else None


def co_ban_phu(ten: str, ngon_ngu_: str) -> bool:
    return ngon_ngu_ != ngon_ngu.MAC_DINH and duong(ten, ngon_ngu_).exists()


def nho(fn: Callable) -> Callable:
    """Thay `functools.lru_cache` cho hàm tầng KB: nhớ theo (ngôn ngữ hiện tại, đối số). Có `cache_clear()` như lru_cache."""
    kho: dict[tuple, Any] = {}

    @wraps(fn)
    def boc(*a, **kw):
        k = (ngon_ngu.hien_tai(), ngon_ngu.bien_the(), a, tuple(sorted(kw.items())))
        try:
            return kho[k]
        except KeyError:
            v = fn(*a, **kw)
            with _KHOA:
                kho.setdefault(k, v)
            return kho[k]

    boc.cache_clear = kho.clear  # type: ignore[attr-defined]
    return boc


def xoa_nho() -> None:
    """Xoá bộ nhớ tệp (test / sau khi script sinh bản phủ)."""
    with _KHOA:
        _NHO.clear()
