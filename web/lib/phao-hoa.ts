// LX-2027 — LÕI pháo hoa canvas dùng chung: trang web (PhaoHoaCanvas) và video Story (li-xi-video).
// Tên lửa bay lên có vệt sáng → nổ 4 kiểu (cầu lấp lánh, vòng, liễu rủ, hai lớp) + "chữ pháo hoa" (hạt bay về xếp thành chữ
// 2027 / PHÚC / LỘC rồi rơi như mưa vàng). Không thư viện, không tải ngoài; tự giảm hạt trên máy yếu.

export type KieuPhao = "cau" | "vong" | "lieu" | "hai_lop";
export interface VungBan { tam: number; rong: number; day: number; dinh: number }

interface Hat {
  x: number; y: number; vx: number; vy: number; tuoi: number; song: number; co: number; mau: string;
  /** 0 cầu · 1 vòng · 2 liễu · 3 chớp / đuôi tên lửa · 4 hạt xếp chữ */
  ma: number; chuyen?: boolean; tx?: number; ty?: number;
}
interface TenLua { x: number; y: number; dich: number; vy: number; mau: string; kieu: KieuPhao | "chu"; chu?: string }

/** Móc âm thanh (tuỳ chọn): x theo tỉ lệ 0..1 ngang canvas. Lõi chỉ gọi, không biết âm thanh làm bằng gì. */
export interface AmPhaoHoa {
  len: (x: number) => void;
  no: (x: number, kieu: string, lon: number) => void;
  chu: (x: number) => void;
}

export interface TuyChonPhaoHoa {
  /** Âm thanh đi kèm từng tên lửa / tiếng nổ (không có thì im lặng). */
  am?: AmPhaoHoa | null;
  canvas: HTMLCanvasElement;
  rong: number;
  cao: number;
  dpr?: number;
  bangMau: string[];
  /** Vùng bắn (toạ độ theo px của canvas): gọi lại mỗi lần bắn để theo kịp cuộn trang. */
  vung: () => VungBan;
  /** Hệ số số hạt (0.6 máy yếu · 1 mặc định). */
  heSo?: number;
  /** Các chữ xếp bằng hạt ở màn kết (tối đa 2 chữ, ngắn, do hệ thống đặt — không lấy từ người dùng). */
  chu?: string[];
}
export interface DieuKhienPhaoHoa {
  banMan: () => void;
  banTai: (x: number, y: number) => void;
  doiCo: (rong: number, cao: number) => void;
  dung: () => void;
}

export const VANG_KIM = "#ffd36a";
const TRAN_HAT = 1900;

const ngau = (a: number, b: number) => a + Math.random() * (b - a);
const chon = <T,>(m: T[]) => m[Math.floor(Math.random() * m.length)]!;

/** Số hạt theo sức máy: ≤ 4 nhân → 0.6. */
export const heSoTheoMay = () => {
  try { return (navigator.hardwareConcurrency ?? 4) <= 4 ? 0.6 : 1; } catch { return 1; }
};

