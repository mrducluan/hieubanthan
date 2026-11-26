// LX-2027 — ÂM THANH pháo hoa + giai điệu Năm mới, TỔNG HỢP bằng WebAudio ngay trên máy: không tệp âm thanh, không tải ngoài,
// không bản ghi nào của bên thứ ba (bài hát có bản quyền như "Happy New Year" của ABBA KHÔNG dùng — cả bản thu lẫn lời).
// Giai điệu là "Auld Lang Syne" (dân ca Scotland, lời Robert Burns 1788 — phạm vi công cộng), chơi bằng chuông + đệm hợp âm.
// Dùng chung cho trang (nghe qua loa, sau một cú bấm của người dùng) và video Story (ghi vào luồng âm của video, không phát ra loa).
import type { AmPhaoHoa } from "@/lib/phao-hoa";

const KHOA_TAT = "hbt.am_phao.tat";

export interface AmThanh extends AmPhaoHoa {
  /** Chơi giai điệu từ lúc `batDau` (giây theo đồng hồ của AudioContext). */
  nhac: (batDau?: number, nhipGiay?: number) => number;
  ctx: AudioContext;
  /** Luồng âm để gắn vào MediaRecorder (chỉ có ở bản `daChoVideo`). */
  luongVideo: MediaStream | null;
  dong: () => void;
}

/** Người dùng đã tắt tiếng chưa (nhớ trên máy). */
export function amDangTat(): boolean {
  try { return localStorage.getItem(KHOA_TAT) === "1"; } catch { return false; }
}
export function datAmTat(tat: boolean) {
  try { if (tat) localStorage.setItem(KHOA_TAT, "1"); else localStorage.removeItem(KHOA_TAT); } catch { /* bỏ qua */ }
}

type Ctor = typeof AudioContext;
const taoCtx = (): AudioContext | null => {
  try {
    const C: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    return C ? new C() : null;
  } catch { return null; }
};

// ── bộ dùng chung cho trang: tạo / mở khoá khi người dùng bấm (iOS chỉ cho phát sau một cú chạm) ──
let chung: AmThanh | null = null;
export function moKhoaAm() {
  try {
    if (amDangTat()) return;
    if (!chung) chung = taoAmThanh(false);
    void chung?.ctx.resume();
  } catch { /* bỏ qua */ }
}
/** Âm thanh cho trang; null nếu máy không hỗ trợ hoặc người dùng đã tắt. */
export function amChoTrang(): AmThanh | null {
  if (amDangTat()) return null;
  if (!chung) chung = taoAmThanh(false);
  if (chung && chung.ctx.state === "suspended") void chung.ctx.resume();
  return chung;
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);   // số MIDI → Hz
/** Auld Lang Syne, giọng Đô trưởng: [MIDI, số phách]. 0 = nghỉ. Câu đầu + câu hai, dừng ở "forgot" rồi kết bằng hợp âm. */
const GIAI_DIEU: [number, number][] = [
  [67, 1],                                   // Should (nhấn)
  [72, 1.5], [72, 0.5], [72, 1], [76, 1],    // auld ac-quain-tance
  [74, 1.5], [72, 0.5], [74, 1], [76, 1],    // be for-got
  [72, 1.5], [72, 0.5], [76, 1], [79, 1],    // and nev-er
  [81, 3], [0, 1],                           // brought
];
// Hợp âm đệm theo từng ô nhịp (tính từ phách thứ `tu`, sau nốt nhấn đầu).
const HOP_AM: { tu: number; note: number[] }[] = [
  { tu: 2, note: [48, 55, 64] }, { tu: 6, note: [43, 55, 62] }, { tu: 10, note: [48, 55, 64] }, { tu: 14, note: [41, 57, 65] },
];

