"use client";
// LX-2027 — Pháo hoa canvas cho Bao Lì Xì: tên lửa bay lên có vệt sáng, nổ nhiều kiểu (cầu, vòng, liễu rủ, hai lớp), nhiều đợt
// nối nhau ~6 giây + màn kết; người xem chạm vào trang để bắn thêm. Không thư viện, không tải ngoài (CSP-2 sạch).
// Tự giảm số hạt trên máy yếu, dừng vòng lặp khi hết hạt, ngừng khi tab ẩn; giảm chuyển động → không chạy (nơi gọi quyết định).
import { useEffect, useRef, type RefObject } from "react";

type Kieu = "cau" | "vong" | "lieu" | "hai_lop";
interface Hat { x: number; y: number; vx: number; vy: number; tuoi: number; song: number; co: number; mau: string; ma: number; chuyen?: boolean }
interface TenLua { x: number; y: number; dich: number; vy: number; mau: string; kieu: Kieu }

interface Props {
  /** Đổi giá trị (≥ 1) để bắn một màn pháo hoa mới. */
  kich: number;
  /** Phần tử để pháo nổ phía trên (thường là bao lì xì). */
  neo: RefObject<HTMLElement | null>;
  /** Bảng màu theo thiệp (hex). */
  bangMau: string[];
  /** Chạm trang để bắn thêm (mặc định bật). */
  chamDeBan?: boolean;
}

const VANG = "#ffd36a";
const TRAN_HAT = 1500;

const ngau = (a: number, b: number) => a + Math.random() * (b - a);
const chon = <T,>(m: T[]) => m[Math.floor(Math.random() * m.length)]!;

