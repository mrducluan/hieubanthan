# -*- coding: utf-8 -*-
"""Bậc 2 & 3 — Engine phân tích Đội Ngũ & Cộng Sự cho Chủ Doanh Nghiệp (từ kinh doanh nhỏ đến doanh nghiệp lớn).

Tầng CALC + RULES tất định (100% toán học, 0 LLM): kết hợp Bát Tự (`battu.la_so`, `quan_he_chi`) + Thần Số Học
(`thanso.duong_doi`, `dinh_cao`, `nam_ca_nhan`) để phân tích:
  1. 6 yếu tố cốt lõi của nhân sự & giá trị thực tế mang lại cho Ông Chủ;
  2. Độ bù khuyết Ngũ Hành giữa Nhân Sự và Ông Chủ;
  3. Phân tích 2 chiều: Ông Chủ cần chú ý điều gì khi quản trị & Nhân Sự cần lưu ý gì để phát huy;
  4. Bản Đồ Cân Bằng Ngũ Hành Đội Ngũ (1 Ông Chủ + 1..8 nhân sự chủ chốt) — chỉ ra hành thừa / lỗ hổng vận hành.

Ranh giới bắt buộc: chỉ dùng tham khảo giao tiếp, phân bổ vai trò và xây dựng văn hóa phối hợp; tuyệt đối không dùng làm
tiêu chí sàng lọc tuyển dụng hay phân biệt đối xử lao động.
"""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.calc import battu, thanso

HANH_5 = ("Kim", "Mộc", "Thủy", "Hỏa", "Thổ")
_HANH_EN = {"Kim": "Metal", "Mộc": "Wood", "Thủy": "Water", "Hỏa": "Fire", "Thổ": "Earth"}
_CHI_12 = ("Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi")
_LUC_HOP = {frozenset((0, 1)), frozenset((2, 11)), frozenset((3, 10)), frozenset((4, 9)), frozenset((5, 8)), frozenset((6, 7))}


def _quan_he_dia_chi(chi_a: str, chi_b: str) -> str:
    """Tính quan hệ Địa Chi thuần toán học theo chỉ số 12 Chi (không phụ thuộc chuỗi tiếng Việt)."""
    ia, ib = _CHI_12.index(chi_a), _CHI_12.index(chi_b)
    if abs(ia - ib) == 6:
        return "luc_xung"
    if frozenset((ia, ib)) in _LUC_HOP:
        return "luc_hop"
    if ia != ib and (ia - ib) % 4 == 0:
        return "tam_hop"
    return "binh"

_VAI_TRO_HANH = {
    "Kim": {
        "vi": ("Kiểm soát tài chính · Pháp chế · Quản trị rủi ro", "Giữ kỷ luật ngân sách, chuẩn hóa tiêu chuẩn chất lượng và ra quyết định tỉnh táo bằng số liệu."),
        "en": ("Finance Control · Compliance · Risk Governance", "Maintains budget discipline, quality standards, and data-driven decision rigor."),
    },
    "Mộc": {
        "vi": ("Mở rộng thị trường · Chiến lược · Phát triển dự án mới", "Tạo đà tăng trưởng, dám tiên phong khai phá sản phẩm hoặc chi nhánh mới cho doanh nghiệp."),
        "en": ("Market Expansion · Strategy · New Initiatives", "Drives growth momentum and pioneers new products, markets, or business units."),
    },
    "Thủy": {
        "vi": ("Đối ngoại · Thương lượng · R&D & Phân tích dữ liệu", "Linh hoạt xoay chuyển tình thế, giỏi đàm phán khách hàng khó và đọc nhanh biến động thị trường."),
        "en": ("Client Relations · Negotiation · Research & Analytics", "Adapts fluidly to market shifts, excels in complex negotiation and deep analysis."),
    },
    "Hỏa": {
        "vi": ("Kinh doanh tuyến đầu · Truyền thông · Truyền lửa đội nhóm", "Tạo năng lượng tích cực, chốt đơn nhanh, xây dựng thương hiệu và kết nối tinh thần tập thể."),
        "en": ("Frontline Sales · Brand Marketing · Team Energy", "Builds momentum, closes deals, strengthens brand visibility, and energizes teams."),
    },
    "Thổ": {
        "vi": ("Vận hành · Quy trình · Giữ chân khách hàng & Hậu cần", "Đảm bảo bộ máy chạy đều tay, giữ chữ tín giao hàng đúng hẹn và ổn định nội bộ dài hạn."),
        "en": ("Operations · Process · Retention & Execution", "Keeps daily operations steady, delivers reliably on commitments, and stabilizes the team."),
    },
}

