# -*- coding: utf-8 -*-
"""TV-CTP — kho cổ thư Tử vi `tuvi_co_thu.json` (Đẩu Số Cốt Tuỷ Phú) và trang trụ /tu-vi/co-thu/cot-tuy-phu.

Luật: mỗi câu có source_id + school_id; nguyên văn là chữ Hán phồn thể, chỉ dấu câu cổ (，。), không chữ giản thể, không
dấu câu hiện đại; nghĩa đời thường không giọng AI, không lời doạ, không tên bệnh, nói sức khoẻ thì kèm "không thay lời
bác sĩ"; sao / cung / hoá / cách cục trỏ tới mục có thật; không lộ nguồn nội bộ (BM-1). Trang khác chỉ trích ≤ 2 câu,
mỗi câu ≤ 2 câu nguyên văn (SEO-M).
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import cong_khai
from app.kb import do_rieng, trang, trang_co_thu as tct
from app.kb.tuvi_doi_song_kb import cum_cam, tim_cum_cam
from app.main import app
from app.narrative import hoi_van

client = TestClient(app)
DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
KB = json.loads((DATA / "tuvi_co_thu.json").read_text("utf-8"))
TV = json.loads((DATA / "tuvi_kb.json").read_text("utf-8"))
CC = json.loads((DATA / "tuvi_cach_cuc.json").read_text("utf-8"))["cach"]
CAU = KB["cau"]

KHOA = {"id", "source_id", "school_id", "chuong", "thu_tu", "nguyen_van", "phien_am", "nghia", "sao", "cung", "hoa",
        "cach_cuc", "khi", "trang_thai", "can_doi_chieu", "ban_doi_chieu"}
# Chữ chỉ có ở bản giản thể (đã gặp ở bản chép đối chiếu) — xuất hiện trong nguyên văn là chuyển chữ sót.
GIAN_THE = set("贵禄为夹宫贪荣门贞杀运贫则贱财权阴马会军伤无寿终华临显丧众恶乡祸坚飘辅庙铃岁极时积断细对须来学发凑将"
               "镇荡进冲罗专两内阳数缠异银连晓迁谁却乐禀宽誉钺盖惊诸钟跃尧稳声远资纲贾谊边广颜应绿堕楼缧绁忧网穷犹项"
               "国吕杨脱辈邓饿绝粮缢头带剑绯鸳鸯闲艺还隐锦虚劳峥嵘纵辉骘实论刚杂见决灾岂长当详鬥")
# Sao không thuộc 14 chính tinh / bộ phụ tinh của tuvi_kb nhưng có trong bài phú (vòng Bác Sĩ, Thái Tuế, Thiên Thương…).
SAO_KHAC = {"Lực Sĩ", "Tướng Quân", "Đại Hao", "Thiên Thương", "Thiên Sứ", "Thái Tuế", "Quan Phù", "Điếu Khách", "Tang Môn"}
SAO_BIET = set(TV["chinh_tinh"]) | set(TV["phu_tinh"]) | SAO_KHAC
HOA = {"Lộc", "Quyền", "Khoa", "Kỵ"}
CAM_DOA = re.compile(r"(?<!\w)(chết|tử vong|chết đuối|tự tử|treo cổ|yểu|đoản thọ|tai nạn|tai hoạ|tai họa|đại hung|"
                     r"phá sản|tuyệt mệnh|mất mạng|chết đói|tiền định|khắc chết|giải hạn|vật phẩm|cúng sao|bùa|sẽ ốm|sẽ bệnh|"
                     r"sống được bao lâu|thọ bao nhiêu)(?!\w)", re.I)
# Chủ dự án (2026-11-04): được nêu cơ quan / hệ cơ thể và khuyên đi khám định kỳ ("nên chú ý đường hô hấp, đi khám phổi
# định kỳ"), được nói giai đoạn nên chú ý sức khoẻ để phòng ngừa — vẫn CẤM tên bệnh, chẩn đoán, đoán ốm, đoán thọ.
BENH = re.compile(r"ung thư|tiểu đường|đái tháo đường|cao huyết áp|tăng huyết áp|đột quỵ|tai biến|nhồi máu|trầm cảm|"
                  r"vô sinh|hiếm muộn|động kinh|viêm gan|xơ gan|suy thận|sỏi thận|lao phổi|bệnh lao|hen suyễn|"
                  r"bệnh tâm thần|tâm thần phân liệt|HIV|AIDS|u bướu|khối u|chẩn đoán", re.I)
SUC_KHOE = re.compile(r"sức khoẻ|sức khỏe|\bbệnh\b|ốm đau|cơ thể|thương tích", re.I)
KHONG_THAY = re.compile(r"không thay lời bác sĩ", re.I)


def _cjk(c: str) -> bool:
    return "CJK UNIFIED IDEOGRAPH" in unicodedata.name(c, "")


def test_goc_tep_va_nguon():
    for k in ("source", "source_id", "school_id", "trang_thai", "can_doi_chieu", "ban_doi_chieu", "trang", "chuong", "cau"):
        assert k in KB, k
    assert KB["source_id"] == "cot_tuy_phu" and "cot_tuy_phu" in KB["source"]
    assert KB["trang_thai"] == "nhap_ai" and KB["can_doi_chieu"] is True
    assert KB["ban_doi_chieu"]["sha256_anh_chup"]           # bản chép cố định có mã băm để kiểm lại


def test_cau_du_khoa_va_thu_tu():
    assert len(CAU) == 84                                    # trọn bài phú theo bản chép đối chiếu
    for i, c in enumerate(CAU, 1):
        assert KHOA <= set(c), (c["id"], KHOA - set(c))
        assert c["id"] == f"ctp_{i:02d}" and c["thu_tu"] == i
        assert c["source_id"] == "cot_tuy_phu" and c["school_id"] == "tu_vi_dau_so"
        assert c["trang_thai"] == "nhap" and c["can_doi_chieu"] is True
        assert "oldid 850734" in c["ban_doi_chieu"]
    # phần (chương) liền mạch, mỗi phần ≥ 1 câu, theo đúng thứ tự khai báo
    ma = [x["ma"] for x in KB["chuong"]]
    thu_tu = [ma.index(c["chuong"]) for c in CAU]
    assert thu_tu == sorted(thu_tu) and set(thu_tu) == set(range(len(ma)))


@pytest.mark.parametrize("c", CAU, ids=lambda c: c["id"])
def test_nguyen_van_phon_the_khong_dau_cau_hien_dai(c):
    nv = c["nguyen_van"]
    assert nv.endswith("。")
    la = [x for x in nv if not (_cjk(x) or x in "，。")]
    assert not la, f"ký tự ngoài chữ Hán + ，。: {la}"
    gian = [x for x in nv if x in GIAN_THE]
    assert not gian, f"chữ giản thể: {gian}"


def test_nguyen_van_khop_ban_doi_chieu_da_biet():
    """Vài câu kiểm tay với bản chép (chống sửa nhầm khi biên tập)."""
    nv = {c["thu_tu"]: c["nguyen_van"] for c in CAU}
    assert nv[6] == "命無正曜，夭折孤貧。吉有凶星，美玉瑕玷。"
    assert nv[19] == "七殺朝斗爵祿榮昌，紫府同宮終身福厚。"
    assert nv[52] == "鈴昌羅武限至投河，巨火擎羊終身縊死。"
    assert nv[61] == "武曲居乾戌亥上，最怕太陰逢貪狼。"
    assert nv[84] == "數內包藏多少理，學者須當仔細詳。"
    assert sum(len(re.sub("[，。]", "", x)) for x in nv.values()) == 1522


@pytest.mark.parametrize("c", CAU, ids=lambda c: c["id"])
def test_phien_am_va_nghia(c):
    pa, ng = c["phien_am"], c["nghia"]
    assert pa.endswith(".") and not any(_cjk(x) for x in pa)
    assert not re.search(r"[—–…]", pa)
    for s in (ng, c.get("khi") or "", c.get("chu_thich") or ""):
        assert not tim_cum_cam(s, cum_cam()), (c["id"], tim_cum_cam(s, cum_cam()))
        assert not CAM_DOA.search(s), (c["id"], CAM_DOA.search(s))
        assert not BENH.search(s), (c["id"], s)
        assert not any(x in s.lower() for x in hoi_van.CAM), c["id"]
        assert cong_khai.loc(s) == s, f"{c['id']}: lộ tên nội bộ (BM-1)"
    if SUC_KHOE.search(ng):
        assert KHONG_THAY.search(ng), f"{c['id']}: nói sức khoẻ thì kèm 'không thay lời bác sĩ'"
    assert len(ng) >= 60


@pytest.mark.parametrize("c", CAU, ids=lambda c: c["id"])
def test_sao_cung_hoa_cach_cuc_ton_tai(c):
    assert set(c["sao"]) <= SAO_BIET, set(c["sao"]) - SAO_BIET
    assert set(c["cung"]) <= set(TV["cung"]), c["cung"]
    assert set(c["hoa"]) <= HOA
    for m in c["cach_cuc"]:
        assert m in CC, f"{c['id']}: cách cục {m} không có trong tuvi_cach_cuc.json"
    if c["khi"]:
        assert not c["khi"].endswith(".")                     # web nối "Câu này nói về lá số khi {khi}."


def test_luat_suc_khoe_cho_neu_co_quan_va_kham_dinh_ky():
    """Nêu cơ quan + khám định kỳ là được; tên bệnh, đoán ốm thì bị chặn."""
    assert not BENH.search("Nên chú ý đường hô hấp, đi khám phổi định kỳ; không thay lời bác sĩ.")
    assert not CAM_DOA.search("Giai đoạn này nên chú ý sức khoẻ tim mạch, đi khám tổng quát.")
    assert BENH.search("dễ bị ung thư phổi") and CAM_DOA.search("năm này sẽ ốm")


def test_co_ca_tro_ve_cau_phu_co_that():
    theo_id = {c["id"]: c for c in CAU}
    co = [(k, v) for k, v in CC.items() if v.get("co_ca_nguon")]
    assert len(co) >= 30
    for k, v in co:
        nguon, _, cid = v["co_ca_nguon"].partition(":")
        assert nguon == "cot_tuy_phu" and cid in theo_id, k
        assert k in theo_id[cid]["cach_cuc"], f"{k}: câu {cid} không nêu cách này"
        assert v["co_ca"] and not any(_cjk(x) for x in v["co_ca"])        # chỉ phiên âm (quyết định 2026-10-02)


def test_trang_tru_du_moi_cau_co_neo():
    t = trang.lay("co_thu", tct.SLUG)
    assert t and t["index"] and t["loai"] == "co_thu"
    assert "tử vi" in t["tra_loi_nhanh"][:110].lower()
    td = [x for m in t["muc"] for x in m.get("trich_dan", [])]
    assert [x["neo"] for x in td] == [f"cau-{i}" for i in range(1, len(CAU) + 1)]
    assert all(x["nguyen_van"] and x["phien_am"] and x["nghia"] for x in td)
    phan = [m for m in t["muc"] if m["tieu_de"].startswith("Phần ")]
    assert len(phan) == len(KB["chuong"])
    bang = next(m["bang"] for m in t["muc"] if m["tieu_de"] == "Các cách cục bài phú nhắc tới")
    assert len(bang["dong"]) == len({m for c in CAU for m in c["cach_cuc"]})
    assert len(t["hoi_dap"]) >= 4 and all(h["hoi"].endswith("?") for h in t["hoi_dap"])
    # link trong phần tới trang có thật
    for m in t["muc"]:
        for x in m.get("xem_them", []):
            assert trang.lay(x["loai"], x["slug"]), x
    assert do_rieng.ty_le().get(("co_thu", tct.SLUG), 1.0) >= do_rieng.NGUONG


def test_api_va_khong_lo_nguon_noi_bo():
    r = client.get(f"/v1/kb/trang/co_thu/{tct.SLUG}")
    assert r.status_code == 200
    van = r.text
    for x in ("iztro", "Wikisource", "wikisource", "oldid", "github", "GitHub", "sha256", "tianzhi", "aion", "nháp AI"):
        assert x not in van, x
    assert client.get("/v1/kb/trang/co_thu/khong-co").status_code == 404
    assert any(t["loai"] == "co_thu" for t in client.get("/v1/kb/trang").json()["trang"])


def test_trang_khac_chi_trich_toi_da_hai_cau():
    dem = 0
    for x in trang.danh_sach():
        if x["loai"] not in ("sao", "sao_cung", "hoa_cung"):
            continue
        t = trang.lay(x["loai"], x["slug"])
        ms = [m for m in t["muc"] if m.get("ma") == "co_thu"]
        assert len(ms) <= 1
        for m in ms:
            dem += 1
            assert 1 <= len(m["trich_dan"]) <= tct.TOI_DA_TRICH
            assert all(tct.so_cau_nguyen_van(d["nguyen_van"]) <= 2 for d in m["trich_dan"])
            assert m["xem_them"] == [{"loai": "co_thu", "slug": tct.SLUG, "tieu_de": tct.SACH}]
    assert dem >= 40


def test_vi_du_sao_o_cung():
    t = trang.lay("sao_cung", "that-sat-cung-menh")
    m = next(m for m in t["muc"] if m.get("ma") == "co_thu")
    assert any("七殺朝斗" in d["nguyen_van"] for d in m["trich_dan"])
    assert t["muc"][-1]["tieu_de"] == "Câu hỏi tự soi"          # tự soi vẫn đứng cuối
    assert tct.muc_trich(sao="Tử Vi", cung="Nô Bộc") is None


# Cặp giản → phồn ĐÃ GẶP giữa kho nguồn (giản thể) và KB (phồn thể) — đóng băng: cặp lạ xuất hiện = có chữ bị sửa.
CAP_GIAN_PHON = set("""万萬 专專 两兩 丧喪 临臨 为為 乐樂 乡鄉 于於 云雲 众眾 会會 伤傷 体體 内內 军軍 冲沖 决決 凑湊 则則 刚剛 剑劍 劳勞 华華 却卻 发發 台臺 后後 吕呂 国國 坚堅 堕墮 声聲 头頭 夹夾 学學 实實 宫宮 宽寬 对對 寿壽 将將 尧堯 尸屍 岁歲 岂豈 峥崢 嵘嶸 带帶 干乾 并並 广廣 应應 庙廟 异異 当當 忧憂 恶惡 惊驚 数數 断斷 无無 时時 显顯 晓曉 机機 杀殺 杂雜 权權 来來 杨楊 极極 楼樓 灾災 犹猶 盖蓋 着著 祸禍 禀稟 禄祿 积積 稳穩 穷窮 粮糧 纲綱 纵縱 绁紲 细細 终終 绝絕 绯緋 绿綠 缠纏 缢縊 缧縲 网網 罗羅 脱脫 艺藝 荡蕩 荣榮 虚虛 见見 誉譽 论論 详詳 诸諸 谁誰 谊誼 贞貞 财財 贪貪 贫貧 贱賤 贵貴 贾賈 资資 跃躍 辅輔 辈輩 辉輝 边邊 迁遷 运運 还還 进進 远遠 连連 邓鄧 里裏 钟鍾 钺鉞 铃鈴 银銀 锦錦 镇鎮 长長 门門 闲閑 阳陽 阴陰 隐隱 项項 须須 颜顏 飘飄 饿餓 马馬 骘騭 鸯鴦 鸳鴛""".split())


def test_nguyen_van_khop_kho_nguon_toan_thu_tung_chu():
    """KT-TT7 — 84 câu phồn thể của KB khớp TỪNG CHỮ với bài 斗数骨髓赋 trong kho nguồn Toàn Thư (bản chép giản thể):
    cùng số dòng, cùng số chữ; chữ khác nhau chỉ được là cặp giản → phồn đã đóng băng (后 có thể giữ 后 hoặc thành 後)."""
    nguon = json.loads((DATA.parents[2] / "fixtures" / "nguon" / "tu_vi_dau_so_toan_thu.json").read_text("utf-8"))
    bai = next(t for t in nguon["quyen_1"] if t["thien"] == "斗数骨髓赋")["van"]
    dong = [d for d in bai.split("\n") if d.strip()]
    bo = lambda s: re.sub(r"[，。、；：！？\s]", "", s)  # noqa: E731
    assert len(dong) == len(CAU) == 84
    tong = 0
    for d, c in zip(dong, CAU):
        a, b = bo(d), bo(c["nguyen_van"])
        assert len(a) == len(b), c["id"]
        tong += len(a)
        for x, y in zip(a, b):
            assert x == y or x + y in CAP_GIAN_PHON, (c["id"], x, y)
    assert tong == 1522