export function taoPhaoHoa(o: TuyChonPhaoHoa): DieuKhienPhaoHoa {
  const g = o.canvas.getContext("2d");
  if (!g) return { banMan() {}, banTai() {}, doiCo() {}, dung() {} };
  const dpr = o.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
  const heSo = o.heSo ?? heSoTheoMay();
  const mauNen = o.bangMau.length ? o.bangMau : [VANG_KIM];
  let w = o.rong, h = o.cao;

  const datCo = (rong: number, cao: number) => {
    w = rong; h = cao;
    o.canvas.width = Math.round(w * dpr); o.canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  datCo(w, h);

  const hat: Hat[] = [];
  const lua: TenLua[] = [];
  const hen: { luc: number; viec: () => void }[] = [];
  let raf = 0, truoc = 0, dangChay = false;

  /** Hạt xếp thành chữ: bay từ tâm nổ về các điểm của chữ, giữ nhấp nháy, rồi rơi như mưa vàng. */
  const noChu = (x: number, y: number, chu: string, mau: string) => {
    const co = Math.max(54, Math.min(w * (chu.length > 4 ? 0.15 : 0.21), 112));
    const oc = document.createElement("canvas");
    const c2 = oc.getContext("2d");
    if (!c2) return;
    c2.font = `800 ${co}px system-ui, "Be Vietnam Pro", sans-serif`;
    const rongChu = Math.ceil(c2.measureText(chu).width) + 8, caoChu = Math.ceil(co * 1.25);
    oc.width = rongChu; oc.height = caoChu;
    c2.font = `800 ${co}px system-ui, "Be Vietnam Pro", sans-serif`;
    c2.textBaseline = "middle"; c2.fillStyle = "#fff";
    c2.fillText(chu, 4, caoChu / 2);
    let anh: ImageData;
    try { anh = c2.getImageData(0, 0, rongChu, caoChu); } catch { return; }
    const buoc = Math.max(3, Math.round(co / 26 / (heSo < 1 ? 0.8 : 1)));
    const cx = Math.min(Math.max(x, rongChu / 2 + 12), w - rongChu / 2 - 12);
    for (let py = 0; py < caoChu; py += buoc) {
      for (let px = 0; px < rongChu; px += buoc) {
        if (anh.data[(py * rongChu + px) * 4 + 3]! < 140 || hat.length >= TRAN_HAT) continue;
        const goc = Math.random() * Math.PI * 2, toc = ngau(1.5, 6.5);
        hat.push({
          x, y, vx: Math.cos(goc) * toc, vy: Math.sin(goc) * toc, tuoi: 0, song: ngau(4.2, 5), co: ngau(1.3, 2.1),
          mau: Math.random() < 0.7 ? mau : VANG_KIM, ma: 4, chuyen: true,
          tx: cx - rongChu / 2 + px, ty: y - caoChu / 2 + py,
        });
      }
    }
  };

  const no = (x: number, y: number, kieu: KieuPhao | "chu", mau: string, chu?: string) => {
    o.am?.no(x / w, kieu, kieu === "chu" ? 1.25 : kieu === "hai_lop" ? 1.1 : 1);
    if (kieu === "chu") { o.am?.chu(x / w); noChu(x, y, chu ?? "2027", mau); }
    else {
      const n = Math.round((kieu === "vong" ? 60 : kieu === "lieu" ? 80 : 110) * heSo);
      const phu = chon(mauNen);
      const them = (soHat: number, tocDo: number, m: string, ma: number, chuyen = false, song = ngau(1.1, 1.7)) => {
        for (let i = 0; i < soHat && hat.length < TRAN_HAT; i++) {
          const dongDeu = kieu === "vong" || ma === 1;
          const goc = dongDeu ? (i / soHat) * Math.PI * 2 : Math.random() * Math.PI * 2;
          const toc = dongDeu ? tocDo : tocDo * Math.sqrt(Math.random());
          hat.push({ x, y, vx: Math.cos(goc) * toc, vy: Math.sin(goc) * toc, tuoi: 0, song, co: ngau(1.4, 2.6), mau: m, ma, chuyen });
        }
      };
      if (kieu === "cau") them(n, ngau(4.5, 6.5), mau, 0, true);
      else if (kieu === "vong") them(n, 5.2, mau, 1);
      else if (kieu === "lieu") them(n, ngau(2.6, 4.4), VANG_KIM, 2, false, ngau(2.2, 3));
      else { them(Math.round(n * 0.7), 6.2, mau, 0); them(Math.round(n * 0.5), 3.2, phu, 1, true); }
    }
    // chớp sáng nhỏ tại tâm nổ
    for (let i = 0; i < 6 && hat.length < TRAN_HAT; i++) {
      hat.push({ x, y, vx: ngau(-0.4, 0.4), vy: ngau(-0.4, 0.4), tuoi: 0, song: 0.28, co: ngau(5, 8), mau: "#fff7d6", ma: 3 });
    }
  };

  const phong = (x: number, dich: number, y0: number, kieu: TenLua["kieu"], chu?: string) => {
    o.am?.len(x / w);
    lua.push({ x, y: y0, dich, vy: -ngau(8, 11), mau: chon(mauNen), kieu, chu });
  };

  const mot = (kieu?: KieuPhao) => {
    const v = o.vung();
    phong(v.tam + ngau(-v.rong * 0.55, v.rong * 0.55), ngau(v.dinh, Math.max(v.dinh + 60, v.day - 150)), v.day,
      kieu ?? chon<KieuPhao>(["cau", "cau", "vong", "lieu", "hai_lop"]));
  };

  const chuGiua = (chu: string) => {
    const v = o.vung();
    const dich = Math.max(v.dinh + 40, (v.dinh + v.day) / 2 - 20);
    phong(v.tam, dich, v.day, "chu", chu);
  };

  const chay = () => {
    if (dangChay) return;
    dangChay = true; truoc = performance.now();
    raf = requestAnimationFrame(buoc);
  };

  const banMan = () => {
    const lich: [number, KieuPhao][] = [[0, "cau"], [350, "hai_lop"], [700, "vong"], [1200, "cau"], [1500, "lieu"], [2100, "hai_lop"],
      [2500, "cau"], [3000, "vong"], [3500, "lieu"], [4200, "hai_lop"]];
    const now = performance.now();
    for (const [ms, k] of lich) hen.push({ luc: now + ms, viec: () => mot(k) });
    // Chữ pháo hoa: hai lượt, cách nhau để mắt kịp đọc.
    (o.chu ?? []).slice(0, 2).forEach((c, i) => hen.push({ luc: now + 2300 + i * 2600, viec: () => chuGiua(c) }));
    // màn kết: loạt nổ nhỏ dày
    for (let i = 0; i < 7; i++) hen.push({ luc: now + 7200 + i * 110, viec: () => mot("cau") });
    chay();
  };

  const banTai = (x: number, y: number) => {
    if (hat.length > TRAN_HAT - 200) return;
    no(x, y, chon<KieuPhao>(["cau", "vong", "hai_lop", "lieu"]), chon(mauNen));
    chay();
  };

  function buoc(t: number) {
    const dt = Math.min((t - truoc) / 16.67 || 1, 3);
    truoc = t;
    for (let i = hen.length - 1; i >= 0; i--) if (hen[i]!.luc <= t) { hen[i]!.viec(); hen.splice(i, 1); }

    // mờ dần khung cũ để tạo vệt sáng
    g!.globalCompositeOperation = "destination-out";
    g!.fillStyle = "rgba(0,0,0,0.22)";
    g!.fillRect(0, 0, w, h);
    g!.globalCompositeOperation = "lighter";

    for (let i = lua.length - 1; i >= 0; i--) {
      const l = lua[i]!;
      l.y += l.vy * dt; l.vy *= 1 - 0.018 * dt;
      g!.fillStyle = "#fff3c4"; g!.beginPath(); g!.arc(l.x, l.y, 2, 0, 6.3); g!.fill();
      if (hat.length < TRAN_HAT) hat.push({ x: l.x + ngau(-1, 1), y: l.y + 3, vx: ngau(-0.3, 0.3), vy: ngau(0.4, 1.2), tuoi: 0, song: 0.5, co: 1.4, mau: "#ffcf70", ma: 3 });
      if (l.y <= l.dich || l.vy > -1.2) { no(l.x, l.y, l.kieu, l.mau, l.chu); lua.splice(i, 1); }
    }

    for (let i = hat.length - 1; i >= 0; i--) {
      const p = hat[i]!;
      p.tuoi += dt / 60;
      if (p.tuoi >= p.song) { hat.splice(i, 1); continue; }
      const phan = p.tuoi / p.song;
      if (p.ma === 4) {
        // bay về điểm của chữ (lò xo giảm chấn), giữ nhấp nháy, 70% cuối đời thì mưa vàng rơi dần
        const roi = phan > 0.8;
        if (roi) { p.ty! += (0.4 + (phan - 0.8) * 6) * dt; p.vy += 0.03 * dt; }
        p.vx = p.vx * Math.pow(0.9, dt) + (p.tx! - p.x) * 0.012 * dt;
        p.vy = p.vy * Math.pow(0.9, dt) + (p.ty! - p.y) * 0.012 * dt;
        p.x += p.vx * dt * 1.7; p.y += p.vy * dt * 1.7;
      } else {
        const masat = p.ma === 2 ? 0.965 : 0.975;
        p.vx *= Math.pow(masat, dt);
        p.vy = p.vy * Math.pow(masat, dt) + (p.ma === 2 ? 0.07 : p.ma === 3 ? 0 : 0.045) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      let a = p.ma === 4 ? (phan < 0.08 ? phan / 0.08 : phan > 0.8 ? 1 - (phan - 0.8) / 0.2 : 1) : 1 - phan;
      if (p.chuyen) a *= 0.6 + 0.4 * Math.sin(p.tuoi * 55 + i);   // lấp lánh
      if (a <= 0.02) continue;
      g!.globalAlpha = Math.min(1, a * 1.15);
      g!.fillStyle = p.mau;
      const r = p.co * (p.ma === 3 ? 1 - phan * 0.7 : p.ma === 4 ? 1 : 1 - phan * 0.45);
      g!.beginPath(); g!.arc(p.x, p.y, Math.max(r, 0.4), 0, 6.3); g!.fill();
      // vệt đuôi ngắn theo hướng bay (liễu rủ dài hơn)
      if (p.ma !== 3 && p.ma !== 4) {
        const dai = p.ma === 2 ? 3.2 : 1.8;
        g!.strokeStyle = p.mau; g!.lineWidth = Math.max(r * 0.7, 0.4);
        g!.beginPath(); g!.moveTo(p.x, p.y); g!.lineTo(p.x - p.vx * dai, p.y - p.vy * dai); g!.stroke();
      }
    }
    g!.globalAlpha = 1;

    if (hat.length || lua.length || hen.length) raf = requestAnimationFrame(buoc);
    else { dangChay = false; g!.clearRect(0, 0, w, h); }
  }

  const dung = () => {
    cancelAnimationFrame(raf); dangChay = false;
    hat.length = 0; lua.length = 0; hen.length = 0;
    g.clearRect(0, 0, w, h);
  };

  return { banMan, banTai, doiCo: (rong, cao) => datCo(rong, cao), dung };
}
