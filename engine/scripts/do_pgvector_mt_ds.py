"""B5 — pgvector có lợi thật không? Bỏ-một-câu trên kho Tử vi có nhãn 8 ý định (chu_de = yd_*): với câu mà luật từ khoá
KHÔNG nhận ra, láng giềng gần nhất (cos bam512_v1 ≥ ngưỡng) trong phần kho còn lại có đoán đúng ý định không?"""
import sys, os, json, collections
GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, GOC); os.chdir(GOC)
from app import nhung
from app.hoidap import tuvi
from app.nhat_ky import loc_cau_hoi_huyenhoc
rows=[json.loads(l) for l in open("fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl",encoding="utf-8")]
kho=[(r["cau_hoi"], r["chu_de"][3:]) for r in rows if r["mo_dun"]=="tuvi" and r["chu_de"].startswith("yd_")]
hold=[json.loads(l) for l in open("fixtures/cau_hoi/holdout_mt_ds.jsonl",encoding="utf-8")]
print("kho ý định:", len(kho), collections.Counter(y for _,y in kho))
vec=[(nhung.nhung(loc_cau_hoi_huyenhoc(c)[0] if isinstance(loc_cau_hoi_huyenhoc(c), tuple) else loc_cau_hoi_huyenhoc(c)), y, c) for c,y in kho]
def nn(v, loai_tru=None):
    best=(-1,None,None)
    for i,(w,y,c) in enumerate(vec):
        if i==loai_tru: continue
        s=nhung.cos(v,w)
        if s>best[0]: best=(s,y,c)
    return best
for nguong in (0.82, 0.7, 0.6):
    khong_nhan=dung=sai=bo=0
    for i,(c,y) in enumerate(kho):
        pl=tuvi.phan_loai(c)
        if pl["y_dinh"]: continue
        khong_nhan+=1
        s,y2,_=nn(vec[i][0], i)
        if s>=nguong:
            if y2==y: dung+=1
            else: sai+=1
        else: bo+=1
    print(f"ngưỡng {nguong}: luật không nhận ra {khong_nhan}/{len(kho)} → vectơ đoán đúng {dung}, sai {sai}, không gợi ý {bo}")
# holdout: câu Tử vi không nhận ra ý định → gợi ý gì (chỉ xem phân bố, không có nhãn 8 mã)
n=0; goi=collections.Counter()
for r in hold:
    if r["mo_dun"]!="tuvi": continue
    pl=tuvi.phan_loai(r["cau_hoi"])
    if pl.get("co_the_goi_y"):
        n+=1; s,y2,c2=nn(nhung.nhung(r["cau_hoi"]))
        if s>=0.6: goi[y2]+=1
print("holdout tuvi co_the_goi_y:", n, "gợi ý ≥0.6:", sum(goi.values()), dict(goi))
