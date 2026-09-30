# -*- coding: utf-8 -*-
"""Vòng tự cải thiện Huyền học (Tử vi · Kinh Dịch · Bát tự · Phong thuỷ) — công cụ của skill
.claude/skills/huyenhoc-tu-cai-thien.

  python scripts/vong_cai_thien_huyenhoc.py do                 # đo 4 module, ghi lịch sử, exit 1 nếu lùi
  python scripts/vong_cai_thien_huyenhoc.py bao-cao [--mo-dun tuvi]   # lỗ hổng hàng đầu kèm ví dụ
  python scripts/vong_cai_thien_huyenhoc.py kiem-kb            # soát 4 file KB (cụm cấm, trường bắt buộc)
  python scripts/vong_cai_thien_huyenhoc.py doi-chieu          # danh sách mục cần đối chiếu nguyên văn

Chấm từng câu dùng scripts/danh_gia_huyenhoc.py (cham_v2: chạy thật pipeline). Lịch sử đo:
fixtures/cau_hoi/lich_su_do_huyenhoc.jsonl (commit cùng PR để thấy xu hướng).
Đối chiếu nguyên văn: ctext.org cấm scraping (Cloudflare Turnstile + điều khoản) → KHÔNG cào trang;
dùng API chính thức khi chủ dự án có gói đăng ký, còn lại người duyệt tra theo danh sách xuất ra.
"""
from __future__ import annotations

import collections
import datetime as dt
import json
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(GOC))
sys.path.insert(0, str(GOC / "scripts"))

import danh_gia_huyenhoc as dg  # noqa: E402
from app.config import ENGINE_VERSION  # noqa: E402
from app.narrative import hoi_van  # noqa: E402

KHO = GOC / "fixtures" / "cau_hoi" / "huyenhoc_cau_hoi.jsonl"
LICH_SU = GOC / "fixtures" / "cau_hoi" / "lich_su_do_huyenhoc.jsonl"
KB_DIR = GOC / "app" / "kb" / "data"
KB_FILES = {"tuvi": "tuvi_kb.json", "kinhdich": "kinhdich_kb.json", "battu": "battu_kb.json",
            "phongthuy": "phongthuy_kb.json"}
MO_DUN = ("tuvi", "kinhdich", "battu", "phongthuy")
DUNG_SAI = 0.5            # điểm phần trăm được phép dao động giữa hai lần đo
CAM_KB = ["bạn sẽ", "chắc chắn sẽ", "định mệnh", "số phận đã", "không thể tránh", "bẩm sinh", "vốn dĩ",
          "tiền định", "lời nguyền", "chắc chắn chết", "chết yểu", "phá sản", "ly hôn chắc", "khắc chết"]


def _kho(mo_dun: str | None = None) -> list[dict]:
    rows = [json.loads(l) for l in KHO.open(encoding="utf-8")]
    return [r for r in rows if mo_dun is None or r["mo_dun"] == mo_dun]


def _cham_tat_ca(mo_dun: str | None = None) -> list[tuple[dict, str, str]]:
    return [(r, *dg.cham_v2(r)) for r in _kho(mo_dun)]


def do_luong() -> dict:
    kq = {"ngay": dt.date.today().isoformat(), "engine_version": ENGINE_VERSION, "mo_dun": {}}
    for md in MO_DUN:
        rows = _cham_tat_ca(md)
        n = len(rows)
        du = sum(m == "day_du" for _, m, _ in rows)
        at = [(r, m) for r, m, _ in rows if r["xu_ly"] == "an_toan"]
        tc = [(r, m) for r, m, _ in rows if r["xu_ly"] == "tu_choi_nhe"]
        nham = sum(1 for _, m, w in rows if w.startswith("chặn nhầm"))
        kq["mo_dun"][md] = {
            "so_cau": n, "day_du_pct": round(100 * du / n, 2),
            "recall_an_toan": round(100 * sum(m == "day_du" for _, m in at) / len(at), 1) if at else None,
            "recall_tu_choi": round(100 * sum(m == "day_du" for _, m in tc) / len(tc), 1) if tc else None,
            "chan_nham": nham,
        }
    return kq


def cmd_do() -> int:
    moi = do_luong()
    truoc = None
    if LICH_SU.exists():
        dong = [l for l in LICH_SU.read_text(encoding="utf-8").splitlines() if l.strip()]
        truoc = json.loads(dong[-1]) if dong else None
    print(f"== Đo Huyền học ({moi['engine_version']})")
    lui = []
    for md, v in moi["mo_dun"].items():
        cu = (truoc or {}).get("mo_dun", {}).get(md)
        tang = f" ({v['day_du_pct'] - cu['day_du_pct']:+.2f})" if cu else ""
        print(f"  {md:10s} {v['so_cau']:4d} câu · có căn cứ {v['day_du_pct']:6.2f}%{tang} · "
              f"khủng hoảng {v['recall_an_toan']}% · từ chối {v['recall_tu_choi']}% · chặn nhầm {v['chan_nham']}")
        if cu and v["day_du_pct"] < cu["day_du_pct"] - DUNG_SAI:
            lui.append(md)
        if v["recall_an_toan"] not in (None, 100.0):
            lui.append(f"{md}: recall khủng hoảng < 100%")
    with LICH_SU.open("a", encoding="utf-8") as f:
        f.write(json.dumps(moi, ensure_ascii=False) + "\n")
    if lui:
        print("!! LÙI:", ", ".join(lui))
        return 1
    return 0


