# -*- coding: utf-8 -*-
"""TK-2 việc 5 — cắt «焦氏易林» (Tiêu Thị Dịch Lâm, Tiêu Diên Thọ đời Hán — cổ thư công cộng) thành 64 × 64 bài từ:
quẻ bản → quẻ biến (không hào động: bài của chính quẻ ấy). Nguồn: kho nguồn `tieu_thi_dich_lam.json` (bản Tứ khố).

    python scripts/nap_dich_lam.py      # ghi app/kb/data/kinhdich_dich_lam.json
Mỗi phần «X之第N» chép 64 bài theo thứ tự: chính quẻ X trước, rồi 63 quẻ còn lại theo thứ tự Văn Vương. Bài bắt đầu ở đầu
dòng bằng tên quẻ; tên quẻ trong sách có dị thể (剥 / 剝, 兊 / 兌…). Chú chữ nhỏ 〔…〕 (dẫn chéo dị bản) bỏ. Không sửa chữ sách.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
NGUON = GOC / "fixtures" / "nguon" / "tieu_thi_dich_lam.json"
DICH = GOC / "app" / "kb" / "data" / "kinhdich_dich_lam.json"
DI_THE = {"剥": ["剝"], "兊": ["兌", "兑"], "泰": ["㤗"], "㢲": ["巽"], "无妄": ["無妄"], "恒": ["恆"], "晉": ["晋"], "蒙": ["䝉"],
          "豐": ["豊"], "姤": ["遘"], "既濟": ["旣濟"], "小畜": ["小蓄"], "大畜": ["大蓄"], "遯": ["遁"], "蠱": ["蛊"], "隨": ["随"],
          "歸妹": ["歸妺", "歸昧"], "睽": ["暌"], "鼎": ["鼑"], "頤": ["頥"], "渙": ["涣"], "解": ["觧"], "升": ["昇"]}
# Bản Tứ khố chép nhầm tên quẻ ở đầu bài (vị trí theo thứ tự vẫn đúng): phần 艮, bài thứ 10 ghi 小過 thay cho 小畜.
CHEP_NHAM = {("艮", "小畜"): "小過"}


def cat(van: str) -> tuple[list[str], dict[int, dict[int, str]], list[str]]:
    dau = list(re.finditer(r"^(\S{1,3})之第(\S{1,4})$", van, re.M))
    ten = [m.group(1) for m in dau]
    ra: dict[int, dict[int, str]] = {}
    loi: list[str] = []
    for k, m in enumerate(dau):
        than = re.sub(r"〔[^〕]*〕", "", van[m.end():dau[k + 1].start() if k + 1 < len(dau) else len(van)])
        thu_tu = [k] + [j for j in range(len(ten)) if j != k]
        bai: dict[int, str] = {}
        i, dang = 0, None
        for dong in (d for d in than.split("\n") if d.strip()):
            trung = None
            if i < len(thu_tu):
                can = ten[thu_tu[i]]
                ung = [can, *DI_THE.get(can, [])] + ([CHEP_NHAM[(ten[k], can)]] if (ten[k], can) in CHEP_NHAM else [])
                trung = next((u for u in ung if dong.startswith(u)), None)
            if trung:
                dang = thu_tu[i]
                bai[dang] = dong[len(trung):]
                i += 1
            elif dang is not None:
                bai[dang] += dong
        if i != len(thu_tu):
            loi.append(f"{ten[k]}: thấy {i}/64 bài")
        ra[k] = bai
    return ten, ra, loi


def dung() -> dict:
    d = json.loads(NGUON.read_text("utf-8"))
    ten, ra, loi = cat("\n".join(t["van"] for t in d["thien"]))
    if loi or len(ten) != 64:
        raise SystemExit(f"cắt hỏng: {loi}")
    return {"_nguon": "焦氏易林 (Tiêu Thị Dịch Lâm), Tiêu Diên Thọ (Hán) — bản Văn Uyên Các Tứ khố toàn thư. Cổ thư công cộng.",
            "source_id": "tieu_thi_dich_lam", "school_id": "kinh_dich", "trang_thai": "nguyen_van_chua_dich", "can_doi_chieu": True,
            "ten_han": ten,
            "tu": {str(k + 1): {str(j + 1): v for j, v in sorted(b.items())} for k, b in sorted(ra.items())}}


if __name__ == "__main__":
    out = dung()
    DICH.write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", "utf-8")
    print("kinhdich_dich_lam:", sum(len(b) for b in out["tu"].values()), "bài")
