# -*- coding: utf-8 -*-
"""MT-ĐS — chấm holdout 360 câu viết độc lập (fixtures/cau_hoi/holdout_mt_ds.jsonl) trên router hiện tại.
Chạy: python scripts/cham_holdout_mt_ds.py — in tỉ lệ xử lý đúng / đúng lĩnh vực từng module + câu sai."""
import json, sys, collections
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.hoidap import tuvi, battu, phongthuy
rows=[json.loads(l) for l in open(Path(__file__).resolve().parents[1] / "fixtures/cau_hoi/holdout_mt_ds.jsonl", encoding="utf-8")]
CUNG={"tai_chinh":{"Tài Bạch"},"su_nghiep":{"Quan Lộc"},"tinh_yeu":{"Phu Thê"},"con_cai":{"Tử Nữ"},"gia_dinh":{"Phụ Mẫu","Huynh Đệ"},
 "suc_khoe":{"Tật Ách"},"an_toan":{"Thiên Di","Tật Ách"},"phap_ly":{"Quan Lộc","Nô Bộc"},"hoc_tap":{"Quan Lộc"},"nha_o":{"Điền Trạch"},
 "quan_he":{"Nô Bộc"},"di_xa":{"Thiên Di"},"hau_van":{"Phúc Đức"},"ban_than":{"Mệnh"}}
CD={"tai_chinh":{"nghe_tien"},"su_nghiep":{"nghe_tien"},"tinh_yeu":{"hon_nhan"},"con_cai":{"gia_dinh","tru","con_cai"},"gia_dinh":{"gia_dinh","tru"},
 "suc_khoe":{"loi_song"},"ban_than":{"tinh_cach","ngu_hanh","thap_than","cach_cuc"},"phap_ly":{"phap_ly"},"di_xa":{"di_xa"},"an_toan":{"an_toan","loi_song"},
 "hoc_tap":{"hoc_hanh"},"quan_he":{"quan_he","than_sat"},"hau_van":{"hau_van"},"nha_o":{"nghe_tien"}}
st=collections.Counter(); miss=collections.defaultdict(list)
for r in rows:
    md=r["mo_dun"]; pl={"tuvi":lambda q:tuvi.phan_loai(q),"battu":battu.phan_loai,"phongthuy":phongthuy.phan_loai}[md](r["cau_hoi"])
    exp=r["xu_ly"]; got=pl["xu_ly"]
    if exp=="an_toan": ok = got=="an_toan"
    elif exp=="tu_choi_nhe": ok = got=="tu_choi_nhe"
    elif exp=="dan_huong": ok = got=="dan_huong"
    else: ok = got in ("tra_loi","tra_loi_kem_luu_y")
    lv_ok=None
    if ok and exp in("tra_loi","tra_loi_kem_luu_y"):
        if md=="tuvi" and r["linh_vuc"] in CUNG and pl["loai"] in("la_so","han"):
            lv_ok = bool(set(pl["cung"])&CUNG[r["linh_vuc"]]) or (pl["loai"]=="han" and not pl["cung"])
        if md=="battu" and r["linh_vuc"] in CD and pl["loai"] in("la_so","van"):
            lv_ok = pl["loai"]=="van" or pl["chu_de"] in CD[r["linh_vuc"]]
    st[(md,"xu_ly",ok)]+=1
    if lv_ok is not None: st[(md,"linh_vuc",lv_ok)]+=1
    if not ok: miss[(md,"xu_ly")].append((r["cau_hoi"],exp,got,pl["loai"]))
    elif lv_ok is False: miss[(md,"lv")].append((r["cau_hoi"],r["linh_vuc"],pl.get("cung") or pl.get("chu_de"),pl["loai"]))
for md in("tuvi","battu","phongthuy"):
    a,b=st[(md,"xu_ly",True)],st[(md,"xu_ly",False)]; c,d=st[(md,"linh_vuc",True)],st[(md,"linh_vuc",False)]
    print(f"{md}: xu_ly {a}/{a+b} ({100*a/(a+b):.0f}%) · lĩnh vực {c}/{c+d} ({100*c/max(1,c+d):.0f}%)")
for k,v in miss.items():
    print("==",k,len(v))
    for x in v[:40]: print("  ",x)