export function PhaoHoaCanvas({ kich, neo, bangMau, chamDeBan = true }: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const heRef = useRef<{ ban: () => void; banTai: (x: number, y: number) => void; dung: () => void } | null>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const g = ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const yeu = (navigator.hardwareConcurrency ?? 4) <= 4;
    const heSo = yeu ? 0.6 : 1;
    const mauNen = bangMau.length ? bangMau : [VANG];

    let w = 0, h = 0;
    const doCo = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    doCo();
    window.addEventListener("resize", doCo);

    const hat: Hat[] = [];
    const lua: TenLua[] = [];
    const hen: { luc: number; viec: () => void }[] = [];
    let raf = 0, truoc = 0, dangChay = false;

    const vung = () => {
      const r = neo.current?.getBoundingClientRect();
      if (!r) return { tam: w / 2, rong: Math.min(w, 520), day: h * 0.7, dinh: 60 };
      return { tam: r.left + r.width / 2, rong: Math.max(r.width, 320), day: Math.max(r.top + 30, 140), dinh: Math.max(r.top - 330, 56) };
    };

    const no = (x: number, y: number, kieu: Kieu, mau: string) => {
      const n = Math.round((kieu === "vong" ? 60 : kieu === "lieu" ? 80 : 110) * heSo);
      const phu = chon(mauNen);
      const them = (soHat: number, tocDo: number, m: string, ma: number, chuyen = false, song = ngau(1.1, 1.7)) => {
        for (let i = 0; i < soHat && hat.length < TRAN_HAT; i++) {
          const goc = kieu === "vong" || ma === 1 ? (i / soHat) * Math.PI * 2 : Math.random() * Math.PI * 2;
          const toc = kieu === "vong" || ma === 1 ? tocDo : tocDo * Math.sqrt(Math.random());
          hat.push({ x, y, vx: Math.cos(goc) * toc, vy: Math.sin(goc) * toc, tuoi: 0, song, co: ngau(1.4, 2.6), mau: m, ma, chuyen });
        }
      };
      if (kieu === "cau") them(n, ngau(4.5, 6.5), mau, 0, true);
      else if (kieu === "vong") them(n, 5.2, mau, 1);
      else if (kieu === "lieu") them(n, ngau(2.6, 4.4), VANG, 2, false, ngau(2.2, 3));
      else { them(Math.round(n * 0.7), 6.2, mau, 0); them(Math.round(n * 0.5), 3.2, phu, 1, true); }
      // chớp sáng nhỏ tại tâm nổ
      for (let i = 0; i < 6 && hat.length < TRAN_HAT; i++) hat.push({ x, y, vx: ngau(-.4, .4), vy: ngau(-.4, .4), tuoi: 0, song: 0.28, co: ngau(5, 8), mau: "#fff7d6", ma: 3 });
    };

    const phong = (x: number, dich: number, y0: number, kieu: Kieu) => {
      lua.push({ x, y: y0, dich, vy: -ngau(8, 11), mau: chon(mauNen), kieu });
    };

    const mot = (kieu?: Kieu) => {
      const v = vung();
      phong(v.tam + ngau(-v.rong * 0.55, v.rong * 0.55), ngau(v.dinh, Math.max(v.dinh + 60, v.day - 150)), v.day, kieu ?? chon<Kieu>(["cau", "cau", "vong", "lieu", "hai_lop"]));
    };

    const banMan = () => {
      const lich: [number, Kieu][] = [[0, "cau"], [350, "hai_lop"], [700, "vong"], [1200, "cau"], [1500, "lieu"], [2100, "hai_lop"], [2500, "cau"], [3000, "vong"], [3500, "lieu"], [4200, "hai_lop"]];
      const now = performance.now();
      for (const [ms, k] of lich) hen.push({ luc: now + ms, viec: () => mot(k) });
      // màn kết: loạt nổ nhỏ dày
      for (let i = 0; i < 7; i++) hen.push({ luc: now + 5000 + i * 110, viec: () => mot("cau") });
      chay();
    };

    const banTai = (x: number, y: number) => {
      if (hat.length > TRAN_HAT - 200) return;
      no(x, y, chon<Kieu>(["cau", "vong", "hai_lop", "lieu"]), chon(mauNen));
      chay();
    };

    const buoc = (t: number) => {
      const dt = Math.min((t - truoc) / 16.67 || 1, 3);
      truoc = t;
      for (let i = hen.length - 1; i >= 0; i--) if (hen[i]!.luc <= t) { hen[i]!.viec(); hen.splice(i, 1); }

      // mờ dần khung cũ để tạo vệt sáng
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "lighter";

      for (let i = lua.length - 1; i >= 0; i--) {
        const l = lua[i]!;
        l.y += l.vy * dt; l.vy *= 1 - 0.018 * dt;
        g.fillStyle = "#fff3c4"; g.beginPath(); g.arc(l.x, l.y, 2, 0, 6.3); g.fill();
        if (hat.length < TRAN_HAT) hat.push({ x: l.x + ngau(-1, 1), y: l.y + 3, vx: ngau(-.3, .3), vy: ngau(.4, 1.2), tuoi: 0, song: 0.5, co: 1.4, mau: "#ffcf70", ma: 3 });
        if (l.y <= l.dich || l.vy > -1.2) { no(l.x, l.y, l.kieu, l.mau); lua.splice(i, 1); }
      }

      for (let i = hat.length - 1; i >= 0; i--) {
        const p = hat[i]!;
        const k = dt / 60;
        p.tuoi += k;
        if (p.tuoi >= p.song) { hat.splice(i, 1); continue; }
        const ma = p.ma;
        const ma_sat = ma === 2 ? 0.965 : 0.975;
        p.vx *= Math.pow(ma_sat, dt); p.vy = p.vy * Math.pow(ma_sat, dt) + (ma === 2 ? 0.07 : ma === 3 ? 0 : 0.045) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const phan = p.tuoi / p.song;
        let a = 1 - phan;
        if (p.chuyen) a *= 0.55 + 0.45 * Math.sin(p.tuoi * 55 + i); // lấp lánh
        if (a <= 0.02) continue;
        g.globalAlpha = Math.min(1, a * 1.15);
        g.fillStyle = p.mau;
        const r = p.co * (ma === 3 ? 1 - phan * 0.7 : 1 - phan * 0.45);
        g.beginPath(); g.arc(p.x, p.y, Math.max(r, 0.4), 0, 6.3); g.fill();
        // vệt đuôi ngắn theo hướng bay (liễu rủ dài hơn)
        if (ma !== 3) {
          g.strokeStyle = p.mau; g.lineWidth = Math.max(r * 0.7, 0.4);
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * (ma === 2 ? 3.2 : 1.8), p.y - p.vy * (ma === 2 ? 3.2 : 1.8)); g.stroke();
        }
      }
      g.globalAlpha = 1;

      if (hat.length || lua.length || hen.length) raf = requestAnimationFrame(buoc);
      else { dangChay = false; g.clearRect(0, 0, w, h); }
    };

    function chay() {
      if (dangChay) return;
      dangChay = true; truoc = performance.now();
      raf = requestAnimationFrame(buoc);
    }

    heRef.current = { ban: banMan, banTai, dung: () => { cancelAnimationFrame(raf); dangChay = false; hat.length = 0; lua.length = 0; hen.length = 0; g.clearRect(0, 0, w, h); } };
    return () => { window.removeEventListener("resize", doCo); heRef.current?.dung(); heRef.current = null; };
  }, [neo, bangMau]);

  useEffect(() => { if (kich > 0) heRef.current?.ban(); }, [kich]);

  useEffect(() => {
    if (!chamDeBan || kich < 1) return;
    const khiCham = (e: PointerEvent) => {
      const dich = e.target as HTMLElement | null;
      if (dich?.closest("button, a, input, textarea, select, label, [role=button]")) return;
      heRef.current?.banTai(e.clientX, e.clientY);
    };
    window.addEventListener("pointerdown", khiCham);
    return () => window.removeEventListener("pointerdown", khiCham);
  }, [chamDeBan, kich]);

  return <canvas ref={cvRef} className="pointer-events-none fixed inset-0 z-[60] h-screen w-screen" aria-hidden data-testid="lx-phao-canvas" />;
}