_DD_PROFILE = {
    1: ("Tự chủ cao, dám nhận trách nhiệm đầu mối; hợp giao mục tiêu độc lập hơn là bị giám sát sát từng bước.",
        "Dễ nóng vội hoặc muốn tự làm hết thay vì phối hợp; nên thống nhất quyền quyết định và mốc báo cáo rõ ràng.",
        "High ownership and initiative; thrives on clear autonomous goals rather than micromanagement.",
        "May act too unilaterally; align on decision rights and regular sync milestones."),
    2: ("Khéo hòa giải, lắng nghe tinh tế và giữ nhịp phối hợp êm thấm giữa các phòng ban.",
        "Đôi khi ngại nói thẳng khi có bất đồng; ông chủ cần chủ động hỏi ý kiến riêng để không bỏ sót góp ý quan trọng.",
        "Skilled mediator and attentive listener who keeps cross-team collaboration smooth.",
        "May hold back candid disagreement; invite private feedback proactively."),
    3: ("Sáng tạo, giao tiếp cuốn hút, rất mạnh ở khâu ý tưởng, bán hàng và làm sống động văn hóa công ty.",
        "Dễ dàn trải nhiều ý tưởng cùng lúc mà thiếu bước hoàn thiện cuối; nên ghép cặp cùng người mạnh quy trình.",
        "Creative and expressive; strong in ideation, pitching, and energizing company culture.",
        "Can scatter focus across too many ideas; pair with structured execution checkpoints."),
    4: ("Kỷ luật, cẩn trọng, làm việc có hệ thống và rất đáng tin cậy ở những khâu cần độ chính xác cao.",
        "Hơi chậm khi phải đổi hướng đột ngột; khi thay đổi kế hoạch cần giải thích rõ lý do và lộ trình chuyển tiếp.",
        "Disciplined, methodical, and dependable in precision-critical operations.",
        "Prefers predictability; explain rationale and transition steps clearly before pivoting."),
    5: ("Linh hoạt, học nhanh, xử lý biến cố tốt và thích hợp với mảng thị trường biến động hoặc phát triển mới.",
        "Dễ chán với công việc lặp lại đơn điệu; nên giao bài toán có không gian thử nghiệm và mục tiêu mới theo quý.",
        "Adaptable, fast learner suited for dynamic markets and rapid problem-solving.",
        "Loses energy in repetitive routines; rotate fresh challenges and quarterly milestones."),
    6: ("Tận tâm, tinh thần trách nhiệm cao với tập thể và khách hàng, hợp vai trò quản lý chăm sóc & giữ người.",
        "Dễ ôm việc thay cho người dưới quyền gây quá tải; cần hướng dẫn rõ cách phân quyền và đặt ranh giới công việc.",
        "Committed and service-minded; excels at team care, retention, and customer stewardship.",
        "Tends to over-carry others' workload; coach on delegation and clear boundaries."),
    7: ("Tư duy phân tích sâu, nhìn ra lỗ hổng hệ thống sớm, hợp nghiên cứu chuyên môn, kỹ thuật và kiểm soát chất lượng.",
        "Ít bộc lộ cảm xúc và không thích họp hành hình thức; nên trao đổi ngắn gọn, dựa trên dữ kiện thực tế.",
        "Deep analytical thinker who spots structural gaps early; excels in technical or audit roles.",
        "Dislikes superficial meetings; communicate concisely using concrete facts."),
    8: ("Nhạy bén với con số, mục tiêu doanh thu và quản trị nguồn lực; có tố chất dẫn dắt bộ phận kinh doanh hoặc tài chính.",
        "Cái tôi nghề nghiệp mạnh, dễ va chạm quyền lực nếu ranh giới thẩm quyền mập mờ; cần KPI minh bạch và cơ chế thưởng xứng đáng.",
        "Commercially sharp with strong executive drive for revenue and resource management.",
        "Strong professional ego; define authority boundaries and transparent performance incentives."),
    9: ("Tầm nhìn rộng, nhân văn, giỏi kết nối cộng đồng, thương hiệu và dẫn dắt các dự án có giá trị dài hạn.",
        "Đôi khi đặt lý tưởng cao hơn tính thực tế ngắn hạn; nên gắn mục tiêu ý nghĩa với các chỉ số đo lường cụ thể.",
        "Broad vision and empathy; strong in brand purpose, community, and long-horizon initiatives.",
        "Can prioritize idealism over near-term metrics; anchor vision to measurable milestones."),
    11: ("Trực giác sắc bén, nhạy với xu hướng và cảm xúc con người; phù hợp vai trò cố vấn, sáng tạo và xây dựng thương hiệu.",
         "Nhạy cảm với áp lực hỗn loạn kéo dài; cần môi trường làm việc minh bạch, ít chính trị nội bộ để phát huy tối đa.",
         "Perceptive intuition for trends and human dynamics; excels in strategy and brand roles.",
         "Sensitive to chaotic internal politics; thrives in transparent, low-drama environments."),
    22: ("Năng lực xây dựng hệ thống lớn và biến tầm nhìn dài hạn thành mô hình vận hành thực tế.",
         "Tự tạo áp lực kỳ vọng rất cao cho bản thân lẫn đồng đội; cần chia nhỏ mục tiêu theo giai đoạn để tránh kiệt sức.",
         "Capable of architecting large-scale systems and turning long-term vision into reality.",
         "Sets intense expectations; break multi-year goals into sustainable phases."),
    33: ("Khả năng nâng đỡ, đào tạo đội ngũ và tạo uy tín bền vững với khách hàng lẫn đối tác.",
         "Dễ đặt lợi ích người khác lên trên kỷ luật công việc; cần giữ tiêu chuẩn đánh giá công bằng và rõ ràng.",
         "Natural mentor who elevates team capability and builds lasting stakeholder trust.",
         "May soften standards out of empathy; maintain fair, objective accountability."),
}

