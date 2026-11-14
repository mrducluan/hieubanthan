# -*- coding: utf-8 -*-
"""SX-C đợt 1a — dựng KB `phongthuy_cung_menh.json` từ hai thiên «東四位宅圖說» / «西四位宅圖說» của Dương Trạch Thập Thư:
mỗi cung mệnh (8 quái) có 9 điều "一定…" — phòng ở, nhà toạ hướng nào, cửa, lối đi, giếng, bếp, cối xay, chuồng, thoát nước.

Tất định: chỉ CẮT câu sách + đọc phương hướng trong câu (bảng chữ cố định) + ráp lời theo mẫu. Không tính Bát trạch ở đây —
`tests/test_sx_c_phongthuy.py` so mọi cặp (phương, du niên) sách nêu với `calc.phongthuy.bang_huong`.

    cd engine && PYTHONPATH=. python scripts/nap_cung_menh_sach.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))
from app.kb import sach_ghi  # noqa: E402

KHO = json.loads((GOC / "fixtures" / "nguon" / "duong_trach_thap_thu.json").read_text("utf-8"))
RA = GOC / "app" / "kb" / "data" / "phongthuy_cung_menh.json"

QUAI = {"坎": "Khảm", "離": "Ly", "震": "Chấn", "巽": "Tốn", "乾": "Càn", "坤": "Khôn", "艮": "Cấn", "兌": "Đoài"}
PHUONG = {"東南": "Đông Nam", "東北": "Đông Bắc", "西南": "Tây Nam", "西北": "Tây Bắc", "西牝": "Tây Bắc",   # 牝: bản gõ nhầm 北
          "東": "Đông", "西": "Tây", "南": "Nam", "北": "Bắc"}
SON = {**{c: "Đông" for c in "甲卯乙"}, **{c: "Đông Nam" for c in "辰巽巳"}, **{c: "Nam" for c in "丙午丁"},
       **{c: "Tây Nam" for c in "未坤申"}, **{c: "Tây" for c in "庚酉辛"}, **{c: "Tây Bắc" for c in "戌乾亥"},
       **{c: "Bắc" for c in "壬子癸"}, **{c: "Đông Bắc" for c in "丑艮寅"}}
DU_NIEN = {"生氣": "Sinh Khí", "天乙": "Thiên Y", "延年": "Diên Niên", "福德": "Phục Vị", "五鬼": "Ngũ Quỷ", "禍害": "Hoạ Hại",
           "六煞": "Lục Sát", "絕命": "Tuyệt Mệnh"}
VIEC = [("福元宜[居住]", "phong_o", "Phòng ở"), ("宅宜住", "nha", "Nhà toạ hướng nào"), ("門宜走", "cua", "Cửa chính"),
        ("宅中所行路", "loi_di", "Lối đi lại"), ("井宜在", "gieng", "Giếng, nguồn nước"), ("廚竈宜在", "bep", "Bếp"),
        ("碾磨", "coi_xay", "Chỗ ồn, chỗ nặng"), ("牛馬欄", "chuong", "Chỗ nuôi, chỗ để xe"), ("放水", "thoat_nuoc", "Thoát nước")]
NGAY_NAY = {"gieng": "Xưa là giếng; nay hiểu là bể nước, bồn nước, chỗ đặt máy bơm.",
            "coi_xay": "Xưa là cối xay, cối giã; nay là máy giặt, máy bơm, kho đồ nặng.",
            "chuong": "Xưa là chuồng trâu ngựa; nay là chỗ để xe, chỗ nuôi thú."}
AM = dict(zip("一丁上不丑丙中主之乙也乾五井亥亦人以但位住何來便修俱假元兄兌兩其凶分別則北南卯去只可各吉同向命善四因圖在坎坐坤壬多大天夫如妻婦子字宅安定宜宮害寅居"
              "屬巨己巳巽年床庚廉廚延弟德必忌惟戌或截房所抵放故方星是曲未東樓欄次正武氣水法為父牛牝狼生用由甲申當癸皆破碾磨祥禍福竈端絕而耳艮若著蓋行西誤說謂貞貪走路"
              "軍辛辰避長門開間院陰離震非首馬高鬼六煞文",
              ("nhất đinh thượng bất sửu bính trung chủ chi ất dã càn ngũ tỉnh hợi diệc nhân dĩ đãn vị trú hà lai tiện tu câu giả nguyên huynh đoài lưỡng kỳ hung "
               "phân biệt tắc bắc nam mão khứ chỉ khả các cát đồng hướng mệnh thiện tứ nhân đồ tại khảm toạ khôn nhâm đa đại thiên phu như thê phụ tử tự trạch an định "
               "nghi cung hại dần cư thuộc cự kỷ tỵ tốn niên sàng canh liêm trù diên đệ đức tất kỵ duy tuất hoặc tiệt phòng sở để phóng cố phương tinh thị khúc mùi "
               "đông lâu lan thứ chính vũ khí thuỷ pháp vi phụ ngưu bắc lang sinh dụng do giáp thân đương quý giai phá niễn ma tường hoạ phúc táo đoan tuyệt nhi nhĩ "
               "cấn nhược trước cái hành tây ngộ thuyết vị trinh tham tẩu lộ quân tân thìn tị trường môn khai gian viện âm ly chấn phi thủ mã cao quỷ lục sát văn").split()))
_PH = re.compile(r"(東南|東北|西南|西北|西牝|[東西南北])")
_DN = re.compile("|".join(DU_NIEN))


def _muc(ten: str) -> str:
    return next(m["van"] for q in KHO["quyen"] for m in q["muc"] if m["ten"] == ten)


def _am(han: str) -> str:
    return " ".join(AM[c] for c in han).capitalize() + "."


def _cat(t: str, n: int = 60) -> str:
    """Câu sách ≤ n chữ, cắt ở chữ 吉 / 居 / 可 cuối cùng còn nằm trong giới hạn (văn bản không có dấu câu)."""
    if len(t) <= n:
        return t
    i = max(t.rfind(c, 0, n) for c in "吉居可")
    return t[:i + 1] if i > 8 else t[:n]


def _phuong(t: str) -> list[dict]:
    """Các phương sách nêu trong một điều, kèm du niên nếu sách ghi ngay sau phương ấy (trước phương kế tiếp)."""
    ra, moc = [], list(_PH.finditer(t))
    for i, m in enumerate(moc):
        doan = t[m.end():moc[i + 1].start() if i + 1 < len(moc) else len(t)]
        if doan[:1] in "房間樓向" or t[max(0, m.start() - 1):m.start()] in ("坐", "向"):
            continue                              # "南房東間", "坐北向南": tên dãy nhà / thế nhà, không phải phương đặt
        dn = _DN.search(doan)
        p = {"phuong": PHUONG[m.group()]}
        if dn:
            p["du_nien"] = DU_NIEN[dn.group()]
        if p not in ra and not any(x["phuong"] == p["phuong"] for x in ra):
            ra.append(p)
    return ra


def _phuong_son(t: str) -> list[str]:
    ra = [x["phuong"] for x in _phuong(t)]
    for c in t:
        if c in SON and c not in "乾坤艮巽" and SON[c] not in ra and not ra:
            ra.append(SON[c])
    if not ra:                                    # "只宜在乾破軍方", "甲乙巨門方"
        ra = list(dict.fromkeys(SON[c] for c in t if c in SON))
    return ra


def _noi(ds: list[str]) -> str:
    return ds[0] if len(ds) == 1 else ", ".join(ds[:-1]) + " và " + ds[-1]


def _kem(p: dict) -> str:
    return f"{p['phuong']} ({p['du_nien']})" if p.get("du_nien") else p["phuong"]


_NHA = {"dong": "Hợp nhất là nhà lưng quay về Bắc, mặt nhìn Nam; rồi tới nhà lưng Nam mặt Bắc và nhà lưng Tây mặt Đông. Nhà lưng Đông mặt Tây "
                "kém hợp vì khó mở cửa về phía tốt của mình.",
        "tay": "Hợp là nhà lưng Bắc mặt Nam mở cửa góc Tây Nam, nhà lưng Nam mặt Bắc mở cửa góc Tây Bắc; nhà lưng Đông mặt Tây cũng hợp. "
               "Nhà lưng Tây mặt Đông thì mở cửa lệch về góc Đông Bắc."}
_PHONG = {"dong": "Trong nhà nhiều dãy, nên ở gian phía Đông của dãy nhà phía Nam hoặc gian phía Nam của dãy nhà phía Đông; gian giữa dãy phía Bắc cũng được.",
          "tay": "Trong nhà nhiều dãy, nên ở dãy nhà phía Tây (hoặc tầng trên phía Tây); gian phía Tây của dãy Bắc hay dãy Nam cũng được. "
                 "Sách dặn tránh gian chính giữa của dãy Bắc và dãy Nam."}


def _y(viec: str, t: str, nhom: str) -> str:
    ph = _phuong(t)
    if viec == "phong_o":
        return _PHONG[nhom]
    if viec == "nha":
        return _NHA[nhom]
    if viec == "cua":
        y = f"Cửa chính nên mở về phía {_noi([_kem(p) for p in ph])}."
        return y + (" Sách dặn không đặt cửa đúng chính giữa hướng Đông Bắc." if "鬼門" in t else "")
    if viec == "loi_di":
        return f"Lối đi lại chính trong nhà nên nằm về phía {_noi([p['phuong'] for p in ph])}."
    if viec == "gieng":
        return f"Giếng hợp ở phía {_noi(_phuong_son(t))} của nhà."
    if viec == "bep":
        return f"Bếp hợp đặt ở phía {_noi([_kem(p) for p in ph] or _phuong_son(t))} của nhà."
    if viec == "coi_xay":
        return f"Cối xay, cối giã hợp đặt ở phía {_noi([_kem(p) for p in ph])} — sách để việc ồn và nặng ở phía kém của mình."
    if viec == "chuong":
        return f"Chuồng trâu ngựa hợp ở phía {_noi([_kem(p) for p in ph])}."
    return f"Nước thải nên cho thoát về phía {_noi(_phuong_son(t))}."


def dung() -> dict:
    cung: dict[str, list[dict]] = {}
    for ten, nhom in (("東四位宅圖說并東四位生人用例", "dong"), ("西四位宅圖說并西四位生人用例", "tay")):
        v = _muc(ten)
        moc = [m for m in re.finditer(r"[東西]四位(.)宮相生人", v)]
        for i, m in enumerate(moc):
            doan = v[m.start():moc[i + 1].start() if i + 1 < len(moc) else len(v)]
            dieu = re.split(r"一定", doan)[1:10]
            assert len(dieu) == 9, (m.group(1), len(dieu))
            ds = []
            for t in dieu:
                viec, nhan = next((ma, nh) for mau, ma, nh in VIEC if re.match(mau, t))
                t = re.split(r"無凶何必|不便修蓋|蓋因開大門", t)[0]          # bỏ phần bàn thêm dính sau điều cuối
                han = _cat(t.replace("西牝", "西北") if False else t)
                if "西牝" in han or "己字" in han:                            # tránh vế có chữ gõ nhầm của bản nguồn
                    j = han.index("西南") if "西南" in han else han.index("正北")
                    han = han[j:]
                x = {"viec": viec, "ten": nhan, "han": han, "am": _am(han), "y": _y(viec, t, nhom), "nhom": "A",
                     "chu_de": "nha_cua", "nguon": "duong_trach_thap_thu"}
                ph = _phuong(t) if viec in ("cua", "bep", "coi_xay", "chuong", "loi_di") else [{"phuong": p} for p in _phuong_son(t)] \
                    if viec in ("gieng", "thoat_nuoc") else []
                if ph:
                    x["phuong"] = ph
                if viec in NGAY_NAY:
                    x["ngay_nay"] = NGAY_NAY[viec]
                ds.append(x)
            cung[QUAI[m.group(1)]] = ds
    dau = _muc("東四位宅圖說并東四位生人用例")
    return {
        "_nguon": "Dương Trạch Thập Thư (陽宅十書) quyển 1 — «東四位宅圖說» và «西四位宅圖說»: chín điều bố trí cho từng cung mệnh. "
                  "Câu Hán cắt từ kho nguồn; phương hướng đọc từ chính câu; lời Việt ráp theo mẫu (scripts/nap_cung_menh_sach.py).",
        "source_id": "duong_trach_thap_thu", "school_id": "bat_trach", "trang_thai": "nhap_ban_bien_tap", "can_doi_chieu": True,
        "vo_chong_khac_nhom": {
            "han": "大抵夫婦福德不同則當以夫為主耳", "am": _am("大抵夫婦福德不同則當以夫為主耳"),
            "y": "Vợ chồng khác nhóm mệnh thì sách xưa lấy người chồng làm chính để chọn nhà, rồi xếp gian ở cho người kia về phía hợp "
                 "với họ. Ngày nay có thể hiểu là lấy người ở nhà nhiều nhất làm chính.",
            "nhom": "A", "chu_de": "nha_cua", "nguon": "duong_trach_thap_thu"},
        "cung": cung,
    }


if __name__ == "__main__":
    assert "大抵夫婦福德不同則當以夫為主耳" in _muc("東四位宅圖說并東四位生人用例")
    d = dung()
    RA.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", "utf-8")
    n, loi = sach_ghi.kiem_tep(RA)
    print("mục:", n, "· lỗi:", len(loi))
    for x in loi[:20]:
        print(" -", x)
    for q, ds in d["cung"].items():
        print("##", q)
        for x in ds:
            print("  ", x["viec"], "|", x["han"], "|", x["y"])
