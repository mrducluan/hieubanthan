# -*- coding: utf-8 -*-
"""Tầng NARRATIVE (4) — diễn đạt văn mượt qua LLM (OpenRouter).

Nguyên tắc bất di bất dịch (CLAUDE.md tầng 4): LLM CHỈ diễn đạt lại các trường
đã có từ tầng KB/RULES. CẤM thêm bất kỳ dữ kiện nào ngoài input — không thêm con
số, không thêm dự đoán, không bịa nguồn. Nếu vi phạm, cả triết lý "Cách B" sụp.

Env-gated:
  - Không có OPENROUTER_API_KEY → chế độ TEMPLATE: trả nguyên bản luận giải có
    cấu trúc, không gọi mạng. Chạy được ngay, miễn phí.
  - Có key → chế độ LLM: gửi CHỈ dữ liệu đã có + prompt ràng buộc, nhận văn xuôi.

Đây là lớp phục vụ bản luận CHI TIẾT (gói trả phí sau này), không phải bản xem
nhanh miễn phí.
"""
from __future__ import annotations

import json
import os

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-3.5-sonnet"

_SYSTEM = """Bạn là biên tập viên, KHÔNG phải thầy bói. Nhiệm vụ duy nhất: diễn \
đạt lại dữ liệu thần số học đã cho thành văn xuôi tiếng Việt mạch lạc, ấm áp \
nhưng không hứa hẹn.

RÀNG BUỘC TUYỆT ĐỐI:
- CHỈ dùng thông tin trong dữ liệu JSON được cung cấp. TUYỆT ĐỐI không thêm con \
số, sự kiện, dự đoán tương lai, hay bất kỳ chi tiết nào không có trong dữ liệu.
- Giữ nguyên tinh thần: mỗi chỉ số phải nêu cả MẶT TỐI và CÂU PHẢN CHỨNG. Không \
được bỏ mặt tối để nghe cho hay.
- Không dùng giọng phán quyết ("bạn sẽ", "chắc chắn"). Dùng giọng tham khảo \
("theo cổ thư", "người có cấu trúc này thường được mô tả là").
- Cuối bài nhắc: đây là nội dung văn hoá tham khảo, không phải dự báo.
- Không bịa nguồn. Chỉ nhắc nguồn đã cho trong dữ liệu."""


def _có_key() -> str | None:
    return os.environ.get("OPENROUTER_API_KEY")


def dung_prompt(reading: dict) -> list[dict]:
    """Dựng messages cho LLM — CHỈ đưa dữ liệu đã có, không thêm gì."""
    return [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content":
            "Dữ liệu luận giải (JSON). Diễn đạt thành bài văn xuôi tiếng Việt, "
            "mỗi chỉ số một đoạn, giữ đủ mặt tối và câu phản chứng:\n\n"
            + json.dumps(reading, ensure_ascii=False, indent=2)},
    ]


_SYSTEM_HOI = """Bạn giúp người dùng SOI câu hỏi của họ qua lăng kính thần số \
học CỦA CHÍNH HỌ. Bạn KHÔNG phải thầy bói.

Dữ liệu con số của người dùng được cung cấp dưới dạng JSON. Nhiệm vụ: trả lời \
câu hỏi bằng cách KẾT NỐI câu hỏi với các con số và ý nghĩa đã cho.

RÀNG BUỘC TUYỆT ĐỐI — vi phạm là làm hỏng cả sản phẩm:
- KHÔNG dự đoán tương lai. KHÔNG nói "bạn sẽ", "chắc chắn", "sắp tới bạn gặp". \
Chỉ phản chiếu: "theo con số X của bạn, cổ thư mô tả kiểu người…", "cấu trúc \
này thường gắn với…".
- CHỈ dùng dữ kiện trong JSON đã cho. KHÔNG thêm con số, sự kiện, tên người, \
ngày tháng, hay bất cứ chi tiết nào không có trong dữ liệu.
- Luôn giữ tính hai mặt: nhắc cả mặt tối liên quan, không chỉ lời hay.
- Nếu câu hỏi vượt ngoài điều con số nói được (vd hỏi số lô đề, sức khoẻ cụ \
thể, ngày cưới chính xác), nói thẳng: thần số học không trả lời được điều đó, \
và không bịa.
- Kết bằng một câu tự kiểm hoặc nhắc: đây là góc nhìn tham khảo văn hoá để bạn \
tự soi, không phải câu trả lời chắc chắn về đời bạn.
- Trả lời tiếng Việt, ấm áp, ngắn gọn (3–6 câu), không sáo rỗng."""


def tra_loi_cau_hoi(reading: dict, cau_hoi: str) -> dict:
    """Trả lời một câu hỏi của người dùng, GẮN vào con số của họ, giọng tham chiếu.

    Không key → báo tính năng chưa bật (không bịa câu trả lời).
    """
    key = _có_key()
    if not key:
        return {"da_bat_llm": False,
                "thong_bao": "Tính năng hỏi sâu cần bật lớp AI (chưa cấu hình).",
                "cau_tra_loi": None}

    model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
    messages = [
        {"role": "system", "content": _SYSTEM_HOI},
        {"role": "user", "content":
            f"Câu hỏi của người dùng: {cau_hoi}\n\n"
            f"Con số của họ (JSON, chỉ dùng dữ liệu này):\n"
            + json.dumps(reading, ensure_ascii=False)},
    ]
    try:
        with httpx.Client(timeout=45) as c:
            r = c.post(OPENROUTER_URL,
                       headers={"Authorization": f"Bearer {key}",
                                "Content-Type": "application/json"},
                       json={"model": model, "messages": messages, "temperature": 0.6})
            r.raise_for_status()
            ans = r.json()["choices"][0]["message"]["content"]
        return {"da_bat_llm": True, "model": model, "cau_tra_loi": ans}
    except Exception as e:
        return {"da_bat_llm": True, "cau_tra_loi": None,
                "loi": "Xin lỗi, chưa trả lời được lúc này. " + str(e)[:120]}


def dien_dat(reading: dict) -> dict:
    """Trả về bản luận kèm văn xuôi nếu có LLM, ngược lại giữ template."""
    key = _có_key()
    if not key:
        return {"che_do": "template", "luan_giai": reading, "van_xuoi": None}

    model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
    try:
        with httpx.Client(timeout=40) as c:
            r = c.post(
                OPENROUTER_URL,
                headers={"Authorization": f"Bearer {key}",
                         "Content-Type": "application/json"},
                json={"model": model, "messages": dung_prompt(reading),
                      "temperature": 0.7},
            )
            r.raise_for_status()
            van = r.json()["choices"][0]["message"]["content"]
        return {"che_do": "llm", "model": model,
                "luan_giai": reading, "van_xuoi": van}
    except Exception as e:
        # Lỗi LLM không được làm sập bản luận — rơi về template.
        return {"che_do": "template_fallback", "loi": str(e)[:200],
                "luan_giai": reading, "van_xuoi": None}