_NHIP_NAM = {
    1: ("Pha khởi xướng — phù hợp giao dự án mới hoặc mở thị trường.", "Initiation phase — suited for launching new projects or markets."),
    2: ("Pha phối hợp — mạnh về giữ quan hệ, thương lượng và hỗ trợ đội ngũ.", "Collaboration phase — strong in partnerships, diplomacy, and team alignment."),
    3: ("Pha mở rộng giao tiếp — thuận lợi cho kinh doanh, truyền thông và sáng tạo.", "Expression phase — favorable for sales, marketing, and creative output."),
    4: ("Pha xây nền — thích hợp chuẩn hóa quy trình, kiểm soát chi phí và đào tạo.", "Foundation phase — ideal for process rigor, cost control, and system building."),
    5: ("Pha chuyển dịch — năng lượng thay đổi cao, cần giao mục tiêu linh hoạt để tránh nhàm chán.", "Transition phase — high appetite for change; provide dynamic goals."),
    6: ("Pha trách nhiệm — tập trung gắn kết nội bộ, chăm sóc khách hàng và giữ chất lượng.", "Stewardship phase — strong for retention, service quality, and team stability."),
    7: ("Pha đào sâu — hợp nghiên cứu, nâng cấp chuyên môn và rà soát lỗ hổng hệ thống.", "Deep-focus phase — suited for R&D, upskilling, and structural audits."),
    8: ("Pha gặt hái & thực thi mạnh — hợp nhận phần việc có mục tiêu đo được rõ ràng.", "Execution & harvest phase — suits work with clearly measurable goals."),
    9: ("Pha tổng kết & chuyển giao — thích hợp đóng gói kinh nghiệm, dọn gọn dự án cũ để chuẩn bị chu kỳ mới.", "Completion phase — ideal for wrapping up legacy work and preparing the next cycle."),
}

_RANH_GIOI_VI = (
    "Lưu ý ranh giới ứng dụng & pháp lý: Kết quả phân tích đội ngũ chỉ mang tính tham khảo để hiểu phong cách làm việc, "
    "cải thiện giao tiếp và phân bổ vai trò hợp tác — tuyệt đối không dùng làm tiêu chí sàng lọc tuyển dụng, đánh giá năng lực "
    "hay phân biệt đối xử người lao động. "
    "Về dữ liệu: hieuban.com chỉ nhận ngày sinh, giới tính và thông tin do chủ doanh nghiệp tự nhập. Chủ doanh nghiệp xác nhận "
    "đã có thoả thuận riêng và sự đồng ý của từng thành viên trước khi nhập, và tự chịu trách nhiệm về tính hợp pháp của việc "
    "thu thập, cung cấp và sử dụng dữ liệu đó theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15. hieuban.com chỉ dùng dữ liệu để "
    "tính trong lượt xem này, không lưu lại. "
    "Về nội dung: phần luận giải được dựng theo phép tính cố định trên kho tri thức Bát tự và Thần số học tổng hợp từ sách, "
    "tài liệu; đây là thông tin tham khảo văn hoá, không phải ý kiến chuyên môn về quản trị nhân sự, pháp lý hay tâm lý, và "
    "không bảo đảm đúng với từng người. Mọi quyết định về giao việc, đánh giá, đãi ngộ hay quan hệ lao động do chủ doanh nghiệp "
    "tự cân nhắc và tự chịu trách nhiệm; hieuban.com không chịu trách nhiệm về quyết định hay hệ quả phát sinh từ việc sử dụng "
    "kết quả này."
)
_RANH_GIOI_EN = (
    "Legal & ethical boundary: Team analytics are strictly a reference tool for communication style, role alignment, "
    "and collaborative culture — never use them for hiring screening, performance grading, or employment discrimination. "
    "Data: hieuban.com only receives birth dates, gender and details provided by the business owner. The business owner "
    "confirms having a separate agreement with, and the consent of, each team member before entering their data, and bears "
    "sole responsibility for the lawfulness of collecting, providing and using it under applicable data-protection law. "
    "Data is used only for this calculation and is not stored. "
    "Content: the reading is generated by fixed rules from a knowledge base compiled from books and reference material on "
    "BaZi and numerology; it is cultural reference information, not professional HR, legal or psychological advice, and is "
    "not guaranteed to fit any individual. All decisions on assignments, evaluation, compensation or employment remain the "
    "business owner's sole responsibility; hieuban.com accepts no liability for decisions or consequences arising from use "
    "of these results."
)


