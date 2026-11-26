# -*- coding: utf-8 -*-
"""Thẻ "luận hỏi" + khối "gỡ nút" trong hỏi đáp Tử vi / Bát tự — khoá hồi quy trên 450 câu có nhãn viết độc lập
(`fixtures/cau_hoi/luan_hoi_chat_dev{,2,3,4}.jsonl`). Mặc định KHÔNG gắn thẻ khi câu hỏi về người khác, kể sự việc đã
xảy ra, ghép hai tuổi, câu kiến thức hay câu đặc biệt: thẻ dự đoán gắn sai sẽ nói ngược điều người hỏi đang sống.

`luan_hoi_chat_holdout.jsonl` (nếu có) KHÔNG dùng ở đây — chỉ chấm tay bằng `scripts/cham_luan_hoi_chat.py holdout`."""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

_SC = Path(__file__).resolve().parents[1] / "scripts" / "cham_luan_hoi_chat.py"
_spec = importlib.util.spec_from_file_location("cham_luan_hoi_chat", _SC)
cham = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cham)


@pytest.mark.parametrize("tap", ["dev", "dev2", "dev3", "dev4"])
def test_khong_gan_sai_va_phu_du(tap):
    kq = cham.cham(tap)
    assert kq.get("the.GAN_SAI", 0) == 0, kq
    assert kq.get("the.SAI_MA", 0) == 0, kq
    assert kq.get("go_nut.GAN_SAI", 0) == 0, kq
    the_can = kq.get("the.dung", 0) + kq.get("the.bo_sot", 0)
    assert kq.get("the.dung", 0) >= 0.95 * the_can, kq
