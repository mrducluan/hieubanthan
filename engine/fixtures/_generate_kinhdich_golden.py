# -*- coding: utf-8 -*-
"""Sinh golden Kinh Dịch TỪ BẢN GỐC source-skills/kinh-dich/gieoque.py.

Bản gốc do chủ dự án tự viết (sở hữu 100%). KHÔNG dùng horosa (AGPL-3.0,
phải cách ly — xem docs/NHAT-KY-DU-AN.md mục 4).

Gồm:
  - que_64: cả 64 quẻ (6 hào tĩnh) — số King Wen, tên, bát cung, thế ứng,
    nạp giáp, lục thân; hỗ/thác/tống lưu dạng số King Wen.
  - bien_chiem: các ca hào động có chủ đích, phủ đủ 0→6 hào động và hai ca
    đặc biệt Dụng Cửu (Càn) / Dụng Lục (Khôn).

    python engine/fixtures/_generate_kinhdich_golden.py
"""
from __future__ import annotations

import importlib.util
import itertools
import json
from pathlib import Path

GOC = Path(__file__).parents[2] / "source-skills" / "kinh-dich" / "gieoque.py"
DICH = Path(__file__).parent / "golden" / "kinhdich.json"


def nap_ban_goc():
    spec = importlib.util.spec_from_file_location("gieoque_goc", GOC)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# Giá trị hào 1→6 (6 lão âm, 7 thiếu dương, 8 thiếu âm, 9 lão dương)
BIEN_CHIEM = {
    "tinh_0_dong":        [7, 8, 7, 8, 7, 8],
    "dong_1_hao":         [7, 7, 9, 8, 8, 8],
    "dong_2_hao":         [6, 7, 8, 9, 7, 8],
    "dong_3_hao":         [9, 6, 9, 8, 8, 7],
    "dong_4_hao":         [9, 9, 6, 6, 7, 8],
    "dong_5_hao":         [6, 9, 6, 9, 6, 8],
    "dong_6_hao_thuong":  [9, 6, 9, 6, 9, 6],
    "dung_cuu_can":       [9, 9, 9, 9, 9, 9],
    "dung_luc_khon":      [6, 6, 6, 6, 6, 6],
    # Quẻ 26 động hào 3 và 6 → biến 19 (Lâm). Lưu ý: ví dụ nhật ký ở SKILL.md
    # mục 9 ghi biến 41 — đó là kết quả khi CHỈ động hào 3; ví dụ minh hoạ lệch.
    "dong_2_hao_26_3_6":  [7, 7, 9, 8, 8, 9],
}


def khoi(g, vals):
    """Tái hiện đúng phần thân main() của bản gốc, bỏ phần ngẫu nhiên/thời gian."""
    ban = tuple(1 if v in (7, 9) else 0 for v in vals)
    dong = [i + 1 for i, v in enumerate(vals) if v in (6, 9)]
    bien = tuple((1 - b) if (i + 1) in dong else b for i, b in enumerate(ban))
    return {
        "quai_ban": g.info(ban),
        "hao_dong": dong,
        "quai_bien": g.info(bien) if dong else None,
        "quai_ho": g.info(g.ho_quai(ban)),
        "quai_thac": g.info(g.thac_quai(ban)),
        "quai_tong": g.info(g.tong_quai(ban)),
        "quy_tac_doc": g.quy_tac_doc(len(dong), ban, bien, dong),
    }


def main() -> None:
    g = nap_ban_goc()
    que_64 = {}
    for bits in itertools.product((0, 1), repeat=6):
        vals = [7 if b else 8 for b in bits]
        out = khoi(g, vals)
        # Hỗ/thác/tống cũng là một trong 64 quẻ → chỉ lưu số King Wen, tránh lặp.
        for k in ("quai_ho", "quai_thac", "quai_tong"):
            out[k] = out[k]["so_king_wen"]
        que_64[str(out["quai_ban"]["so_king_wen"])] = {"gia_tri_hao": vals, "expect": out}
    assert len(que_64) == 64
    data = {
        "_nguon": "sinh tu source-skills/kinh-dich/gieoque.py (ban goc chu du an)",
        "_canh_bao": "Khong sua tay. Chay lai _generate_kinhdich_golden.py.",
        "que_64": dict(sorted(que_64.items(), key=lambda kv: int(kv[0]))),
        "bien_chiem": {k: {"gia_tri_hao": v, "expect": khoi(g, v)}
                       for k, v in BIEN_CHIEM.items()},
    }
    DICH.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"da ghi {DICH} ({len(que_64)} que + {len(BIEN_CHIEM)} ca bien chiem)")


if __name__ == "__main__":
    main()