def _ho_so_co_ban(ngay: int, thang: int, nam: int, gioi_tinh: str, nam_xem: int) -> dict:
    """Tính toán tất định Bát Tự + Thần Số cho 1 người (dùng giờ Ngọ 12:00 khi không có giờ sinh; nam_xem bắt buộc)."""
    ls = battu.la_so(dt.datetime(nam, thang, ngay, 12, 0), gioi_tinh)
    nh = ls["ngu_hanh"]["diem"]
    tong_nh = sum(nh.values()) or 1.0
    ty_le_nh = {h: round(nh.get(h, 0.0) / tong_nh, 3) for h in HANH_5}
    hanh_manh = max(HANH_5, key=lambda h: ty_le_nh[h])
    hanh_yeu = min(HANH_5, key=lambda h: ty_le_nh[h])
    can_dt = list((ls.get("dung_than") or {}).get("can") or [hanh_yeu])
    dd = thanso.duong_doi(ngay, thang, nam)
    ncn = thanso.nam_ca_nhan(ngay, thang, nam_xem)
    chi_nam = ls["tru"][0]["chi"]
    return {
        "nhat_chu_hanh": ls["nhat_chu"]["ngu_hanh"],
        "chi_nam": chi_nam,
        "ty_le_ngu_hanh": ty_le_nh,
        "hanh_manh": hanh_manh,
        "hanh_yeu": hanh_yeu,
        "hanh_can_bu": can_dt,
        "duong_doi": dd,
        "nam_ca_nhan": ncn,
    }