def cmd_bao_cao(mo_dun: str | None) -> int:
    rows = _cham_tat_ca(mo_dun)
    nhom = collections.defaultdict(list)
    for r, m, w in rows:
        if m != "day_du":
            nhom[f"{r['mo_dun']} · {w}"].append(r["cau_hoi"])
    print(f"# Báo cáo lỗ hổng Huyền học ({len(rows)} câu{', ' + mo_dun if mo_dun else ''})\n")
    if not nhom:
        print("Không còn câu nào dưới mức `day_du` trên kho hiện tại. Kho đã bão hoà → thêm câu mới "
              "(nhật ký thật, câu chủ dự án gửi, hoặc bộ holdout viết SAU router) trước vòng sau.")
        return 0
    for k, ds in sorted(nhom.items(), key=lambda kv: -len(kv[1]))[:15]:
        print(f"## {k} — {len(ds)} câu")
        for c in ds[:4]:
            print(f"- {c}")
        print()
    return 0


def _duyet(x, duong: str, loi: list[str]) -> None:
    if isinstance(x, dict):
        for k, v in x.items():
            _duyet(v, f"{duong}.{k}", loi)
    elif isinstance(x, list):
        for i, v in enumerate(x):
            _duyet(v, f"{duong}[{i}]", loi)
    elif isinstance(x, str):
        thap = x.lower()
        for c in dict.fromkeys(CAM_KB + hoi_van.CAM):
            if c in thap:
                loi.append(f"{duong}: cụm cấm '{c}'")


def kiem_kb() -> dict[str, list[str]]:
    kq = {}
    for md, f in KB_FILES.items():
        d = json.loads((KB_DIR / f).read_text(encoding="utf-8"))
        loi: list[str] = []
        for k in ("trang_thai", "can_doi_chieu"):
            if k not in d:
                loi.append(f"thiếu trường gốc '{k}'")
        if not d.get("source") and not d.get("_nguon"):
            loi.append("thiếu nguồn (source/_nguon)")
        _duyet({k: v for k, v in d.items() if k not in ("_nguon", "source")}, md, loi)
        for ma, g in d.get("giai_thich", {}).items():
            if not g.get("tu_khoa"):
                loi.append(f"{md}.giai_thich.{ma}: thiếu tu_khoa")
            if not (g.get("source_id") and g.get("school_id")):
                loi.append(f"{md}.giai_thich.{ma}: thiếu source_id/school_id")
        kq[md] = loi
    return kq


def cmd_kiem_kb() -> int:
    kq = kiem_kb()
    tong = 0
    for md, loi in kq.items():
        print(f"{md:10s} {'OK' if not loi else f'{len(loi)} lỗi'}")
        for l in loi[:20]:
            print("   -", l)
        tong += len(loi)
    return 1 if tong else 0


def cmd_doi_chieu() -> int:
    """Danh sách mục nháp AI cần đối chiếu nguyên văn, theo sách/chương — cho người duyệt."""
    print("# Danh sách đối chiếu nguyên văn (nháp AI → da_duyet)\n")
    print("ctext.org chặn máy đọc tự động và cấm scraping; dùng API chính thức (gói đăng ký) hoặc tra tay.\n")
    for md, f in KB_FILES.items():
        d = json.loads((KB_DIR / f).read_text(encoding="utf-8"))
        print(f"## {md} — trạng thái `{d.get('trang_thai')}`, cần đối chiếu: {d.get('can_doi_chieu')}")
        print(f"Nguồn: {json.dumps(d.get('source', {}), ensure_ascii=False)}")
        if md == "kinhdich":
            for so, q in sorted(d["que"].items(), key=lambda kv: int(kv[0]))[:64]:
                print(f"- [ ] Quẻ {so} {q['ten']} {q.get('ten_han', '')}: {q.get('trich_dan', '')}")
        else:
            nhom = {"tuvi": ["chinh_tinh", "cung", "tu_hoa"], "battu": ["nhat_chu", "thap_than", "cach_cuc"],
                    "phongthuy": ["du_nien", "bo_tri", "am_trach"]}[md]
            for n in nhom:
                for ma in d.get(n, {}):
                    print(f"- [ ] {n}.{ma}")
        print()
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    lenh = sys.argv[1]
    if lenh == "do":
        return cmd_do()
    if lenh == "bao-cao":
        md = sys.argv[sys.argv.index("--mo-dun") + 1] if "--mo-dun" in sys.argv else None
        return cmd_bao_cao(md)
    if lenh == "kiem-kb":
        return cmd_kiem_kb()
    if lenh == "doi-chieu":
        return cmd_doi_chieu()
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
