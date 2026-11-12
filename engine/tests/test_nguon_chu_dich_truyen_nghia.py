"""Kho nguồn Chu Dịch Truyện Nghĩa Đại Toàn (bản Tứ khố) — cấu trúc đủ và kinh văn trong KB khớp nguyên văn.

Kho dựng bằng scripts/nap_truyen_nghia.py (tất định). Test này không cần mạng.
"""
import json
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
NGUON = json.loads((GOC / "fixtures/nguon/chu_dich_truyen_nghia.json").read_text(encoding="utf-8"))
KB = json.loads((GOC / "app/kb/data/kinhdich_hao.json").read_text(encoding="utf-8"))["que"]


def _hao(q: str) -> dict[int, dict[str, int]]:
    kq: dict[int, dict[str, int]] = {}
    for d in NGUON["que"][q]["doan"]:
        if d["loai"] in ("hao", "tieu_tuong"):
            o = kq.setdefault(d["hao"], {"truyen": 0, "ban_nghia": 0, "tieu_tuong": 0})
            if d["loai"] == "hao":
                o["truyen"] += len(d["truyen"])
                o["ban_nghia"] += len(d["ban_nghia"])
            else:
                o["tieu_tuong"] += len(d["kinh"])
    return kq


def test_du_64_que_386_hao_co_trinh_va_chu():
    assert sorted(NGUON["que"], key=int) == [str(i) for i in range(1, 65)]
    tong = 0
    for q in NGUON["que"]:
        loai = {d["loai"] for d in NGUON["que"][q]["doan"]}
        assert {"quai_tu", "thoan", "dai_tuong", "hao", "tieu_tuong"} <= loai, q
        assert ("van_ngon" in loai) == (q in ("1", "2")), q
        hao = _hao(q)
        assert sorted(hao) == list(range(1, 8 if q in ("1", "2") else 7)), q
        for vt, o in hao.items():
            assert o["truyen"] and o["ban_nghia"] and o["tieu_tuong"], (q, vt)
        tong += len(hao)
    assert tong == 386


def test_ky_hieu_que_dung_so():
    for q, v in NGUON["que"].items():
        assert ord(v["ky_hieu"]) - 0x4DC0 + 1 == int(q)


def test_nam_thien_thap_duc_co_noi_dung():
    for ten in ("he_tu_thuong", "he_tu_ha", "thuyet_quai", "tu_quai", "tap_quai"):
        assert sum(len(d["kinh"]) for d in NGUON["thien"][ten]) > 200, ten
    dau = lambda ten: next(d["kinh"] for d in NGUON["thien"][ten] if d["kinh"])
    assert dau("he_tu_thuong").startswith("天尊地卑")
    assert dau("thuyet_quai").startswith("昔者聖人之作易也")


def test_khong_con_dau_ban_nghia_lan_trong_trinh_truyen():
    for v in NGUON["que"].values():
        for d in v["doan"]:
            assert not re.search("[本夲]義", d["truyen"]), d["kinh"]


# Dị thể chữ của bản Tứ khố ↔ chữ chuẩn dùng trong KB (cùng một chữ, khác nét viết).
_DI_THE = str.maketrans(
    "徃渉説徳䝉恒内亾飬兑黄衆牀乗㢲虚来㓂竆髙矦宼歳䘮羣𤼵戸㧞彚嵗敎舎宫逺曵恵隣彊𢎞𤣥䧟宂况乆旣罸勅腊剥啇朶頥虗兹䑕莅脩禄旡賔㝠卽躳静𤨏懐户隂鼔於耽",
    "往涉說德蒙恆內亡養兌黃眾床乘巽虛來寇窮高侯寇歲喪群發戶拔彙歲教舍宮遠曳惠鄰強弘玄陷穴況久既罰敕臘剝商朵頤虛茲鼠蒞修祿无賓冥即躬靜瑣懷戶陰鼓于眈",
)
# Chỗ hai bản khác chữ có chủ ý giữ theo KB (bản thông hành), hoặc bản số hoá Tứ khố sót / nhầm chữ.
_CHAP_NHAN = {("8", 1), ("61", 1), ("41", 1), ("49", 0), ("49", 2), ("47", 2), ("15", 1), ("43", 1),
              ("23", 5), ("12", 0), ("5", 6), ("54", 0)}


def _chuan(s: str) -> str:
    s = re.sub(r"[^㐀-鿿\U00020000-\U0002ffff]", "", s).translate(_DI_THE)
    return re.sub("^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六)", "", s)


def test_loi_que_loi_hao_trong_kb_khop_ban_tu_kho():
    """Quái từ + hào từ trong KB phải trùng bản Tứ khố sau khi quy dị thể (trừ danh sách đã xét tay)."""
    lech = []
    for q in NGUON["que"]:
        doan = NGUON["que"][q]["doan"]
        cap = [(0, "quai_tu", None, KB[q]["que_tu"]["han"].split("：", 1)[-1])]
        cap += [(h["vi_tri"], "hao", h["vi_tri"], h["han"]) for h in KB[q]["hao"]]
        for ma, loai, hao, han in cap:
            a = _chuan("".join(d["kinh"] for d in doan if d["loai"] == loai and d.get("hao") == hao))
            b = _chuan(han)
            if not (a == b or a.endswith(b)) and (q, ma) not in _CHAP_NHAN:
                lech.append((q, ma, a, b))
    assert not lech, lech