def phan_tich_nhan_su(ong_chu: dict, nhan_su: dict, nam_xem: int) -> dict:
    """Phân tích 2 chiều phong cách hợp tác & giao tiếp giữa 1 Ông Chủ và 1 Thành Viên tự nguyện đồng ý."""
    vi = ngon_ngu.la_viet()
    nam_hien = nam_xem
    ceo = _ho_so_co_ban(ong_chu["ngay"], ong_chu["thang"], ong_chu["nam"], ong_chu.get("gioi_tinh", "nam"), nam_hien)
    ns = _ho_so_co_ban(nhan_su["ngay"], nhan_su["thang"], nhan_su["nam"], nhan_su.get("gioi_tinh", "nam"), nam_hien)

    qh_chi = _quan_he_dia_chi(ceo["chi_nam"], ns["chi_nam"])
    bu_hanh = ns["hanh_manh"] in ceo["hanh_can_bu"] or ns["hanh_manh"] == ceo["hanh_yeu"]
    cai_toi_manh = ceo["duong_doi"] in (1, 8, 22) and ns["duong_doi"] in (1, 8, 22)

    if bu_hanh and qh_chi not in ("luc_xung", "tuong_hinh"):
        muc_phoi_hop = "bu_khuyet_cao"
        nhan_phoi_hop = "Bù khuyết cao" if vi else "High Complementarity"
    elif qh_chi in ("luc_xung", "tuong_hinh") or cai_toi_manh:
        muc_phoi_hop = "can_quy_che_ro"
        nhan_phoi_hop = "Cần quy chế giao tiếp rõ" if vi else "Needs Clear Operating Rules"
    else:
        muc_phoi_hop = "bo_tro_tot"
        nhan_phoi_hop = "Bổ trợ ổn định" if vi else "Steady Synergy"

    vt_ten, vt_hieu_qua = _VAI_TRO_HANH[ns["hanh_manh"]]["vi" if vi else "en"]
    dd_pos_vi, dd_warn_vi, dd_pos_en, dd_warn_en = _DD_PROFILE.get(ns["duong_doi"], _DD_PROFILE[4])
    nhip_vi, nhip_en = _NHIP_NAM.get(ns["nam_ca_nhan"], _NHIP_NAM[4])

    if vi:
        bu_khuyet_giai_thich = (
            f"Ông chủ đang cần bổ sung hành {ceo['hanh_yeu']}; nhân sự mạnh hành {ns['hanh_manh']} nên tạo hiệu ứng bù khuyết rất tốt cho điểm yếu vận hành của lãnh đạo."
            if bu_hanh
            else f"Nhân sự nổi trội hành {ns['hanh_manh']} (trong khi ông chủ cần bù hành {ceo['hanh_yeu']}); thiên về bổ trợ chuyên môn theo vai trò riêng hơn là bù trực tiếp điểm thiếu."
        )
        ong_chu_chu_y = [
            dd_warn_vi,
            (
                "Hai bên có nhịp phản ứng dễ đối chọi thẳng (địa chi xung/hình hoặc cùng cá tính quyết liệt): nên trao đổi dựa trên KPI văn bản, tránh tranh luận cảm tính trước tập thể."
                if (qh_chi in ("luc_xung", "tuong_hinh") or cai_toi_manh)
                else "Duy trì nhịp phản hồi định kỳ hàng tuần để nhân sự hiểu rõ ưu tiên của ông chủ và không làm lệch trọng tâm."
            ),
            f"Trong năm {nam_hien} (Năm cá nhân số {ns['nam_ca_nhan'][1] if isinstance(ns['nam_ca_nhan'], (list, tuple)) else ns['nam_ca_nhan']}): {nhip_vi}",
        ]
        nhan_su_luu_y = [
            f"Chủ động phát huy sở trường cốt lõi ({vt_ten.lower()}) và báo cáo kết quả ngắn gọn theo đúng mối quan tâm của người đứng đầu.",
            "Nhận diện sớm điểm yếu tiềm ẩn khi áp lực tăng cao; chủ động đề xuất giải pháp thay vì chỉ báo khó khăn.",
        ]
        sau_yeu_to = [
            {"yeu_to": "Hiệu quả mang lại cho ông chủ", "chi_tiet": vt_hieu_qua},
            {"yeu_to": "Sở trường giải quyết vấn đề", "chi_tiet": dd_pos_vi},
            {"yeu_to": "Khả năng bù khuyết với lãnh đạo", "chi_tiet": bu_khuyet_giai_thich},
            {"yeu_to": "Nhịp làm việc năm nay", "chi_tiet": nhip_vi},
            {"yeu_to": "Vai trò đề xuất phát huy cao nhất", "chi_tiet": vt_ten},
            {"yeu_to": "Cách đặt cơ chế phối hợp hiệu quả", "chi_tiet": ong_chu_chu_y[1]},
        ]
    else:
        bu_khuyet_giai_thich = (
            f"Leader benefits from {_HANH_EN[ceo['hanh_yeu']]} balance; this member brings strong {_HANH_EN[ns['hanh_manh']]} traits that directly complement leadership gaps."
            if bu_hanh
            else f"Member leads with {_HANH_EN[ns['hanh_manh']]} energy; best positioned in a dedicated functional lane."
        )
        ong_chu_chu_y = [
            dd_warn_en,
            (
                "High-friction decision styles detected: anchor collaboration in written KPIs and clear decision rights rather than ad-hoc debates."
                if (qh_chi in ("luc_xung", "tuong_hinh") or cai_toi_manh)
                else "Keep a steady weekly alignment cadence so priorities stay synchronized."
            ),
            f"Year {nam_hien} (Personal Year {ns['nam_ca_nhan'][1] if isinstance(ns['nam_ca_nhan'], (list, tuple)) else ns['nam_ca_nhan']}): {nhip_en}",
        ]
        nhan_su_luu_y = [
            f"Lean into core value creation ({vt_ten}) and communicate outcomes concisely.",
            "Watch personal blind spots under pressure and bring concrete proposals alongside issues.",
        ]
        sau_yeu_to = [
            {"yeu_to": "Core outcome for the owner", "chi_tiet": vt_hieu_qua},
            {"yeu_to": "Problem-solving strength", "chi_tiet": dd_pos_en},
            {"yeu_to": "Leadership complementarity", "chi_tiet": bu_khuyet_giai_thich},
            {"yeu_to": "This year's working rhythm", "chi_tiet": nhip_en},
            {"yeu_to": "Recommended primary role", "chi_tiet": vt_ten},
            {"yeu_to": "Collaboration cadence", "chi_tiet": ong_chu_chu_y[1]},
        ]

    return {
        "ten": nhan_su.get("ten") or ("Nhân sự" if vi else "Member"),
        "vai_tro_hien_tai": nhan_su.get("vai_tro") or "",
        "nhom_viec": nhan_su.get("nhom_viec") or "",
        "khop_nhom_viec": _danh_gia_nhom_viec(nhan_su.get("nhom_viec") or "", ns["hanh_manh"], vi),
        "chi_so": {
            "hanh_manh": ns["hanh_manh"],
            "duong_doi": ns["duong_doi"],
            "nam_ca_nhan": ns["nam_ca_nhan"],
            "quan_he_dia_chi": qh_chi,
            "bu_khuyet_ngu_hanh": bu_hanh,
        },
        "muc_phoi_hop": muc_phoi_hop,
        "nhan_phoi_hop": nhan_phoi_hop,
        "vai_tro_goi_y": vt_ten,
        "sau_yeu_to_cot_loi": sau_yeu_to,
        "mat_tich_cuc": dd_pos_vi if vi else dd_pos_en,
        "ong_chu_can_chu_y": ong_chu_chu_y,
        "nhan_su_can_luu_y": nhan_su_luu_y,
        "kich_ban_trao_doi": (
            "Khi bất đồng hướng làm: mở đầu bằng câu 'Mục tiêu chung quý này là X — theo góc nhìn của bạn, rủi ro lớn nhất nằm ở bước nào?' rồi chốt bằng văn bản 3 gạch đầu dòng."
            if vi else
            "When styles diverge: open with 'Our shared quarterly outcome is X — from your angle, where is the biggest execution risk?' and close with 3 written action items."
        ),
    }


