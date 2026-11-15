# Dựng fixtures/nguon/phongthuy_co_thu.json từ bản số hoá Văn Uyên Các Tứ khố toàn thư (kanripo, nhánh WYG).
import re, glob, json, sys
SRC, OUT = sys.argv[1], sys.argv[2]
def load(kr, pat="*"):
    s = "".join(open(f, encoding="utf8").read() for f in sorted(glob.glob(f"{SRC}/{kr}/{kr}_{pat}.txt")))
    s = re.sub(r"<pb:[^>]*>|¶|#\+.*|\n|　", "", s)
    return s
SACH = {
 "tang_thu": ("KR3g0020", "葬書", "Táng Thư", "Quách Phác (Tấn) — bản chú giải trong Tứ khố"),
 "trach_kinh": ("KR3g0019", "宅經", "Trạch Kinh (Hoàng Đế Trạch Kinh)", "khuyết danh, khoảng đời Đường"),
 "thanh_nang_ao_ngu": ("KR3g0023", "青囊奧語", "Thanh Nang Áo Ngữ", "Dương Quân Tùng (Đường)"),
 "thanh_nang_tu": ("KR3g0022", "青囊序", "Thanh Nang Tự", "Tăng Văn Thiên (Đường)"),
 "thien_ngoc_kinh": ("KR3g0024", "天玉經", "Thiên Ngọc Kinh", "Dương Quân Tùng (Đường)"),
 "hiep_ky": ("KR3g0051", "欽定協紀辨方書", "Hiệp Kỷ Biện Phương Thư", "Doãn Lộc và các quan Khâm Thiên Giám (Thanh, 1739)"),
}
DOAN = {
 "tang_thu.sinh_khi": ("tang_thu", ["葬者乘生氣也"]),
 "tang_thu.phong_thuy": ("tang_thu", ["經曰氣乗風則㪚界水則止", "古人聚之使不散行之使有止故謂之風水"]),
 "tang_thu.dac_thuy": ("tang_thu", ["風水之法得水為上藏風次之"]),
 "tang_thu.tu_linh": ("tang_thu", ["夫葬以左為青龍右為白虎前為朱雀後為𤣥武", "𤣥武垂頭", "朱雀翔舞", "青龍蜿蜒", "白虎馴頫"]),
 "tang_thu.cam_ung": ("tang_thu", ["經曰氣感而應鬼福及人"]),
 "tang_thu.ngu_bat_tang": ("tang_thu", ["山之不可葬者五", "氣以生和而童山不可葬也", "氣因形來而斷山不可葬也", "氣因土行而石山不可葬也", "過山不可葬也", "氣以龍㑹而獨山不可葬也"]),
 "tang_thu.dat_dep": ("tang_thu", ["來積止聚沖陽和隂", "土高水深鬱草茂林"]),
 "trach_kinh.goc": ("trach_kinh", ["故宅者人之本人以宅為家居若安即家代昌吉若不安即門族衰微"]),
 "trach_kinh.ngu_hu_ngu_thuc": ("trach_kinh", ["宅有五虚令人貧耗五實令人富貴宅大人少一虚宅門大内小二虚牆院不完三虚井竈不處四虚宅地多屋少庭院廣五虚宅小人多一實宅大門小二實牆院完全三實宅小六畜多四實宅水溝東南流五實"]),
 "trach_kinh.than_the": ("trach_kinh", ["宅以形勢為身體以泉水為血脈以土地為皮肉以草木為毛髪以舍屋為衣服以門户為冠帶若得如斯是事儼雅乃為上吉"]),
 "trach_kinh.cham_sua": ("trach_kinh", ["其田雖良薅鋤乃芳其宅雖善修移乃昌"]),
 "trach_kinh.nguoi_va_nha": ("trach_kinh", ["地善即苗茂宅吉即人榮"]),
 "thanh_nang_ao_ngu.ai_tinh": ("thanh_nang_ao_ngu", ["坤壬乙巨門從頭出艮丙辛位位是破軍㢲辰亥盡是武曲位甲癸申貪狼一路行"]),
 "thanh_nang_ao_ngu.dien_dao": ("thanh_nang_ao_ngu", ["顛顛倒二十四山有珠寳逆順行二十四山有火坑"]),
 "thanh_nang_tu.long_than": ("thanh_nang_tu", ["山上龍神不下水水裏龍神不上山"]),
 "thanh_nang_tu.am_duong": ("thanh_nang_tu", ["山管山兮水管水此是隂陽不待言"]),
 "thien_ngoc_kinh.tam_ban": ("thien_ngoc_kinh", ["東西父母三般卦筭值千金價"]),
 "thien_ngoc_kinh.da_kiep": ("thien_ngoc_kinh", ["識得父母三般卦便是真神路北斗七星去打劫離宫要相合"]),
 "hiep_ky.hai_muoi_bon_son": ("hiep_ky", ["戌乾亥屬乾壬子癸屬坎丑艮寅屬艮甲卯乙屬震辰巽巳屬巽丙午丁屬離未坤申屬坤庚酉辛屬兌"]),
 "hiep_ky.dai_du_nien_thu_tu": ("hiep_ky", ["如乾為本宫乾上爻變為兌為貪狼兌中爻變為震為五鬼震下爻變為坤為武曲坤中爻變為坎為文曲坎上爻變為巽為禄存巽中爻變為艮為巨門艮下爻變為離為破軍離中爻變復為乾為輔弼"]),
 "hiep_ky.dai_du_nien_ten": ("hiep_ky", ["貪狼與小遊同亦曰生氣廉貞即小遊之巨門亦曰五鬼武曲即小遊之絶體又曰延年文曲與小遊同又曰六煞禄存即小遊之五鬼又曰禍害巨門即小遊之福徳亦曰天醫"]),
 "hiep_ky.dong_tay_tu_trach": ("hiep_ky", ["蓋陽宅之法以乾兌為老陽艮坤為老隂離震為少隂巽坎為少陽二老相配為西四宅二少相配為東四宅東西各自相配為吉交錯相配為凶"]),
 "hiep_ky.phien_quai": ("hiep_ky", ["翻卦之法皆以上一爻變為生氣貪狼下二爻變為天醫巨門三爻俱變為延年武曲三爻俱不變為伏位輔弼", "蓋上一爻變者則乾兌互變艮坤互變離震互變巽坎互變下二爻變者則乾艮互變兌坤互變離巽互變震坎互變三爻俱變者則乾坤互變兌艮互變離坎互變震巽互變三爻俱不變者則自得本宫"]),
 "hiep_ky.menh_cung_nam_nu": ("hiep_ky", ["男命上元甲子起坎一中元甲子起巽四下元甲子起兑七逆行九宫女命上元甲子起中五中元甲子起坤二下元甲子起艮八順行九宫"]),
 "hiep_ky.tu_bach_nam": ("hiep_ky", ["九星之法上元甲子一白入中宫乙丑九紫丙寅八白丁卯七赤戊辰六白己巳五黄庚午四緑辛未三碧壬申二黑癸酉復一白", "中元甲子四緑下元甲子七赤"]),
 "hiep_ky.tu_bach_thang": ("hiep_ky", ["故以子午卯酉年為上元正月起八白辰戌丑未年為中元正月起五黄寅申巳亥年為下元正月起二黑逐月逆轉"]),
 "hiep_ky.tam_sat": ("hiep_ky", ["如申子辰合水局水旺於北方南方其衝也故三煞在南方巳午未"]),
}
txt = {k: load(v[0]) for k, v in SACH.items()}
out = {"_nguon": {"kho": "Kanseki Repository (kanripo.org) — bản số hoá Văn Uyên Các Tứ khố toàn thư (WYG), tải qua github.com/kanripo/<mã>",
                  "ngay": "2026-11-12", "ghi_chu": "Giữ nguyên chữ của bản số hoá (kể cả chữ dị thể như 乗, 㪚, 𤣥, 隂); bỏ dấu xuống dòng và số trang. Mỗi 'cau' là một chuỗi liền trong sách; một đoạn có thể gồm nhiều câu không liền nhau (xen chú giải).",
                  "dung": "engine/scripts/nap_nguon_phongthuy.py"},
       "sach": {k: {"ma_kho": v[0], "ten_han": v[1], "ten": v[2], "tac_gia": v[3]} for k, v in SACH.items()}, "doan": {}}
for ma, (s, cau) in DOAN.items():
    for c in cau:
        assert c in txt[s], (ma, c)
    out["doan"][ma] = {"sach": s, "cau": cau}
json.dump(out, open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(out["doan"]), "đoạn")
