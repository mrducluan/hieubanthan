# -*- coding: utf-8 -*-
"""EN-3 — chống lỗi f-string nuốt lượng từ regex: `rf".{0,40}"` thành `.(0, 40)` (luật không bao giờ khớp). Quét mọi
hằng chuỗi / danh sách chuỗi ở cấp module trong app/."""
import ast
import importlib
import pkgutil
import re
from pathlib import Path

import app

_HONG = re.compile(r"\.\(\d+, \d+\)|\\[dws]\(\d+(, \d+)?\)")


def _chuoi(v):
    if isinstance(v, str):
        yield v
    elif isinstance(v, re.Pattern):
        yield v.pattern
    elif isinstance(v, (list, tuple)):
        for x in v:
            yield from _chuoi(x)
    elif isinstance(v, dict):
        for x in v.values():
            yield from _chuoi(x)


def test_khong_mau_regex_hong():
    hong = []
    for m in pkgutil.walk_packages(app.__path__, "app."):
        try:
            mod = importlib.import_module(m.name)
        except Exception:  # noqa: BLE001 — module cần môi trường riêng (vd Sentry) bỏ qua
            continue
        for k, v in vars(mod).items():
            if k.startswith("__"):
                continue
            hong += [(m.name, k, s[:80]) for s in _chuoi(v) if _HONG.search(s)]
    assert not hong, hong


def test_khong_fstring_nuot_luong_tu_ast():
    """Quét AST toàn bộ engine/app/ để bắt cả biến cục bộ trong hàm: `rf'.{0,25}'` biến `{0,25}` thành tuple `(0, 25)`."""
    goc = Path(app.__file__).resolve().parent
    loi = []
    for py in sorted(goc.rglob("*.py")):
        tree = ast.parse(py.read_text(encoding="utf-8"), filename=str(py))
        for node in ast.walk(tree):
            if isinstance(node, ast.JoinedStr):
                for val in node.values:
                    if isinstance(val, ast.FormattedValue) and isinstance(val.value, (ast.Tuple, ast.Set, ast.Constant)):
                        loi.append((str(py.relative_to(goc)), node.lineno, ast.unparse(val.value)))
    assert not loi, f"Phát hiện f-string nuốt lượng từ / hằng số trong regex: {loi}"


def test_hop_lam_an_va_sinh_con_khop():
    from app.hoidap import tuvi
    assert tuvi.phan_loai("Tôi tuổi Thìn định góp vốn mở xưởng với anh tuổi Tuất, có hợp làm ăn không")["loai"] == "hop_lam_an"
    assert tuvi.phan_loai("Con tuổi Mão mà bố tuổi Dậu có xung không")["loai"] == "sinh_con_tuoi"