_NHOM_VIEC: dict[str, dict] = {
    "kinh_doanh": {
        "hanh": ("Hỏa", "Mộc"),
        "vi": "Kinh doanh & Bán hàng",
        "en": "Sales & Business Development",
        "ho_tro_vi": "Đặt mục tiêu ngắn theo tuần và ghép thêm quy trình chăm sóc sau bán để giữ nhịp bền.",
        "ho_tro_en": "Use weekly milestones paired with structured post-sale follow-up checklists.",
    },
    "van_hanh": {
        "hanh": ("Thổ", "Kim"),
        "vi": "Vận hành & Quy trình",
        "en": "Operations & Process",
        "ho_tro_vi": "Chuẩn hóa đầu mục bàn giao bằng checklist ngắn và tách rõ việc gấp với việc định kỳ.",
        "ho_tro_en": "Anchor handoffs in concise checklists and separate urgent requests from routine flow.",
    },
    "tai_chinh": {
        "hanh": ("Kim", "Thổ"),
        "vi": "Tài chính & Kiểm soát rủi ro",
        "en": "Finance & Risk Control",
        "ho_tro_vi": "Áp dụng bước kiểm chéo 2 lượt cho số liệu quan trọng và thống nhất lịch chốt báo cáo cố định.",
        "ho_tro_en": "Use two-step verification on critical numbers and a fixed reporting cadence.",
    },
    "san_pham": {
        "hanh": ("Thủy", "Kim"),
        "vi": "Sản phẩm / Kỹ thuật / R&D",
        "en": "Product / Engineering / R&D",
        "ho_tro_vi": "Chốt rõ phạm vi đầu ra trước khi bắt tay làm và giới hạn số lần đổi yêu cầu giữa chừng.",
        "ho_tro_en": "Lock scope before execution and limit mid-sprint requirement shifts.",
    },
    "marketing": {
        "hanh": ("Mộc", "Hỏa"),
        "vi": "Marketing & Sáng tạo",
        "en": "Marketing & Creative",
        "ho_tro_vi": "Trao không gian thử nghiệm trong khung ngân sách rõ ràng và đo bằng 2–3 chỉ số cốt lõi.",
        "ho_tro_en": "Provide room to experiment within clear budget guardrails and 2–3 core metrics.",
    },
    "doi_ngoai": {
        "hanh": ("Thủy", "Thổ"),
        "vi": "Chăm sóc khách hàng & Đối ngoại",
        "en": "Customer Success & Partnerships",
        "ho_tro_vi": "Quy định rõ biên độ xử lý tình huống để cộng sự chủ động giải quyết nhanh cho khách hàng.",
        "ho_tro_en": "Define clear resolution boundaries so the member can respond quickly to partners and clients.",
    },
}

