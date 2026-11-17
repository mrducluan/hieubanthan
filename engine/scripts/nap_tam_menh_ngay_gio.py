# -*- coding: utf-8 -*-
"""TK-2 việc 3 — cắt Tam Mệnh Thông Hội quyển 8–9 thành 120 đơn vị NGÀY sinh (10 can) × GIỜ sinh (12 chi).

Cấu trúc sách (bản Tứ khố trong `fixtures/nguon/tam_menh_thong_hoi_du_bo.json`): mỗi quyển 60 mục «六X日YZ時斷»; mỗi mục gồm
  (1) bài ca bốn câu bảy chữ (28 chữ) nói chung cho sáu ngày cùng can gặp giờ ấy,
  (2) một đoạn văn xuôi «X日YZ時…» giải bài ca,
  (3) sáu đoạn riêng từng trụ ngày (甲子日…, 甲寅日…) kèm lá số người xưa trong 〔…〕,
  (4) vài bài ca kết.
Tệp này chỉ lấy (1) — bài ca chung — làm `han` của KB `app/kb/data/battu_ngay_gio.json`, khoá "<can ngày>|<chi giờ>".
Trụ giờ của sách theo phép Ngũ Thử Độn (ngày Giáp, Kỷ khởi giờ Giáp Tý…) nên can ngày + chi giờ xác định đúng một mục.

Chạy lại (tất định): `PYTHONPATH=. .venv/bin/python scripts/nap_tam_menh_ngay_gio.py` — chỉ làm mới `han`, `tru_gio`;
lời Việt (`am`, `y`, `nhom`, `ham_y`, `viec`…) do ban biên tập viết trong tệp KB, script không đụng. `--kiem` chỉ so, không ghi.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
NGUON = GOC / "fixtures" / "nguon" / "tam_menh_thong_hoi_du_bo.json"
KB = GOC / "app" / "kb" / "data" / "battu_ngay_gio.json"

CAN_HAN, CHI_HAN = "甲乙丙丁戊己庚辛壬癸", "子丑寅卯辰巳午未申酉戌亥"
CAN = ("Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý")
CHI = ("Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi")
_DAU_MUC = re.compile(r"六(.)日(.{1,2})時斷")
_CHU_NHO = re.compile(r"〔[^〕]*〕")
_HAN = re.compile(r"[㐀-鿿\U00020000-\U0002ffff]")
_DI_THE = {"已": "己", "夘": "卯"}          # chữ dị thể / chép lẫn trong bản Tứ khố (chỉ dùng để ĐỐI CHIẾU đầu mục, không sửa `han`)


def tru_gio(i_can: int, i_chi: int) -> str:
    """Ngũ Thử Độn: can giờ Tý = (can ngày mod 5) × 2; mỗi giờ tiến một can."""
    return CAN_HAN[((i_can % 5) * 2 + i_chi) % 10] + CHI_HAN[i_chi]


def cat() -> dict[str, dict]:
    """120 mục: khoá "<can>|<chi>" → {han (28 chữ bài ca), tru_gio, quyen, dau_muc, doan (toàn văn mục, để định vị)}."""
    thien = {t["so"]: t["van"] for t in json.loads(NGUON.read_text("utf-8"))["thien"]}
    ra: dict[str, dict] = {}
    for quyen, can0 in ((8, 0), (9, 5)):
        van = thien[quyen]
        ds = list(_DAU_MUC.finditer(van))
        assert len(ds) == 60, (quyen, len(ds))
        for i, m in enumerate(ds):
            i_can, i_chi = can0 + i // 12, i % 12
            # Đầu mục phải đúng can ngày (己 hay bị chép thành 已 / 巳) và đúng chi giờ.
            can_dau = _DI_THE.get(m.group(1), m.group(1))
            assert can_dau == CAN_HAN[i_can] or (i_can == 5 and m.group(1) == "巳"), (quyen, i, m.group())
            chi_dau = _DI_THE.get(m.group(2)[-1], m.group(2)[-1])
            assert chi_dau == CHI_HAN[i_chi], (quyen, i, m.group())
            doan = van[m.end(): ds[i + 1].start() if i + 1 < len(ds) else len(van)]
            chu = "".join(_HAN.findall(_CHU_NHO.sub("", doan)))
            ra[f"{CAN[i_can]}|{CHI[i_chi]}"] = {"han": chu[:28], "tru_gio": tru_gio(i_can, i_chi), "quyen": quyen,
                                                "dau_muc": m.group(), "doan": doan}
    return ra


def main() -> int:
    cac = cat()
    kb = json.loads(KB.read_text("utf-8")) if KB.exists() else {}
    muc = kb.setdefault("muc", {})
    lech = 0
    for k, c in cac.items():
        cu = muc.setdefault(k, {})
        if cu.get("han") != c["han"] or cu.get("tru_gio") != c["tru_gio"]:
            lech += 1
            cu.update({"han": c["han"], "tru_gio": c["tru_gio"]})
    if "--kiem" in sys.argv:
        print(f"{len(cac)} mục, {lech} mục lệch với KB")
        return 1 if lech else 0
    KB.write_text(json.dumps(kb, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"{len(cac)} mục, làm mới {lech} mục → {KB.relative_to(GOC)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