export function taoAmThanh(choVideo: boolean): AmThanh | null {
  const ctx = taoCtx();
  if (!ctx) return null;
  const tong = ctx.createGain(); tong.gain.value = 0.85;
  const nen = ctx.createDynamicsCompressor();
  nen.threshold.value = -16; nen.ratio.value = 6; nen.attack.value = 0.004; nen.release.value = 0.22;
  tong.connect(nen);
  let luongVideo: MediaStream | null = null;
  if (choVideo) {
    const dich = ctx.createMediaStreamDestination();
    nen.connect(dich);
    luongVideo = dich.stream;
  } else nen.connect(ctx.destination);

  // vang (reverb) tạo từ nhiễu tắt dần — tiếng nổ có "không gian"
  const vang = ctx.createConvolver();
  const dai = Math.floor(ctx.sampleRate * 1.8);
  const ir = ctx.createBuffer(2, dai, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < dai; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dai, 2.6);
  }
  vang.buffer = ir;
  const vangGain = ctx.createGain(); vangGain.gain.value = 0.34;
  vang.connect(vangGain); vangGain.connect(tong);

  const nhieu = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  { const d = nhieu.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

  const ra = (pan: number, vangMuc: number) => {
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const dau = ctx.createGain();
    if (p) { p.pan.value = Math.max(-0.9, Math.min(0.9, pan)); dau.connect(p); p.connect(tong); const g2 = ctx.createGain(); g2.gain.value = vangMuc; p.connect(g2); g2.connect(vang); }
    else { dau.connect(tong); const g2 = ctx.createGain(); g2.gain.value = vangMuc; dau.connect(g2); g2.connect(vang); }
    return dau;
  };

  let boomCuoi = 0;
  const am: AmPhaoHoa = {
    // tên lửa vút lên: tiếng huýt trượt cao dần
    len(x) {
      const t = ctx.currentTime, pan = x * 2 - 1;
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(2100, t + 0.75);
      const g = ra(pan, 0.15);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g); o.start(t); o.stop(t + 0.85);
      const n = ctx.createBufferSource(); n.buffer = nhieu; n.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 3;
      bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(3600, t + 0.75);
      const g2 = ra(pan, 0.1);
      g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(0.035, t + 0.1); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      n.connect(bp); bp.connect(g2); n.start(t); n.stop(t + 0.85);
    },
    // nổ: một tiếng "bùm" trầm + dải nhiễu + lách tách
    no(x, kieu, lon) {
      const t = ctx.currentTime;
      // nổ dồn dập (loạt kết) thì nhỏ lại để không bị chồng thành tiếng ù
      const dap = t - boomCuoi; boomCuoi = t;
      const muc = (dap < 0.12 ? 0.5 : 1) * Math.min(1.3, lon);
      const pan = x * 2 - 1;
      const bum = ctx.createOscillator(); bum.type = "sine";
      bum.frequency.setValueAtTime(150, t); bum.frequency.exponentialRampToValueAtTime(38, t + 0.45);
      const gb = ra(pan, 0.5);
      gb.gain.setValueAtTime(0.0001, t); gb.gain.linearRampToValueAtTime(0.85 * muc, t + 0.012); gb.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      bum.connect(gb); bum.start(t); bum.stop(t + 0.75);
      const n = ctx.createBufferSource(); n.buffer = nhieu; n.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(300, t + 0.55);
      const gn = ra(pan, 0.7);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(0.55 * muc, t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      n.connect(lp); lp.connect(gn); n.start(t); n.stop(t + 0.65);
      // lách tách: nhiều tiếng click nhỏ rải 0,9 giây (mật độ theo kiểu nổ)
      const so = kieu === "lieu" ? 16 : kieu === "cau" ? 12 : 8;
      for (let i = 0; i < so; i++) {
        const tc = t + 0.12 + Math.random() * 0.9;
        const c = ctx.createBufferSource(); c.buffer = nhieu;
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500 + Math.random() * 3000;
        const gc = ra(pan + (Math.random() - 0.5) * 0.5, 0.2);
        gc.gain.setValueAtTime(0.0001, tc); gc.gain.linearRampToValueAtTime(0.06 * muc, tc + 0.002); gc.gain.exponentialRampToValueAtTime(0.0001, tc + 0.035);
        c.connect(hp); hp.connect(gc); c.start(tc, Math.random() * 0.5, 0.05);
      }
    },
    // chữ pháo hoa: tiếng lấp lánh cao, tắt dần
    chu(x) {
      const t = ctx.currentTime, pan = x * 2 - 1;
      [1568, 2093, 2637, 3136].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ra(pan, 0.5), ti = t + 0.12 + i * 0.09;
        g.gain.setValueAtTime(0.0001, ti); g.gain.linearRampToValueAtTime(0.07, ti + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ti + 1.6);
        o.connect(g); o.start(ti); o.stop(ti + 1.7);
      });
    },
  };

  /** Chuông: sóng tam giác + hoạ âm, tắt dần; đệm hợp âm sine dịu. Trả về thời điểm kết thúc. */
  const chuong = (midi: number, t: number, dai: number, mau = 0.16) => {
    const f = NOTE(midi);
    for (const [he, g0] of [[1, 1], [2, 0.32], [3, 0.12]] as const) {
      const o = ctx.createOscillator(); o.type = he === 1 ? "triangle" : "sine"; o.frequency.value = f * he;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(mau * g0, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dai, 0.5) + 0.7);
      o.connect(g); g.connect(tong);
      const gv = ctx.createGain(); gv.gain.value = 0.25; g.connect(gv); gv.connect(vang);
      o.start(t); o.stop(t + Math.max(dai, 0.5) + 0.8);
    }
  };
  const dem = (midi: number, t: number, dai: number) => {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = NOTE(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 0.25); g.gain.linearRampToValueAtTime(0.0001, t + dai);
    o.connect(g); g.connect(tong); o.start(t); o.stop(t + dai + 0.05);
  };

  const nhac = (batDau = ctx.currentTime + 0.05, nhip = 0.5) => {
    let t = batDau, phach = 0;
    for (const [midi, soPhach] of GIAI_DIEU) {
      if (midi) chuong(midi, t, soPhach * nhip);
      t += soPhach * nhip; phach += soPhach;
    }
    for (const h of HOP_AM) h.note.forEach((n) => dem(n, batDau + (h.tu - 1) * nhip, 4 * nhip));
    // kết: hợp âm Đô trưởng ngân dài — giai điệu "được trả về nhà"
    const tKet = batDau + (phach + 0.3) * nhip;
    [60, 64, 67, 72, 76].forEach((n, i) => chuong(n, tKet + i * 0.07, 1.6, 0.11));
    return tKet + 2.4 - batDau;
  };

  return { ...am, nhac, ctx, luongVideo, dong: () => { try { void ctx.close(); } catch { /* bỏ qua */ } } };
}