_CAP_QUAN_LY: dict[str, dict] = {
    "chu_dn": {
        "vi": (
            "Chủ doanh nghiệp / Nhà sáng lập",
            "Bù lỗ hổng vận hành cốt lõi và giữ nhịp trụ cột",
            "Dùng Bản đồ 5 Hành để nhìn trục hành đang mỏng của cả nhóm, ưu tiên củng cố bằng quy trình rõ và phân quyền dứt khoát cho người có mức Bù khuyết cao.",
        ),
        "en": (
            "Business Owner / Founder",
            "Balance core operational gaps and anchor key pillars",
            "Use the 5-Element Radar to spot the team's lightest axis, reinforce it with clear processes, and delegate cleanly to high-complementarity counterparts.",
        ),
    },
    "giam_doc": {
        "vi": (
            "Giám đốc bộ phận / Quản lý cấp trung",
            "Cầu nối chiến lược giữa Ban Giám đốc và các nhóm thực thi",
            "Tập trung ghép đúng cặp cộng sự trong phòng ban (người mở rộng đi cùng người giữ quy trình) và chuyển mục tiêu từ cấp trên thành đầu việc rõ ràng theo tháng.",
        ),
        "en": (
            "Department Director / Mid-level Manager",
            "Bridge executive strategy with team execution",
            "Pair complementary teammates inside your department (expansion-minded with process-minded) and translate leadership goals into clear monthly deliverables.",
        ),
    },
    "truong_nhom": {
        "vi": (
            "Trưởng nhóm / Team Lead",
            "Giữ tiến độ hằng tuần, gỡ tắc nghẽn và tránh kiệt sức cho cả nhóm",
            "Dùng cột 'Điều cần chú ý' để chọn cách giao việc và góp ý hợp phong cách từng người; chốt đầu việc gọn bằng 3 gạch đầu dòng mỗi đầu tuần.",
        ),
        "en": (
            "Team Lead / Supervisor",
            "Maintain weekly execution cadence and unblock teammates",
            "Tailor weekly task handoffs and feedback style to each teammate's collaboration profile and close every check-in with 3 written priorities.",
        ),
    },
}


def _danh_gia_nhom_viec(nhom_viec: str, hanh_manh: str, vi: bool) -> dict | None:
    """So khớp mang tính hỗ trợ giữa hành chính của cộng sự và nhóm công việc đang làm (tuyệt đối không đánh giá/sàng lọc)."""
    if not nhom_viec or nhom_viec not in _NHOM_VIEC:
        return None
    nv = _NHOM_VIEC[nhom_viec]
    ten_nv = nv["vi"] if vi else nv["en"]
    if hanh_manh in nv["hanh"]:
        return {
            "ma": nhom_viec,
            "ten": ten_nv,
            "muc": "thuan_luc",
            "nhan": "Thuận lực tự nhiên" if vi else "Natural momentum",
            "giai_thich": (
                f"Trục hành {hanh_manh} đồng nhịp với đặc thù mảng {ten_nv}: cộng sự dễ bắt nhịp tự nhiên, quản lý chỉ cần chốt rõ mục tiêu đầu ra."
                if vi
                else f"{_HANH_EN[hanh_manh]} energy aligns naturally with {ten_nv}: focus on clear outcome targets and autonomy."
            ),
        }
    return {
        "ma": nhom_viec,
        "ten": ten_nv,
        "muc": "bo_sung_goc_nhin",
        "nhan": "Bổ sung góc nhìn khác biệt" if vi else "Complementary perspective",
        "giai_thich": (
            f"Cộng sự thiên hành {hanh_manh} khi làm mảng {ten_nv} sẽ mang lại góc nhìn cân bằng mới cho nhóm. {nv['ho_tro_vi']}"
            if vi
            else f"Bringing {_HANH_EN[hanh_manh]} energy into {ten_nv} adds a balancing perspective. {nv['ho_tro_en']}"
        ),
    }


def _goi_y_ghep_cap(chi_tiet_ns: list[dict], vi: bool) -> list[dict]:
    """Gợi ý tối đa 3 cặp cộng sự trong nhóm có hành bổ trợ tốt khi cùng chạy một dự án."""
    ket_qua: list[dict] = []
    n = len(chi_tiet_ns)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = chi_tiet_ns[i], chi_tiet_ns[j]
            ha, hb = a["chi_so"]["hanh_manh"], b["chi_so"]["hanh_manh"]
            if ha == hb:
                continue
            ly_do = (
                f"Hành {ha} thiên về {_VAI_TRO_HANH[ha]['vi'][0].lower()}, kết hợp cùng hành {hb} mạnh {_VAI_TRO_HANH[hb]['vi'][0].lower()} giúp dự án vừa có lực đẩy vừa có điểm chốt."
                if vi
                else f"{_HANH_EN[ha]} energy pairs smoothly with {_HANH_EN[hb]}, balancing initiative with structured follow-through."
            )
            ket_qua.append({
                "ten_a": a["ten"],
                "ten_b": b["ten"],
                "hanh_a": ha if vi else _HANH_EN[ha],
                "hanh_b": hb if vi else _HANH_EN[hb],
                "ly_do": ly_do,
            })
            if len(ket_qua) >= 3:
                return ket_qua
    return ket_qua


