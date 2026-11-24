"use client";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ClipboardPaste, Compass, CornerLeftUp, ExternalLink, Hand, LocateFixed, MapPin, Navigation, Smartphone, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { CachLam } from "@/components/huyen-hoc/CachLam";
import { ChonTrenVeTinh } from "@/components/huyen-hoc/ChonTrenVeTinh";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { tenTheo } from "@/lib/ten-hien";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { taiSon24, type MucSon24 } from "@/lib/la-ban-24-son";
import { doHienThi, nhomSoMau } from "@/lib/la-kinh/hop-nhat";
import { useLaBanCamBien, type LanDo } from "@/lib/la-kinh/use-la-ban-cam-bien";
import { MatLaBan, oHuong, type LaBanCaNhan } from "@/lib/la-kinh/mat-la-ban";
import { PhieuDo, chotDuoc, type KetQuaDoHuong, type KetQuaMau } from "@/lib/la-kinh/phieu-do";
import { layQuayLai, ngheQuayLai, veCauTraLoi } from "@/lib/quay-lai-hoi-gi";
import { appNhung } from "@/lib/trinh-duyet-nhung";

// PT-V1 / LK-1 — đo hướng nhà bằng la bàn điện thoại. Web CHỈ đọc cảm biến và gửi MẪU THÔ của lần "giữ yên 1,5 giây"
// (hoặc số độ người dùng tự nhập / kéo); engine tính số độ, độ rung, so hai lần đo, rồi đổi ra hướng, sơn, toạ, trạch,
// du niên. Cảm biến chỉ chạy trong lúc ngắm / đo. Luôn có ô nhập tay, mặt la bàn kéo được và cách lấy hướng từ bản đồ.

export { MatLaBan, oHuong };
export type { KetQuaDoHuong, LaBanCaNhan };

/** Q3: đọc "vĩ độ, kinh độ" từ chuỗi dán vào — số thuần "10.776, 106.700" hoặc link bản đồ (@lat,lon · q=lat,lon · !3dlat!4dlon). */
export function docToaDo(s: string): [number, number] | null {
  const t = decodeURIComponent(s.trim());
  const mau = [/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|center)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/];
  for (const m of mau) {
    const k = m.exec(t);
    if (k) {
      const la = Number(k[1]), lo = Number(k[2]);
      if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return [la, lo];
    }
  }
  return null;
}

const TEN_APP = { facebook: "Facebook", instagram: "Instagram", zalo: "Zalo" } as const;
const khongAi = () => null;

