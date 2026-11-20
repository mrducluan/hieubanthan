# -*- coding: utf-8 -*-
"""Đợt 4 — Xuất có phép Nhân Tướng (Lillian Bridges 5 Ngũ Hành + 150 quy tắc cổ thư physiognomy-kb)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "engine" / "app" / "kb" / "data"

BRIDGES_5_HANH = {
    "thuy": {
        "ten": "Tướng Thủy (Water Archetype)",
        "dac_diem": "Trán rộng tròn, tai lớn dày, vùng cằm và nhân trung đầy đặn; ánh nhìn sâu và điềm tĩnh.",
        "mat_tich_cuc": "Sâu sắc, khéo thích nghi, giàu trực giác và khả năng lắng nghe; càng gặp hoàn cảnh khó càng bình tĩnh tìm đường uyển chuyển để vượt qua.",
        "mat_tieu_cuc_can_chu_y": "Nên chú ý: khi mất cân bằng dễ rơi vào lo âu, do dự kéo dài, ngại đối đầu trực diện hoặc tự cô lập cảm xúc thay vì nói thẳng nhu cầu của mình.",
        "sach_ghi": {
            "tom_y": True,
            "nguon": "Lillian Pearl Bridges, Face Reading in Chinese Medicine (2nd Ed., 2012), Ch. 6: The Water Features and Traits, tr. 160",
        },
    },
    "moc": {
        "ten": "Tướng Mộc (Wood Archetype)",
        "dac_diem": "Khuôn mặt dáng chữ nhật/dài, chân mày rõ nét, sống mũi thẳng, đường hàm gọn và ánh mắt quyết đoán.",
        "mat_tich_cuc": "Giàu tầm nhìn, dám tiên phong, hành động dứt khoát và có năng lực tổ chức dẫn dắt tập thể vươn lên trong những giai đoạn cần tăng tốc.",
        "mat_tieu_cuc_can_chu_y": "Nên chú ý: khi quá tải dễ nóng nảy, thiếu kiên nhẫn với người chậm nhịp, ôm đồm mục tiêu hoặc tự đẩy mình vào trạng thái căng thẳng kéo dài.",
        "sach_ghi": {
            "tom_y": True,
            "nguon": "Lillian Pearl Bridges, Face Reading in Chinese Medicine (2nd Ed., 2012), Ch. 7: The Wood Features and Traits, tr. 191",
        },
    },
    "hoa": {
        "ten": "Tướng Hỏa (Fire Archetype)",
        "dac_diem": "Đôi mắt sáng linh hoạt giàu biểu cảm, gò má cao gọn, nụ cười rộng và nét mặt dễ truyền năng lượng.",
        "mat_tich_cuc": "Ấm áp, nhiệt huyết, giao tiếp lôi cuốn và có khả năng truyền cảm hứng rất mạnh; dễ kết nối con người và tạo bầu không khí tích cực.",
        "mat_tieu_cuc_can_chu_y": "Nên chú ý: cảm xúc lên xuống nhanh, dễ hứng khởi bùng cháy lúc đầu nhưng nhanh chán ở chặng bền bỉ, hoặc nói quá lời khi phấn khích.",
        "sach_ghi": {
            "tom_y": True,
            "nguon": "Lillian Pearl Bridges, Face Reading in Chinese Medicine (2nd Ed., 2012), Ch. 8: The Fire Features and Traits, tr. 221",
        },
    },
    "tho": {
        "ten": "Tướng Thổ (Earth Archetype)",
        "dac_diem": "Khuôn mặt đầy đặn cân đối, má tròn ấm, môi dày hài hòa và vùng hạ đình vững vàng.",
        "mat_tich_cuc": "Chân thành, đáng tin cậy, chu đáo và có năng lực chăm lo, gắn kết gia đình lẫn đội ngũ; làm việc cẩn trọng, giữ chữ tín lâu dài.",
        "mat_tieu_cuc_can_chu_y": "Nên chú ý: dễ lo nghĩ quá nhiều cho người khác mà quên đặt ranh giới cho bản thân, ngại thay đổi thói quen cũ hoặc ôm chuyện vào lòng gây mệt mỏi.",
        "sach_ghi": {
            "tom_y": True,
            "nguon": "Lillian Pearl Bridges, Face Reading in Chinese Medicine (2nd Ed., 2012), Ch. 9: The Earth Features and Traits, tr. 251",
        },
    },
    "kim": {
        "ten": "Tướng Kim (Metal Archetype)",
        "dac_diem": "Đường nét khuôn mặt sắc gọn, gò má rõ, mũi cao thanh và thần thái tự chủ, ngăn nắp.",
        "mat_tich_cuc": "Tự lập cao, tiêu chuẩn rõ ràng, tinh tế về thẩm mỹ và công minh trong nguyên tắc; biết giữ phẩm giá và giải quyết công việc gọn gàng.",
        "mat_tieu_cuc_can_chu_y": "Nên chú ý: dễ khắt khe với bản thân lẫn người quanh mình, ngại nhờ giúp đỡ vì sợ làm phiền, hoặc tạo cảm giác xa cách khi đặt tiêu chuẩn quá cao.",
        "sach_ghi": {
            "tom_y": True,
            "nguon": "Lillian Pearl Bridges, Face Reading in Chinese Medicine (2nd Ed., 2012), Ch. 10: The Metal Features and Traits, tr. 279",
        },
    },
}


def main() -> None:
    """Chỉ dựng lại phần Ngũ Hành Bridges. Phần cổ thư (`quy_tac_co_thu`, `quy_tac_khong_dua`) đã được ban biên tập soát
    tay theo khuôn SX-C (PR #320, 2026-11-20) — giữ nguyên từ tệp hiện có, KHÔNG xuất lại từ cơ sở dữ liệu physiognomy-kb
    (bản cũ chở lời đoán thô, chưa đối chiếu kho nguồn)."""
    p = OUT / "nhantuong_ngu_hanh_va_co_thu.json"
    doc = json.loads(p.read_text("utf-8"))
    doc["ngu_hanh_bridges"] = BRIDGES_5_HANH
    p.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print("Wrote nhantuong_ngu_hanh_va_co_thu.json:", len(doc.get("quy_tac_co_thu") or []), "classical rules (giữ nguyên)")


if __name__ == "__main__":
    main()