def ban_do_doi_ngu(ong_chu: dict, doi_ngu: list[dict], nam_xem: int, cap_quan_ly: str = "chu_dn") -> dict:
    """Bậc 2 & 3 — Bản Đồ Cân Bằng Ngũ Hành & Ma Trận Giao Tiếp cho 1 Ông Chủ + 1..8 thành viên tự nguyện đồng ý."""
    vi = ngon_ngu.la_viet()
    nam_hien = nam_xem
    ceo = _ho_so_co_ban(ong_chu["ngay"], ong_chu["thang"], ong_chu["nam"], ong_chu.get("gioi_tinh", "nam"), nam_hien)

    tong_hanh = {h: ceo["ty_le_ngu_hanh"][h] for h in HANH_5}
    chi_tiet_ns = []
    for ns_in in doi_ngu:
        ns_base = _ho_so_co_ban(ns_in["ngay"], ns_in["thang"], ns_in["nam"], ns_in.get("gioi_tinh", "nam"), nam_hien)
        for h in HANH_5:
            tong_hanh[h] += ns_base["ty_le_ngu_hanh"][h]
        chi_tiet_ns.append(phan_tich_nhan_su(ong_chu, ns_in, nam_hien))

    n_nguoi = 1 + len(doi_ngu)
    trung_binh = {h: round(tong_hanh[h] / n_nguoi, 3) for h in HANH_5}
    hanh_troi = max(HANH_5, key=lambda h: trung_binh[h])
    hanh_thieu = min(HANH_5, key=lambda h: trung_binh[h])

    vt_thieu = _VAI_TRO_HANH[hanh_thieu]["vi" if vi else "en"][0]
    vt_troi = _VAI_TRO_HANH[hanh_troi]["vi" if vi else "en"][0]

    if vi:
        can_bang = {
            "ty_le_5_hanh": trung_binh,
            "hanh_troi": hanh_troi,
            "hanh_thieu": hanh_thieu,
            "nhan_xet_diem_manh": f"Đội ngũ nổi trội hành {hanh_troi} — thế mạnh tự nhiên nằm ở trục: {vt_troi}.",
            "nhan_xet_lo_hong": f"Hành đang mỏng nhất của cả nhóm là {hanh_thieu} — nên chú ý củng cố bằng quy trình hoặc cộng sự ở mảng: {vt_thieu}.",
        }
        goi_y_quy_mo = {
            "kinh_doanh_nho": "Với mô hình 5–20 người: ưu tiên dùng nhân sự có mức 'Bù khuyết cao' giữ phần việc bạn ngại làm nhất (quy trình/tài chính hoặc bán hàng), và chốt rõ trách nhiệm bằng văn bản ngắn gọn.",
            "doanh_nghiep_lon": "Với doanh nghiệp 20–200+ người: dùng Bản Đồ 5 Hành để cân bằng ban điều hành C-level, bố trí người mạnh Thổ/Kim giữ kiểm soát rủi ro song hành cùng người mạnh Mộc/Hỏa dẫn tăng trưởng.",
        }
    else:
        can_bang = {
            "ty_le_5_hanh": trung_binh,
            "hanh_troi": hanh_troi,
            "hanh_thieu": hanh_thieu,
            "nhan_xet_diem_manh": f"Team leans toward {_HANH_EN[hanh_troi]} energy — natural edge in: {vt_troi}.",
            "nhan_xet_lo_hong": f"Lightest element across the group is {_HANH_EN[hanh_thieu]} — reinforce through process or advisory support in: {vt_thieu}.",
        }
        goi_y_quy_mo = {
            "kinh_doanh_nho": "For 5–20 person businesses: lean on high-complementarity partners for the operational lane you naturally neglect and document ownership early.",
            "doanh_nghiep_lon": "For 20–200+ organizations: use the 5-Element Balance Radar to pair growth-driven leaders with structured risk/process counterparts.",
        }

    cap_ma = cap_quan_ly if cap_quan_ly in _CAP_QUAN_LY else "chu_dn"
    cap_ten, cap_trong_tam, cap_hanh_dong = _CAP_QUAN_LY[cap_ma]["vi" if vi else "en"]
    goi_y_cap = {
        "ma": cap_ma,
        "ten": cap_ten,
        "trong_tam": cap_trong_tam,
        "hanh_dong": cap_hanh_dong,
    }

    return {
        "provenance": "bien_tap",
        "nam_xem": nam_hien,
        "cap_quan_ly": goi_y_cap,
        "ong_chu": {
            "ten": ong_chu.get("ten") or ("Ông chủ" if vi else "Owner"),
            "hanh_manh": ceo["hanh_manh"],
            "hanh_can_bu": ceo["hanh_yeu"],
            "duong_doi": ceo["duong_doi"],
            "nam_ca_nhan": ceo["nam_ca_nhan"],
        },
        "can_bang_ngu_hanh": can_bang,
        "ma_tran_phoi_hop": chi_tiet_ns,
        "goi_y_ghep_cap": _goi_y_ghep_cap(chi_tiet_ns, vi),
        "goi_y_quy_mo": goi_y_quy_mo,
        "ranh_gioi_phap_ly": _RANH_GIOI_VI if vi else _RANH_GIOI_EN,
    }
