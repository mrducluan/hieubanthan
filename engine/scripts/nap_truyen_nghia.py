"""Dựng kho nguồn Chu Dịch Truyện Nghĩa Đại Toàn (周易傳義大全, Hồ Quảng, đời Minh — bản Văn Uyên Các Tứ khố toàn thư).

Đọc 24 quyển bản số hoá Kanseki Repository `KR1a0091` (cổ thư công cộng) rồi cắt theo
quẻ → đoạn kinh văn → Trình Di truyện (傳) / Chu Hy bản nghĩa (本義). Lời các nhà Tống – Nguyên in chữ nhỏ
(trong ngoặc của bản số hoá) KHÔNG chép vào kho — chỉ đếm số chữ để biết còn bao nhiêu chưa nạp.

Chạy (không cần mạng, thư mục clone do người chạy tự tải):
    git clone --depth 1 https://github.com/kanripo/KR1a0091 /tmp/KR1a0091
    python scripts/nap_truyen_nghia.py /tmp/KR1a0091

Kết quả: engine/fixtures/nguon/chu_dich_truyen_nghia.json (tất định — chạy lại ra đúng tệp cũ).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

DICH = Path(__file__).resolve().parents[1] / "fixtures" / "nguon" / "chu_dich_truyen_nghia.json"
COMMIT = "fccff29a5708136ab01c40bcb0c6e899e485abf8"
QUYEN = range(7, 31)  # tệp _007 … _030 = quyển 1 … 24
HAO = re.compile(r"^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六)")
VI_TRI = {"初": 1, "二": 2, "三": 3, "四": 4, "五": 5, "上": 6, "用": 7}
THIEN = {"繫辭上傳": "he_tu_thuong", "繫辭下傳": "he_tu_ha", "說卦傳": "thuyet_quai",
         "序卦傳": "tu_quai", "雜卦傳": "tap_quai"}
NGOAC = re.compile(r"\([^)]*\)?")
_THU_TU = "乾震坎艮坤巽離兌"
_BANG = [[1, 25, 6, 33, 12, 44, 13, 10], [34, 51, 40, 62, 16, 32, 55, 54], [5, 3, 29, 39, 8, 48, 63, 60],
         [26, 27, 4, 52, 23, 18, 22, 41], [11, 24, 7, 15, 2, 46, 36, 19], [9, 42, 59, 53, 20, 57, 37, 61],
         [14, 21, 64, 56, 35, 50, 30, 38], [43, 17, 47, 31, 45, 28, 49, 58]]  # [quái trên][quái dưới]
_DI_THE = {"兊": "兌", "兑": "兌", "离": "離", "㢲": "巽", "乹": "乾"}
QUAI = re.compile(r"\((.)下/(.)上\)")
BAN_NGHIA = re.compile("[本夲]義")
RONG = 19  # dòng chú đủ rộng (số chữ) — dùng để biết một khối chú đã hết hay còn nối dòng


def _vi_tri(ten: str) -> int:
    return VI_TRI[ten[0]] if ten[0] in "初上用" else VI_TRI[ten[1]]


def doc(thu_muc: Path) -> dict:
    que: dict[str, dict] = {}
    thien: dict[str, list] = {v: [] for v in THIEN.values()}
    chu_nho = 0
    sua: list[str] = []
    for q in QUYEN:
        ds = None       # danh sách đoạn đang ghi (của quẻ hoặc của thiên)
        so_que = None
        loai, hao, dem_tt, giu_hao = None, None, 0, None
        doan = None     # đoạn đang mở
        khoi = None     # "truyen" | "ban_nghia" đang nối dòng
        day = False     # dòng chú trước đó đầy chiều rộng (còn nối)
        noi_kinh = False
        to = ""
        for dong in (thu_muc / f"KR1a0091_{q:03d}.txt").read_text(encoding="utf-8").splitlines():
            if dong.startswith("#"):
                continue
            if dong.startswith("<pb:"):
                to = dong[4:].split(">")[0].replace("KR1a0091_WYG_", "")
                continue
            dong = dong.rstrip("¶")
            thut = dong.startswith("　")
            chu_nho += sum(len(m) - 2 for m in NGOAC.findall(dong))
            chinh = NGOAC.sub("", dong).replace("　", "").replace(" ", "")
            tran = dong.replace("　", "").strip()
            if not tran:
                continue
            if 0x4DC0 <= ord(tran[0]) <= 0x4DFF and QUAI.search(tran):
                so_que = ord(tran[0]) - 0x4DC0 + 1
                m = QUAI.search(tran)  # số quẻ theo hai quái ghi kèm — bản số hoá có chỗ gõ nhầm ký hiệu (quẻ Quan)
                if m:
                    duoi, tren = (_DI_THE.get(c, c) for c in m.groups())
                    theo_quai = _BANG[_THU_TU.index(tren)][_THU_TU.index(duoi)]
                    if theo_quai != so_que:
                        sua.append(f"{tran[0]} → quẻ {theo_quai}")
                        so_que, tran = theo_quai, chr(0x4DC0 + theo_quai - 1) + tran[1:]
                ds = que.setdefault(str(so_que), {"ky_hieu": tran[0], "quyen": q - 6, "doan": []})["doan"]
                loai, hao, dem_tt, doan, khoi, noi_kinh = "dan", None, 0, None, None, False
                continue
            if thut and tran in THIEN:
                ds, so_que = thien[THIEN[tran]], None
                loai, hao, doan, khoi, noi_kinh = "kinh", None, None, None, False
                continue
            if ds is None or "欽定四庫全書" in tran or "周易傳義大全卷" in tran or not chinh:
                if not chinh:
                    noi_kinh, day = False, False
                continue
            if not thut:  # kinh văn
                m = HAO.match(chinh)
                moi = True
                if so_que and loai != "van_ngon":
                    if chinh.startswith("彖曰"):
                        loai, giu_hao, hao = "thoan", hao, None
                    elif chinh.startswith("文言曰"):
                        loai, hao = "van_ngon", None
                    elif chinh.startswith("象曰"):
                        if so_que == 1 and dem_tt == 0:
                            hao = giu_hao
                        if hao is None or (so_que == 1 and dem_tt == 0):
                            loai, hao = "dai_tuong", None
                            dem_tt = 1 if so_que == 1 else 0
                        else:
                            loai = "tieu_tuong"
                    elif m and not (so_que == 1 and dem_tt):
                        loai, hao = "hao", _vi_tri(m.group(1))
                    elif loai == "dan":
                        loai = "quai_tu"
                    elif so_que == 1 and loai in ("dai_tuong", "tieu_tuong") and dem_tt and not noi_kinh:
                        loai, hao, dem_tt = "tieu_tuong", dem_tt, dem_tt + 1
                    else:
                        moi = not noi_kinh
                else:
                    moi = not noi_kinh
                if moi or doan is None:
                    doan = {"loai": loai, "hao": hao, "kinh": chinh, "truyen": "", "ban_nghia": "", "to": to}
                    ds.append(doan)
                else:
                    doan["kinh"] += chinh
                noi_kinh, khoi, day = True, None, False
                continue
            # dòng chú (thụt đầu dòng)
            noi_kinh = False
            truoc = ""
            dau = None
            if chinh[0] in "傳𫝊" and not (day and khoi):
                dau, chinh, khoi = "truyen", chinh[1:], "truyen"
                if doan is None:  # lời dẫn đầu quẻ, trước quái từ
                    doan = {"loai": loai, "hao": hao, "kinh": "", "truyen": "", "ban_nghia": "", "to": to}
                    ds.append(doan)
            if khoi == "truyen" and doan is not None and chinh[0] == "義" and doan["truyen"][-1:] in ("本", "夲"):
                doan["truyen"], chinh = doan["truyen"][:-1], "本" + chinh  # «本義» bị ngắt giữa hai dòng
            m = BAN_NGHIA.search(chinh)  # «本義» có khi nối liền ngay sau lời Trình truyện, giữa dòng
            if m and (m.start() == 0 or khoi == "truyen"):
                truoc, chinh, dau = chinh[:m.start()].rstrip("○"), chinh[m.end():], "ban_nghia"
            if truoc and khoi and doan is not None:
                doan[khoi] += truoc
            if dau:
                khoi = dau
                if doan is None:  # lời dẫn đầu quẻ, trước quái từ
                    doan = {"loai": loai, "hao": hao, "kinh": "", "truyen": "", "ban_nghia": "", "to": to}
                    ds.append(doan)
            if khoi and doan is not None:
                doan[khoi] += chinh
            day = len(chinh) >= RONG and "(" not in dong
    for d in list(que.values()) + [{"doan": v} for v in thien.values()]:
        for x in d["doan"]:
            if x["hao"] is None:
                del x["hao"]
    return {
        "_nguon": "周易傳義大全 (Chu Dịch Truyện Nghĩa Đại Toàn), Hồ Quảng và các soạn giả vâng mệnh biên soạn, đời Minh (1415): "
                  "kinh văn Chu Dịch + Trình Di «Dịch truyện» (truyen) + Chu Hy «Chu Dịch bản nghĩa» (ban_nghia). Cổ thư công cộng.",
        "ban": "Văn Uyên Các Tứ khố toàn thư (WYG) — bản số hoá Kanseki Repository KR1a0091, commit " + COMMIT,
        "source_id": "chu_dich_truyen_nghia_dai_toan",
        "school_id": "nghia_ly",
        "ghi_chu": "Chữ giữ nguyên dạng bản Tứ khố (隂, 无, 徃…), không dấu câu. `to` = số tờ bản Tứ khố (quyển-tờ mặt). "
                   "Chú âm đọc và dị bản in chữ nhỏ đã bỏ. Ký hiệu quẻ bản số hoá gõ nhầm, đã sửa theo hai quái ghi kèm: " + ("; ".join(sua) or "không") + ". "
                   "Chữ hiếm bản số hoá chưa có mã ghi dạng &KR…;. Lời các nhà Tống – Nguyên in chữ nhỏ CHƯA nạp "
                   f"({chu_nho} chữ) — dựng lại bằng scripts/nap_truyen_nghia.py khi cần.",
        "que": que,
        "thien": thien,
    }


if __name__ == "__main__":
    kq = doc(Path(sys.argv[1]))
    DICH.parent.mkdir(parents=True, exist_ok=True)
    DICH.write_text(json.dumps(kq, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    n = sum(len(v["doan"]) for v in kq["que"].values())
    print(f"{len(kq['que'])} quẻ, {n} đoạn; thiên: " + ", ".join(f"{k} {len(v)}" for k, v in kq["thien"].items()))
