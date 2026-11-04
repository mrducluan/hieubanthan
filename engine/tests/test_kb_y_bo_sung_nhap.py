# -*- coding: utf-8 -*-
"""Nháp ý tưởng Tử vi bổ sung (`app/kb/data/nhap/tuvi_y_bo_sung_nhap.json`) — CHƯA nối vào RULES/NARRATIVE.

Tệp là bản viết lại ở mức QUY TẮC (điều kiện → ý nghĩa) từ một bộ bài giảng hiện đại có giấy phép phi thương mại
(docs/DE-XUAT-Y-TUVI-BO-SUNG.md). Test khoá các ranh giới trước khi chủ dự án duyệt:
  - đủ trường, mã không trùng, `trung_voi` trỏ đúng một mục KB đang có;
  - không chữ Hán (không trích nguyên văn), không tên người giảng / số tập / mốc giờ video;
  - lời đời thường không giọng AI, không doạ, không tên bệnh, không thuật ngữ, không con số;
  - sức khoẻ (quy tắc chủ dự án 2026-11-04): cấm tên bệnh / chẩn đoán / tiên đoán thọ yểu; ĐƯỢC nêu bộ phận, hệ cơ quan
    và gợi ý đi khám; ĐƯỢC gợi thời điểm như lời phòng ngừa ("giai đoạn/năm có … nên chú ý sức khoẻ, đi khám tổng
    quát"), không bao giờ "sẽ ốm"; mọi câu có nói tới sức khoẻ kết thúc bằng "không thay lời bác sĩ".
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from app.kb.tuvi_doi_song_kb import cum_chung_chung, tim_cum_cam
from app.luangiai.doi_song_khuon import cum_cam_chung
from app.narrative import hoi_van
from tests.test_kb_bo_sung import CAM_KB
from tests.test_tuvi_cach_cuc_3 import _CAM_DOA
from tests.test_tuvi_doi_song import BENH, DOA, THUAT_NGU

DATA = Path(__file__).parents[1] / "app" / "kb" / "data"
TEP = DATA / "nhap" / "tuvi_y_bo_sung_nhap.json"
KB = json.loads(TEP.read_text(encoding="utf-8"))
MUC = KB["muc"]

LOAI = {"sao_cung", "cap_sao", "tu_hoa_cung", "thoi_diem", "hon_nhan", "nghe_nghiep", "suc_khoe_phong_ngua",
        "phuong_phap"}
TRUONG = ["id", "loai", "dieu_kien", "y_goc_tom_tat", "loi_doi_thuong", "viec_nen_lam", "co_trong_co_thu",
          "rieng_phai", "trung_voi", "source_id", "school_id", "trang_thai", "can_duyet"]
HAN = re.compile(r"[㐀-鿿豈-﫿]")
# Không lộ người giảng / khoá học / nguồn video; không dẫn số tập, mốc thời gian.
LO_NGUON = re.compile(r"Nghê|倪|Haixia|Ni Hai|Thiên Kỷ|bilibili|BV1|\b\d{1,2}:\d{2}:\d{2}\b|tập \d|bài giảng số", re.I)
# Lời phán nặng đặc thù của nguồn (doạ chuyện sống chết, tù tội, đời chồng, con cái) — cấm cả ở bản tóm tắt ý gốc.
DOA_NGUON = ["sinh ly", "tử biệt", "yểu", "goá", "vợ lẽ", "làm lẽ", "tái hôn", "hai đời chồng", "đổ máu", "huyết quang",
             "mổ", "phẫu thuật", "tự tử", "tự sát", "ngồi tù", "lao lý", "không có con", "vô tử", "hoá giải", "cúng",
             "giải hạn", "vật phẩm", "chia tay", "nên lấy", "không nên lấy", "đại kỵ", "trúng số", "sẽ ốm", "sẽ bệnh",
             "sẽ đau", "tuổi thọ", "sống được", "qua đời", "mất sớm"]
TEN_SAO = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm", "Tham Lang",
           "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân", "Kình Dương", "Đà La", "Hỏa Tinh",
           "Linh Tinh", "Địa Không", "Địa Kiếp", "Hồng Loan", "Thiên Hỷ", "Lộc Tồn", "Thiên Mã", "Văn Xương",
           "Văn Khúc", "Tả Phù", "Hữu Bật", "Thiên Khôi", "Thiên Việt"]
TEN_CUNG = ["cung Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
            "Điền Trạch", "Phúc Đức", "Phụ Mẫu"]
KHONG_THAY = re.compile(r"không thay (?:cho )?lời (?:khuyên của )?bác sĩ", re.I)
_cau = lambda s: [x for x in re.split(r"(?<=[.!?…])\s+", s.strip()) if x]  # noqa: E731


def _cam_doi_thuong() -> list[str]:
    ds: list[str] = []
    for c in [*cum_cam_chung(), *cum_chung_chung(), *DOA, *BENH, *CAM_KB, *hoi_van.CAM, *DOA_NGUON]:
        if c not in ds:
            ds.append(c)
    return ds


CAM = _cam_doi_thuong()


def _chu(m: dict) -> list[str]:
    return [m["y_goc_tom_tat"], m["loi_doi_thuong"], m["viec_nen_lam"]]


def test_goc_tep():
    for k in ("_nguon", "source", "school", "trang_thai", "_tu_vung_dieu_kien", "muc"):
        assert k in KB, k
    assert KB["trang_thai"] == "nhap" and KB["can_doi_chieu"] is True
    assert 80 <= len(MUC) <= 200
    assert len({m["id"] for m in MUC}) == len(MUC), "mã trùng"


@pytest.mark.parametrize("m", MUC, ids=[m["id"] for m in MUC])
def test_truong_va_gia_tri(m):
    for k in TRUONG:
        assert k in m, (m["id"], k)
    assert m["loai"] in LOAI
    assert isinstance(m["dieu_kien"], dict) and m["dieu_kien"], m["id"]
    assert isinstance(m["dieu_kien"].get("co_the_tinh"), bool), m["id"]
    assert set(m["dieu_kien"]) <= set(KB["_tu_vung_dieu_kien"]), m["id"]
    assert m["co_trong_co_thu"] in (True, False, "khong_ro")
    assert isinstance(m["rieng_phai"], bool)
    assert m["source_id"] in KB["source"] and m["school_id"] in KB["school"]
    assert m["trang_thai"] == "nhap" and m["can_duyet"] is True
    for s in _chu(m):
        assert isinstance(s, str) and len(s) >= 15, (m["id"], s)


def _lay(duong: str):
    tep, *khoa = duong.split(".")
    x = json.loads((DATA / f"{tep}.json").read_text(encoding="utf-8"))
    for k in khoa:
        x = x[k]
    return x


@pytest.mark.parametrize("m", [m for m in MUC if m["trung_voi"]], ids=lambda m: m["id"])
def test_trung_voi_tro_dung_muc_kb(m):
    assert _lay(m["trung_voi"]) is not None, m["trung_voi"]


def test_khong_chu_han_khong_lo_nguon():
    van = TEP.read_text(encoding="utf-8")
    assert not HAN.search(van), HAN.search(van).group(0)
    assert not LO_NGUON.search(van), LO_NGUON.search(van).group(0)


@pytest.mark.parametrize("m", MUC, ids=[m["id"] for m in MUC])
def test_khong_giong_ai_khong_doa_khong_ten_benh(m):
    for s in _chu(m):
        assert not tim_cum_cam(s, CAM), (m["id"], tim_cum_cam(s, CAM), s)
        assert not _CAM_DOA.search(s), (m["id"], _CAM_DOA.search(s).group(0), s)


@pytest.mark.parametrize("m", MUC, ids=[m["id"] for m in MUC])
def test_loi_doi_thuong_ngan_khong_thuat_ngu_khong_so(m):
    loi, viec = m["loi_doi_thuong"], m["viec_nen_lam"]
    assert 1 <= len(_cau(loi)) <= 2 and len(loi) <= 260, (m["id"], loi)
    assert len(_cau(viec)) == 1 and len(viec) <= 200, (m["id"], viec)
    for s in (loi, viec):
        assert not THUAT_NGU.search(s), (m["id"], s)
        assert not re.search(r"\d", s), (m["id"], s)            # KB không số lạ; không tuổi, không năm
        for t in TEN_SAO + TEN_CUNG:
            assert t not in s, (m["id"], t)


SUC_KHOE = re.compile(r"sức khoẻ|sức khỏe|\bkhám\b|cơ thể|bác sĩ|xét nghiệm|siêu âm", re.I)
KET_MIEN_TRU = re.compile(r"không thay (?:cho )?lời (?:khuyên của )?bác sĩ\.$")


def test_suc_khoe_kem_mien_tru_o_cuoi():
    sk = [m for m in MUC if m["loai"] == "suc_khoe_phong_ngua"]
    assert len(sk) >= 15
    for m in sk:
        assert KET_MIEN_TRU.search(m["loi_doi_thuong"]), m["id"]
        assert re.search(r"phòng ngừa|khám|chăm|xét nghiệm", m["loi_doi_thuong"] + m["viec_nen_lam"]), m["id"]


@pytest.mark.parametrize("m", MUC, ids=[m["id"] for m in MUC])
def test_moi_cau_noi_suc_khoe_deu_ket_mien_tru(m):
    if SUC_KHOE.search(m["loi_doi_thuong"] + " " + m["viec_nen_lam"]):
        assert KET_MIEN_TRU.search(m["loi_doi_thuong"]), (m["id"], m["loi_doi_thuong"])


def test_goi_y_thoi_diem_suc_khoe_la_phong_ngua():
    """Mục sức khoẻ theo hạn (lop) phải nói kiểu 'nên chú ý / đi khám', không phải dự báo."""
    co_lop = [m for m in MUC if m["loai"] == "suc_khoe_phong_ngua" and m["dieu_kien"].get("lop")]
    assert len(co_lop) >= 4
    for m in co_lop:
        assert re.search(r"nên (?:chú ý|giảm|đặt|chăm)|đi khám|khám tổng quát", m["loi_doi_thuong"]), m["id"]


def test_loi_khong_lap():
    for k in ("loi_doi_thuong", "viec_nen_lam"):
        ds = [m[k] for m in MUC]
        lap = {s for s in ds if ds.count(s) > 1}
        assert not lap, (k, lap)