export function DoHuongDienThoai({ sinh, onDungToa, onChot, laBan, luuNha = true }: {
  sinh: { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
  onDungToa?: (doToa: number) => void;
  /** PT-V0: báo kết quả engine vừa đổi (độ hướng nhà, hướng, độ toạ) cho trang / khung Khảo sát nhà. */
  onChot?: (kq: KetQuaDoHuong) => void;
  /** UI-PT 1: có mệnh quái → mặt la bàn tô 8 cung + đọc du niên của hướng đang quay về theo thời gian thực. */
  laBan?: LaBanCaNhan | null;
  /** DC-MB: đo hướng MẶT BẰNG kinh doanh (không phải nhà ở) → không ghi đè hồ sơ nhà trên máy. Mặc định lưu như cũ. */
  luuNha?: boolean;
}) {
  const { c: t, en, huong, quai, nhom, duNien } = useChuPT();
  const cam = useLaBanCamBien();
  const [son24, setSon24] = useState<MucSon24[] | null>(null);
  useEffect(() => {
    let huy = false;
    taiSon24().then((ds) => { if (!huy && ds) setSon24(ds); });
    return () => { huy = true; };
  }, []);
  // Hai việc cùng một la bàn: đo hướng NHÀ (đo → engine → chốt → hồ sơ nhà) · tìm hướng TỐT để kê bàn, đầu giường (chỉ đọc sống, không lưu).
  const [cheDo, setCheDo] = useState<"nha" | "ke_do">("nha");
  // UI-PT2 A: loại nhà (hồ sơ nhà trên máy) → căn hộ đo ở ban công / bản đồ, lưu `theo: ban_cong`.
  const nhaLuu = useHoSoNha();
  const canHo = nhaLuu?.loai_nha === "can_ho";
  /** Số độ người dùng tự đặt (gõ, kéo mặt la bàn) hoặc số engine vừa trả — để vẽ mặt la bàn khi cảm biến nghỉ. */
  const [doTay, setDoTay] = useState<number | null>(null);
  /** Kim đứng tại chỗ trong lúc chờ engine tính lần đo vừa thu. */
  const [doGiu, setDoGiu] = useState<number | null>(null);
  const [nhap, setNhap] = useState("");
  const [kq, setKq] = useState<KetQuaDoHuong | null>(null);
  /** Kết quả engine của lần đo vừa rồi, CHƯA chốt. */
  const [phieu, setPhieu] = useState<KetQuaMau | null>(null);
  const [buoc, setBuoc] = useState<1 | 2>(1);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  // Mẫu thô của lần đo 1 (chờ ghép với lần 2). Chỉ nằm trong bộ nhớ của khối này: không lưu, không gửi đo lường.
  const lan1 = useRef<LanDo | null>(null);
  const buocRef = useRef<1 | 2>(1);
  const luot = useRef(0);
  const conSong = useRef(true);
  useEffect(() => { conSong.current = true; return () => { conSong.current = false; }; }, []);
  const neoVe = useSyncExternalStore(ngheQuayLai, layQuayLai, khongAi);
  // Máy tính (chuột) → hướng dẫn "chuột phải" thay cho "nhấn giữ". Trình duyệt nhúng trong app → la bàn hay bị chặn.
  const [mayTinh, setMayTinh] = useState(false);
  const [app, setApp] = useState<keyof typeof TEN_APP | null>(null);
  useEffect(() => {
    try { setMayTinh(window.matchMedia("(pointer: fine)").matches); } catch { /* bỏ qua */ }
    try { setApp(appNhung(navigator.userAgent)); } catch { /* bỏ qua */ }
  }, []);

  const dangNgam = cam.pha !== "nghi";
  const doHien = dangNgam ? cam.doSong : dang && doGiu != null ? doGiu : doTay;
  const hSong = doHien == null ? null : oHuong(doHien);
  const dnSong = hSong && laBan ? laBan.bang[hSong] ?? null : null;
  const ySong = dnSong && laBan?.duNienY ? laBan.duNienY[dnSong] ?? null : null;
  const loiCam = cam.loi == null ? null
    : cam.loi === "khong_la_ban" ? t("dh.loi_khong_la_ban")
    : cam.loi === "quyen" ? t("dh.loi_quyen")
    : cam.loi === "xin_quyen" ? t("dh.loi_xin_quyen")
    : app ? t("dh.loi_app_nhung", { app: TEN_APP[app] }) : t("dh.loi_khong_tra");

  /** Bỏ lần đo dở / phiếu chưa chốt (người dùng đổi cách nhập, đổi chế độ, đo lại từ đầu). */
  const boPhieu = () => { luot.current += 1; lan1.current = null; buocRef.current = 1; setBuoc(1); setPhieu(null); setDoGiu(null); };
  const dungCamBien = () => {
    luot.current += 1;
    if (cheDo === "ke_do" && cam.doSong != null) setDoTay(cam.doSong);   // giữ hướng đang đọc để xem tiếp nhãn du niên
    cam.dung();
  };

  /** Kết quả engine đã được chấp nhận → hiện, báo trang, lưu hồ sơ nhà trên máy. */
  const apDung = (r: KetQuaDoHuong) => {
    setKq(r); setDoTay(doHienThi(r.do_huong)); setLoi(null);
    onChot?.(r);
    if (luuNha) try { luuHoSoNha({ huong_do: r.do_huong, huong: undefined, ...(canHo ? { theo: "ban_cong" } : {}) }); } catch { /* bỏ qua */ }   // KC-2
  };

  // ------------------------------------------------------------------ la bàn điện thoại
  const ngam = (lan: 1 | 2) => {
    setLoi(null);
    if (lan === 1) boPhieu(); else { buocRef.current = 2; setBuoc(2); }
    void cam.batDau();
  };
  const giuVaDo = async () => {
    const g = ++luot.current;
    const dangThay = cam.doSong;
    const k = await cam.giuYen();
    if (!k || g !== luot.current || !conSong.current) return;
    if (k.loai !== "ok") { setLoi(k.loai === "nghieng" ? t("dh.loi_nghieng_do") : app ? t("dh.loi_app_nhung", { app: TEN_APP[app] }) : t("dh.loi_khong_tra")); return; }
    const hai = buocRef.current === 2 && lan1.current != null;
    const a = hai ? lan1.current! : k.lan;
    const than = {
      mau: a.mau, ...(a.sai_so === undefined ? {} : { sai_so: a.sai_so }),
      ...(hai ? { mau_2: k.lan.mau, ...(k.lan.sai_so === undefined ? {} : { sai_so_2: k.lan.sai_so }) } : {}),
      ...(sinh ? { sinh } : {}),
    };
    setDoGiu(dangThay); setDang(true); setLoi(null);
    try {
      const r = await postJson<KetQuaMau>("/api/phongthuy/do-huong", than);
      if (g !== luot.current || !conSong.current) return;
      if (!hai) lan1.current = k.lan;
      setPhieu(r); setDoTay(doHienThi(r.do_huong)); setNhap("");
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "do_giu_yen", on_dinh: r.do.can_hieu_chinh ? "hieu_chinh" : r.do.on_dinh, so_mau_nhom: nhomSoMau(k.lan.mau.length) });
      if (r.hai_lan) ghi("chart_interacted", { mo_dun: "phongthuy", kind: "do_hai_lan", nhieu: r.hai_lan.nhieu ? 1 : 0 });
    } catch (e) {
      if (g === luot.current && conSong.current) setLoi(e instanceof Error ? e.message : t("dh.loi_do"));
    } finally {
      if (conSong.current) { setDang(false); setDoGiu(null); }
    }
  };
  const chotPhieu = () => {
    if (!phieu || !chotDuoc(phieu)) return;
    const r = phieu;
    cam.dung(); boPhieu();
    apDung(r);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "la_ban_dien_thoai", hai_lan: r.hai_lan ? 1 : 0 });
  };

  // ------------------------------------------------------------------ nhập tay / kéo mặt la bàn
  const chot = async (doHuong: number) => {
    cam.dung(); boPhieu();
    const g = luot.current;
    setDang(true); setLoi(null);
    try {
      const r = await postJson<KetQuaDoHuong>("/api/phongthuy/do-huong", { do_huong: doHuong, ...(sinh ? { sinh } : {}) });
      if (g !== luot.current || !conSong.current) return;
      apDung(r);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nhap_do_huong" });
    } catch (e) {
      if (conSong.current) setLoi(e instanceof Error ? e.message : t("dh.loi_doi"));
    } finally {
      if (conSong.current) setDang(false);
    }
  };
  const chotNhap = () => {
    const d = Number(nhap.replace(",", "."));
    if (!(nhap.trim() !== "" && d >= 0 && d < 360)) { setLoi(t("dh.loi_nhap")); return; }
    if (cheDo === "ke_do") {
      cam.dung(); setDoTay(d); setLoi(null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "la_ban_ke_do", nhap_tay: true });
      return;
    }
    void chot(d);
  };
  const doiCheDo = (m: "nha" | "ke_do") => {
    if (m === cheDo) return;
    cam.dung(); boPhieu(); setLoi(null); setCheDo(m);
    if (m === "ke_do") ghi("chart_interacted", { mo_dun: "phongthuy", kind: "la_ban_ke_do" });
  };

  // ------------------------------------------------------------------ hướng từ hai điểm bản đồ (Q3, UI-PT2 B, DH-PC)
  // Tâm nhà → điểm trước mặt nhà: cho căn hộ / chỗ la bàn nhiễu. Toạ độ chỉ dùng tính góc, không lưu.
  const [moBanDo, setMoBanDo] = useState(false);
  const [tam, setTam] = useState("");
  const [truoc, setTruoc] = useState("");
  const [kcBanDo, setKcBanDo] = useState<number | null>(null);
  const [dangDinhVi, setDangDinhVi] = useState<"tam" | "truoc" | null>(null);
  const [doChinhXac, setDoChinhXac] = useState<number | null>(null);
  // Sai số của từng điểm lấy bằng định vị (null = gõ / dán tay). Máy tính không có GPS: trình duyệt đoán theo wifi / IP,
  // sai số hàng chục – hàng trăm mét → hai điểm trong một căn nhà không tính được hướng.
  const [saiSo, setSaiSo] = useState<{ tam: number | null; truoc: number | null }>({ tam: null, truoc: null });
  const banDoRef = useRef<HTMLDivElement>(null);
  const dinhVi = (o: "tam" | "truoc") => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setLoi(t("dh.loi_dinh_vi_khong")); return; }
    setDangDinhVi(o); setLoi(null);
    navigator.geolocation.getCurrentPosition((pos) => {
      if (!conSong.current) return;
      const v = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
      (o === "tam" ? setTam : setTruoc)(v);
      setDoChinhXac(Math.round(pos.coords.accuracy));
      setSaiSo((s) => ({ ...s, [o]: Math.round(pos.coords.accuracy) }));
      setDangDinhVi(null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "dinh_vi_gps", diem: o, chinh_xac_m: Math.round(pos.coords.accuracy) });
    }, () => { if (conSong.current) { setDangDinhVi(null); setLoi(t("dh.loi_dinh_vi")); } },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
  };
  /** Dán toạ độ vừa chép (Google Maps trên máy tính: chuột phải → bấm dòng số đầu tiên là đã chép). */
  const dan = async (o: "tam" | "truoc") => {
    try {
      const chep = (await navigator.clipboard.readText()).slice(0, 300);
      if (!conSong.current) return;
      if (!docToaDo(chep)) { setLoi(t("dh.loi_dan_khong")); return; }
      (o === "tam" ? setTam : setTruoc)(chep); setSaiSo((s) => ({ ...s, [o]: null })); setLoi(null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "ban_do_dan", diem: o });
    } catch { if (conSong.current) setLoi(t("dh.loi_dan")); }
  };
  /** Mở Google Maps ảnh vệ tinh ở tab mới, căn giữa vị trí gần đúng của máy (nếu bạn cho phép) để tìm mái nhà nhanh.
   *  Tab mở ngay trong cú bấm (không bị chặn cửa sổ bật lên), vị trí đến sau thì đổi địa chỉ tab. Không lưu vị trí. */
  const moBanDoVeTinh = () => {
    const daCo = docToaDo(tam) ?? docToaDo(truoc);
    const url = (p: [number, number] | null) => p
      ? `https://www.google.com/maps/@${p[0].toFixed(6)},${p[1].toFixed(6)},20z/data=!3m1!1e3`
      : "https://www.google.com/maps/@16.0,106.5,6z/data=!3m1!1e3";
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "mo_ban_do_ve_tinh", co_vi_tri: !!daCo });
    if (daCo || typeof navigator === "undefined" || !navigator.geolocation) { window.open(url(daCo), "_blank", "noopener"); return; }
    const w = window.open("about:blank", "_blank");
    if (w) w.opener = null;
    const di = (p: [number, number] | null) => { if (w && !w.closed) w.location.href = url(p); else window.open(url(p), "_blank", "noopener"); };
    navigator.geolocation.getCurrentPosition((pos) => di([pos.coords.latitude, pos.coords.longitude]), () => di(null),
      { enableHighAccuracy: false, timeout: 6_000, maximumAge: 600_000 });
  };
  /** Kết quả engine từ hai điểm (dán toạ độ hoặc chấm trên ảnh vệ tinh). */
  const apDungBanDo = (r: KetQuaDoHuong & { khoang_cach_m: number }) => {
    cam.dung(); boPhieu();
    setKcBanDo(r.khoang_cach_m);
    apDung(r);
  };
  const chotBanDo = async () => {
    const a = docToaDo(tam), b = docToaDo(truoc);
    if (!a || !b) { setLoi(t("dh.loi_hai_diem")); return; }
    setDang(true); setLoi(null);
    try {
      const r = await postJson<KetQuaDoHuong & { khoang_cach_m: number }>("/api/phongthuy/huong-ban-do", { tam: a, truoc: b, ...(sinh ? { sinh } : {}) });
      if (!conSong.current) return;
      // Điểm lấy bằng định vị có sai số ≥ nửa khoảng cách hai điểm → góc tính ra gần như ngẫu nhiên: không chốt, không lưu.
      const ss = Math.max(saiSo.tam ?? 0, saiSo.truoc ?? 0);
      if (ss > 0 && r.khoang_cach_m < 2 * ss) {
        setKcBanDo(r.khoang_cach_m);
        setLoi(t("dh.loi_sai_so", { ss: String(ss), kc: String(r.khoang_cach_m) })
          + (mayTinh ? t("dh.loi_sai_so_may_tinh") : t("dh.loi_sai_so_dt")));
        ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huong_ban_do_sai_so", sai_so_m: ss });
        return;
      }
      apDungBanDo(r);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huong_ban_do" });
    } catch (e) { if (conSong.current) setLoi(e instanceof Error ? e.message : t("dh.loi_hai_diem_tinh")); }
    finally { if (conSong.current) setDang(false); }
  };
  /** Hai lần đo vênh nhau → mở sẵn cách lấy hướng từ bản đồ và đưa nó vào tầm mắt. */
  const sangBanDo = () => {
    setMoBanDo(true);
    const giam = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => banDoRef.current?.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "nearest" }));
  };

  const tn = tenTheo(kq?.ten_hien, en);
  const loiHien = loi ?? loiCam;
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="do-huong" data-testid="do-huong" data-pha={cam.pha}>
      <h2 id="do-huong" className="flex items-center gap-2 text-xl"><Navigation className="size-5 text-gold" aria-hidden /> {cheDo === "nha" ? t("dh.tieu_de_nha") : t("dh.tieu_de_ke")}</h2>
      {laBan && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t("dh.dung_de")}>
          {([["nha", t("dh.che_do_nha")], ["ke_do", t("dh.che_do_ke")]] as const).map(([m, nhan]) => (
            <button key={m} type="button" aria-pressed={cheDo === m} data-testid={`la-ban-che-do-${m}`} onClick={() => doiCheDo(m)}
              className={cn("min-h-9 rounded-full border px-3 py-1 text-xs", cheDo === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{nhan}</button>
          ))}
        </div>
      )}
      <p className="mt-1 text-sm text-fg-muted">
        <ChuB chu={t(cheDo === "ke_do" ? "dh.hd_ke" : canHo ? "dh.hd_can_ho" : "dh.hd_nha")} lop="text-fg" />
      </p>

      {cheDo === "nha" && <CachLam viec={canHo ? "do_huong_can_ho" : "do_huong"} className="mt-2" />}

      <div className="mt-4 grid items-start gap-4 sm:grid-cols-[auto_1fr]">
        <div className="min-w-0">
          <MatLaBan doHuong={doHien} laBan={laBan} son24={son24} tienDo={cam.pha === "giu" ? cam.tienDo : null}
            onXoay={dangNgam || dang ? undefined : (d) => { boPhieu(); setDoTay(d); setNhap(String(d)); setLoi(null); }} />
          <p className="mt-1 text-center font-serif text-2xl text-gold" data-testid="la-ban-do-so">
            {doHien == null ? "—" : t("dh.do_so", { do: String(doHienThi(doHien)), huong: huong(oHuong(doHien)) })}
          </p>
          {!dangNgam && !dang && (
            <p className="mx-auto max-w-[15rem] text-center text-[11px] text-fg-faint" data-testid="la-ban-keo-goi-y">
              {doHien == null ? t("dh.biet_huong") : ""}{t("dh.keo_goi_y")}
            </p>
          )}
          {laBan && (
            <p className="mt-1 text-center text-[11px] text-fg-faint">
              <span className="mr-1 inline-block size-2 rounded-sm bg-jade/40 align-middle" />{t("dh.chu_tot", { quai: quai(laBan.quai) })}
              <span className="ml-2 mr-1 inline-block size-2 rounded-sm border border-line bg-fg-faint/10 align-middle" />{t("dh.chu_xau")}
            </p>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          {laBan && hSong && (
            <p className="rounded-xl border border-line/70 bg-bg/40 px-3 py-2 text-sm" data-testid="la-ban-song" aria-live={dangNgam ? "off" : "polite"}>
              {t("dh.dang_quay")}<b className="text-fg">{huong(hSong)}</b>
              {dnSong && <> · <b className={cn(laBan.huongCat.includes(hSong) ? "text-jade" : "text-moon")}>{duNien(dnSong)}</b>
                <span className="text-fg-muted"> ({laBan.huongCat.includes(hSong) ? t("dh.tot_voi_ban") : t("dh.xau_voi_ban")}{t("dh.voi_ban")}</span></>}
              {ySong && <span className="block text-xs text-fg-muted">{ySong.y_nghia}{t("dh.hop_dat", { x: ySong.dung_cho })}</span>}
            </p>
          )}

          {dangNgam ? (
            <div className="space-y-2" data-testid="la-ban-dang-ngam">
              <p className={cn("text-sm", cam.nghieng ? "text-moon" : "text-fg-muted")} role="status">
                {cam.nghieng ? t("dh.nghieng")
                  : cam.pha === "giu" ? t("dh.dang_giu")
                  : cheDo === "ke_do" ? t("dh.ke_dung")
                  : buoc === 2 ? t("dh.lan_2_hd") : t("dh.ngam_hd")}
              </p>
              <div className="flex flex-wrap gap-2">
                {cheDo === "nha" && (
                  <Button onClick={() => void giuVaDo()} disabled={cam.pha === "giu" || cam.nghieng || cam.doSong == null} data-testid="la-ban-giu-yen">
                    <Hand aria-hidden /> {t("dh.nut_giu_yen")}
                  </Button>
                )}
                <Button variant="secondary" onClick={dungCamBien} data-testid="la-ban-dung"><Square aria-hidden /> {t("dh.nut_dung")}</Button>
              </div>
            </div>
          ) : dang && doGiu != null ? (
            <p className="text-sm text-fg-muted" role="status">{t("dh.dang_tinh")}</p>
          ) : phieu && cheDo === "nha" ? (
            <PhieuDo r={phieu} dang={dang} onChot={chotPhieu} onDoLai={() => ngam(1)}
              onDoLan2={phieu.hai_lan ? undefined : () => ngam(2)} onMoBanDo={sangBanDo} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => ngam(1)} variant="secondary" data-testid="la-ban-bat-dau"><Smartphone aria-hidden /> {t("dh.nut_do")}</Button>
              {cheDo === "nha" && doTay != null && (
                <Button onClick={() => void chot(doTay)} disabled={dang} data-testid="chot-la-ban-keo">
                  <Compass aria-hidden /> {dang ? t("dh.dang_doi") : t("dh.chot_do", { do: String(doHienThi(doTay)), huong: huong(oHuong(doTay)) })}
                </Button>
              )}
            </div>
          )}

          {cheDo === "nha" && (
            <ChonTrenVeTinh sinh={sinh} onDung={(r, a, b) => {
              apDungBanDo(r);
              setTam(`${a[0]}, ${a[1]}`); setTruoc(`${b[0]}, ${b[1]}`); setSaiSo({ tam: null, truoc: null });
            }} />
          )}
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); chotNhap(); }}>
            <Input aria-label={cheDo === "nha" ? t("dh.nhap_nha_aria") : t("dh.nhap_do_aria")} inputMode="decimal" placeholder={t("dh.nhap_vi_du")} value={nhap} className="w-44 max-w-full"
              onChange={(e) => setNhap(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
            <Button type="submit" size="sm" variant="ghost" disabled={dang}>{t("dh.xem")}</Button>
          </form>
          <div data-testid="huong-ban-do" ref={banDoRef}>
            <button type="button" aria-expanded={moBanDo} onClick={() => setMoBanDo((v) => !v)} className="inline-flex min-h-9 items-center gap-1 text-left text-xs text-fg-muted underline-offset-4 hover:underline">
              <MapPin className="size-3.5 shrink-0" aria-hidden /> {canHo ? t("dh.ban_do_can_ho") : mayTinh ? t("dh.ban_do_may_tinh") : t("dh.ban_do_dt")}
            </button>
            {moBanDo && (
              <form className="mt-2 space-y-2 rounded-xl border border-line/70 bg-bg/30 p-3" onSubmit={(e) => { e.preventDefault(); void chotBanDo(); }}>
                <p className="text-xs text-fg-muted">
                  <ChuB chu={t(mayTinh ? "dh.bd_hd_may_tinh" : "dh.bd_hd_dt")} lop="text-fg" />
                  {t("dh.bd_khong_luu")}</p>
                <Button type="button" size="sm" variant="secondary" onClick={moBanDoVeTinh} data-testid="mo-ban-do-ve-tinh">
                  <ExternalLink aria-hidden /> {t("dh.mo_gmaps")}
                </Button>
                <CachLam viec={mayTinh ? "ban_do_may_tinh" : "ban_do"} />
                <div className="flex gap-1.5">
                  <Input aria-label={t("dh.tam_aria")} placeholder={t("dh.tam_vi_du")} value={tam} className="min-w-0" onChange={(e) => { setTam(e.target.value.slice(0, 300)); setSaiSo((s) => ({ ...s, tam: null })); }} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => void dan("tam")} aria-label={t("dh.dan_tam")} title={t("dh.dan_title")}><ClipboardPaste aria-hidden /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => dinhVi("tam")} disabled={dangDinhVi != null} aria-label={t("dh.vi_tri_tam")} title={t("dh.vi_tri_tam_title")}><LocateFixed aria-hidden className={cn(dangDinhVi === "tam" && "animate-pulse")} /></Button>
                </div>
                <div className="flex gap-1.5">
                  <Input aria-label={t("dh.truoc_aria")} placeholder={t("dh.truoc_vi_du")} value={truoc} className="min-w-0" onChange={(e) => { setTruoc(e.target.value.slice(0, 300)); setSaiSo((s) => ({ ...s, truoc: null })); }} />
                  <Button type="button" size="sm" variant="ghost" onClick={() => void dan("truoc")} aria-label={t("dh.dan_truoc")} title={t("dh.dan_title")}><ClipboardPaste aria-hidden /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => dinhVi("truoc")} disabled={dangDinhVi != null} aria-label={t("dh.vi_tri_truoc")} title={t("dh.vi_tri_truoc_title")}><LocateFixed aria-hidden className={cn(dangDinhVi === "truoc" && "animate-pulse")} /></Button>
                </div>
                {doChinhXac != null && <p className="text-xs text-fg-faint" data-testid="gps-chinh-xac">{t("dh.gps", { m: String(doChinhXac) })}{doChinhXac > 15 ? t("dh.gps_lech") : t("dh.gps_cham")}</p>}
                <Button type="submit" size="sm" variant="secondary" disabled={dang}><MapPin aria-hidden /> {t("dh.tinh_hai_diem")}</Button>
                {kcBanDo != null && <p className="text-xs text-fg-faint">{t("dh.hai_diem_cach", { m: String(kcBanDo) })}</p>}
              </form>
            )}
          </div>
          {loiHien && <p role="alert" className="text-sm text-moon" data-testid="do-huong-loi">{loiHien}</p>}
        </div>
      </div>

      {kq && (
        <div className="mt-5 space-y-3" data-testid="ket-qua-do-huong">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gold/40 bg-gold/[0.06] p-4">
              <p className="eyebrow">{t("dh.huong_nha")}</p>
              <p className="mt-1 font-serif text-2xl">{huong(kq.huong)} <span className="text-base text-fg-muted">· {t("dh.son")} {tn("son", kq.son_huong)} · {kq.do_huong}°</span></p>
            </div>
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4">
              <p className="eyebrow">{t("dh.toa")}</p>
              <p className="mt-1 font-serif text-2xl">{huong(kq.toa)} <span className="text-base text-fg-muted">· {t("dh.son")} {tn("son", kq.son_toa)} · {kq.do_toa}°</span></p>
            </div>
          </div>
          <p className="text-sm">{t("dh.trach")}<b className="text-gold">{quai(kq.trach.quai)}</b> ({nhom(kq.trach.nhom)}).
            {kq.du_nien && kq.menh_quai && (
              <>{t("dh.voi_menh", { quai: quai(kq.menh_quai.quai), nhom: nhom(kq.menh_quai.nhom), huong: huong(kq.huong) })}{" "}
                <b className={cn(kq.du_nien.cat ? "text-jade" : "text-moon")}>{duNien(kq.du_nien.du_nien)}</b> ({kq.du_nien.cat ? t("dh.tot_ngoac") : t("dh.xau_ngoac")});{" "}
                {kq.hop_nhom ? t("dh.nha_cung_nhom") : t("dh.nha_khac_nhom")}</>
            )}
          </p>
          {kq.canh_bao_y && <p className="rounded-xl border border-moon/40 bg-moon/10 px-4 py-2.5 text-sm text-moon" data-testid="canh-bao-do">{kq.canh_bao_y}</p>}
          <p className="text-xs text-fg-faint">{kq.luu_y}</p>
          <div className="flex flex-wrap gap-2">
            {onDungToa && (
              <Button size="sm" variant="secondary" onClick={() => onDungToa(kq.do_toa)}>{t("dh.dung_toa", { do: String(kq.do_toa) })}</Button>
            )}
            {neoVe && (
              <Button size="sm" onClick={() => veCauTraLoi()} data-testid="do-huong-ve-cau-tra-loi"><CornerLeftUp aria-hidden /> {t("dh.ve_cau_tra_loi")}</Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
