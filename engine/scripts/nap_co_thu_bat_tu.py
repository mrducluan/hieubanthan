"""Dựng kho nguồn Bát tự (cổ thư công cộng) vào engine/fixtures/nguon/.

1) Tử Bình Chân Thuyên (子平真詮, Thẩm Hiếu Chiêm, đời Thanh) — 47 thiên, từ tệp chữ rút bằng `pdftotext` của bản
   «子平真诠-沈孝瞻原著» (chữ giản thể, có chấm câu hiện đại) do chủ dự án cung cấp:
       python scripts/nap_co_thu_bat_tu.py tbct /duong/dan/tb.txt
2) Cùng Thông Bảo Giám (窮通寶鑑) — 120 ô nhật can × tháng: câu nguyên văn + can điều hậu đã soát từng ô với nguyên văn,
   lấy từ bộ dữ liệu tianzhi-classics (mã + metadata MIT; chỉ lấy câu cổ văn và danh sách can, KHÔNG lấy lời dịch hiện đại):
       python scripts/nap_co_thu_bat_tu.py dieu_hau /duong/dan/tianzhi-classics
   Lệnh này cũng ghi lại bảng `app/kb/data/battu_dieu_hau.json` (bang + trich).
3) Uyên Hải Tử Bình (淵海子平, Từ Thăng đời Tống; bản hợp biên «Uyên Hải» + «Uyên Nguyên» đời Minh) — từ tệp chữ thuần
   (giản thể, chấm câu hiện đại) chủ dự án lưu trên Drive, xuất ra .txt:
       python scripts/nap_co_thu_bat_tu.py uyen_hai /duong/dan/uhtb.txt
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
NGUON = GOC / "fixtures" / "nguon"
CAN = dict(zip("甲乙丙丁戊己庚辛壬癸", ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]))
CHI = dict(zip("寅卯辰巳午未申酉戌亥子丑", ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]))
_DAU = re.compile(r"^\s*([一二三四五六七八九十]+)、(论\S.*?)\s*$")


def tbct(tep: Path) -> dict:
    dong = tep.read_text(encoding="utf-8").replace("\f", "\n").splitlines()
    thien, cur, da_qua_muc_luc = [], None, False
    for d in dong:
        m = _DAU.match(d)
        if m and "...." in d:
            continue                                   # dòng mục lục
        if m:
            da_qua_muc_luc = True
            cur = {"so": len(thien) + 1, "ten": m.group(2), "van": ""}
            thien.append(cur)
            continue
        d = d.strip()
        if not da_qua_muc_luc or cur is None or not d or re.fullmatch(r"\d+", d):
            continue
        if len(cur["van"]) < 40 and not re.search(r"[，。；]", cur["van"] + d) and len(d) < 12:
            cur["ten"] += d                            # tên thiên bị xuống dòng
            continue
        cur["van"] += re.sub(r"（[^（）]*[a-z]+\d[^（）]*）", "", d)   # bỏ chú âm đọc kiểu (淑慝 te4)
    return {"_nguon": "子平真詮 (Tử Bình Chân Thuyên), Thẩm Hiếu Chiêm, đời Thanh — nguyên tác 47 thiên. Cổ thư công cộng.",
            "ban": "bản điện tử «子平真诠-沈孝瞻原著» (giản thể, chấm câu hiện đại) do chủ dự án cung cấp 2026-11-12",
            "source_id": "tu_binh_chan_thuyen", "school_id": "tu_binh", "thien": thien}


_UH_DAU = re.compile(r"^《([^》]+)》(.*)$")


def uyen_hai(tep: Path) -> dict:
    """Cắt theo dòng tiêu đề «《…》». Mục «诗诀» và mục một chữ (can / chi của «干支体象») ghi `thuoc` = thiên đứng trước."""
    thien: list[dict] = [{"so": 1, "ten": "基础", "van": []}]
    cha = "基础"
    for d in tep.read_text(encoding="utf-8-sig").splitlines():
        d = d.strip()
        if not d or d == "【渊海子平】" or d == "基 础":
            continue
        m = _UH_DAU.match(d)
        if not m:
            thien[-1]["van"].append(d)
            continue
        ten, sau = m.group(1).replace(" ", ""), m.group(2).strip()
        muc = {"so": len(thien) + 1, "ten": ten, "van": []}
        con = ten == "诗诀" or (len(ten) == 1 and cha == "干支体象") or sau.startswith("★")
        if con and ten != cha:
            muc["thuoc"] = cha
        else:
            cha = ten
        if sau.startswith("★"):
            muc["van"].append(sau[1:])
        elif sau and len(sau) <= 12 and not re.search(r"[，。；：]", sau):
            muc["phu"] = sau.replace(" ", "")
        elif sau:
            muc["van"].append(sau)
        thien.append(muc)
    return {"_nguon": "淵海子平 (Uyên Hải Tử Bình), Từ Thăng (Từ Tử Bình môn hạ, đời Tống) soạn; bản hợp biên «Uyên Hải» + «Uyên Nguyên» "
                      "đời Minh. Cổ thư công cộng.",
            "ban": "bản điện tử lưu truyền (giản thể, chấm câu hiện đại, đã lược bớt so với bản khắc) do chủ dự án cung cấp 2026-11-12 — "
                   "CHƯA đối chiếu bản khắc; chữ dị thể giữ nguyên như tệp",
            "can_doi_chieu": True,
            "source_id": "uyen_hai_tu_binh", "school_id": "tu_binh", "thien": thien}


def dieu_hau(thu_muc: Path) -> tuple[dict, dict]:
    bang = json.loads((thu_muc / "bazi/tiaohou.json").read_text(encoding="utf-8"))
    muc = json.loads((thu_muc / "bazi/entries/qiongtong.json").read_text(encoding="utf-8"))["entries"]
    o: dict = {}
    for c, vc in CAN.items():
        o[vc] = {}
        for z, vz in CHI.items():
            e = muc[c][z]
            trong_cau = [CAN[x] for x in e["rule_from_text"]]
            # Thứ tự theo đúng câu sách («先丁后庚»); can bộ dữ liệu có thêm (sách nêu ở đoạn sau của tháng) xếp sau.
            # Nhật can không tự làm dụng thần điều hậu cho chính mình khi câu sách không nêu.
            them = [CAN[x] for x in bang[c][z] if CAN[x] not in trong_cau and CAN[x] != vc]
            o[vc][vz] = {"can": trong_cau + them, "can_trong_cau": trong_cau,
                         "trich": e["quote"], "muc": e["loc"]}
    fx = {"_nguon": "窮通寶鑑 (Cùng Thông Bảo Giám; còn gọi Lan Giang Võng, Tạo Hoá Nguyên Thược), Dư Xuân Đài biên — 120 ô nhật can × tháng. "
                    "Cổ thư công cộng. `trich` = câu then chốt của ô; `can_trong_cau` = can đọc thẳng từ câu đó; `can` = bảng điều hậu: "
                    "can trong câu trước (đúng thứ tự sách), rồi tới can sách nêu ở đoạn sau của tháng / tổng luận mùa.",
          "ban": "bộ dữ liệu tianzhi-classics, commit 047b827 (đối chiếu Wikisource «穷通宝鉴»)",
          "source_id": "cung_thong_bao_giam", "school_id": "dieu_hau", "o": o}
    return fx, o


def _ghi(tep: Path, d: dict) -> None:
    tep.parent.mkdir(parents=True, exist_ok=True)
    tep.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    lenh, duong = sys.argv[1], Path(sys.argv[2])
    if lenh == "tbct":
        d = tbct(duong)
        _ghi(NGUON / "tu_binh_chan_thuyen.json", d)
        print(len(d["thien"]), "thiên;", sum(len(t["van"]) for t in d["thien"]), "chữ")
    elif lenh == "uyen_hai":
        d = uyen_hai(duong)
        _ghi(NGUON / "uyen_hai_tu_binh.json", d)
        print(len(d["thien"]), "mục;", sum(len(x) for t in d["thien"] for x in t["van"]), "chữ")
    elif lenh == "dieu_hau":
        fx, o = dieu_hau(duong)
        _ghi(NGUON / "cung_thong_bao_giam.json", fx)
        kb_tep = GOC / "app/kb/data/battu_dieu_hau.json"
        kb = json.loads(kb_tep.read_text(encoding="utf-8"))
        cu = kb["bang"]
        doi = [(c, z, cu[c][z], o[c][z]["can"]) for c in o for z in o[c] if cu[c][z] != o[c][z]["can"]]
        kb["bang"] = {c: {z: o[c][z]["can"] for z in cu[c]} for c in cu}
        kb["trich"] = {c: {z: o[c][z]["trich"] for z in cu[c]} for c in cu}
        kb["_nguon"] = ("Cùng Thông Bảo Giám (窮通寶鑑, Dư Xuân Đài biên; gốc Lan Giang Võng) — bảng dụng thần điều hậu 10 nhật chủ × 12 tháng, "
                        "đã đối chiếu nguyên văn từng ô; thứ tự can theo đúng câu sách.")
        kb["trang_thai"], kb["can_doi_chieu"] = "da_doi_chieu_nguyen_van", False
        _ghi(kb_tep, kb)
        print(len(doi), "ô đổi")
        for x in doi:
            print(" ", *x)
