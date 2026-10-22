// TCS-1 — bộ mã hoá QR thuần TypeScript (không thư viện ngoài), theo ISO/IEC 18004:
// chế độ byte (UTF-8), mức sửa lỗi M, phiên bản 1–10 tự chọn nhỏ nhất vừa dữ liệu, chọn mặt nạ (mask) có điểm phạt
// thấp nhất theo bốn luật N1–N4 của chuẩn. Kết quả là ma trận ô (true = ô tối) — vẽ được trong ImageResponse
// (SVG path) lẫn canvas trình duyệt. Chạy được cả máy chủ lẫn trình duyệt (không dùng Buffer / node:*).
// Kiểm chứng: e2e/qr.spec.ts so từng ô với golden e2e/fixtures/qr-golden.json (sinh bằng một bộ mã hoá độc lập).

export interface MaQr {
  /** Phiên bản 1–10 (cạnh = 17 + 4 × phiên bản ô). */
  phienBan: number;
  /** Mặt nạ đã chọn 0–7. */
  mask: number;
  kichThuoc: number;
  /** o[hàng][cột] — true = ô tối. */
  o: boolean[][];
}

// Mức M: số từ mã sửa lỗi mỗi khối và số khối, theo phiên bản (chỉ số 0 bỏ trống).
const EC_MOI_KHOI_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const SO_KHOI_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const PHIEN_BAN_TOI_DA = 10;
const BIT_MUC_M = 0;   // L=01, M=00, Q=11, H=10

// ------------------------------------------------------------------ GF(256), đa thức 0x11D — Reed–Solomon
const MU = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    MU[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) MU[i] = MU[i - 255]!;
}
const nhan = (a: number, b: number) => (a === 0 || b === 0 ? 0 : MU[LOG[a]! + LOG[b]!]!);

/** Hệ số đa thức sinh bậc n (bỏ hệ số bậc cao nhất = 1), từ bậc cao xuống thấp. */
function daThucSinh(n: number): number[] {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const moi = new Array<number>(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      moi[j] = moi[j]! ^ p[j]!;                        // × x
      moi[j + 1] = moi[j + 1]! ^ nhan(p[j]!, MU[i]!);  // × α^i
    }
    p = moi;
  }
  return p.slice(1);
}

function sinhSuaLoi(du_lieu: number[], n: number): number[] {
  const g = daThucSinh(n);
  const du = new Array<number>(n).fill(0);
  for (const b of du_lieu) {
    const f = b ^ du.shift()!;
    du.push(0);
    for (let i = 0; i < n; i++) du[i] = du[i]! ^ nhan(g[i]!, f);
  }
  return du;
}

// ------------------------------------------------------------------ dung lượng
/** Số ô dành cho dữ liệu + sửa lỗi (đã trừ mẫu chức năng, định dạng, phiên bản). */
function soOTho(v: number): number {
  let n = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const a = Math.floor(v / 7) + 2;
    n -= (25 * a - 10) * a - 55;
    if (v >= 7) n -= 36;
  }
  return n;
}
const tongTuMa = (v: number) => Math.floor(soOTho(v) / 8);
const tuMaDuLieu = (v: number) => tongTuMa(v) - EC_MOI_KHOI_M[v]! * SO_KHOI_M[v]!;
const bitDemKyTu = (v: number) => (v <= 9 ? 8 : 16);

/** Số byte tối đa ở phiên bản v, mức M, chế độ byte. */
export function dungLuongByte(v: number): number {
  return Math.floor((tuMaDuLieu(v) * 8 - 4 - bitDemKyTu(v)) / 8);
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// ------------------------------------------------------------------ mã hoá dữ liệu
function dongGoi(du_lieu: Uint8Array, v: number): number[] {
  const bit: number[] = [];
  const them = (gia_tri: number, so_bit: number) => { for (let i = so_bit - 1; i >= 0; i--) bit.push((gia_tri >>> i) & 1); };
  them(0b0100, 4);                       // chế độ byte
  them(du_lieu.length, bitDemKyTu(v));
  for (const b of du_lieu) them(b, 8);
  const sucChua = tuMaDuLieu(v) * 8;
  them(0, Math.min(4, sucChua - bit.length));   // kết thúc
  while (bit.length % 8) bit.push(0);
  const tu: number[] = [];
  for (let i = 0; i < bit.length; i += 8) tu.push(bit.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let dem = 0; tu.length < tuMaDuLieu(v); dem++) tu.push(dem % 2 ? 0x11 : 0xec);
  return tu;
}

/** Chia khối, thêm sửa lỗi, đan xen từ mã. */
function danXen(tu: number[], v: number): number[] {
  const soKhoi = SO_KHOI_M[v]!, ec = EC_MOI_KHOI_M[v]!, tong = tongTuMa(v);
  const soKhoiNgan = soKhoi - (tong % soKhoi);
  const dlNgan = Math.floor(tong / soKhoi) - ec;
  const khoi: number[][] = [], sua: number[][] = [];
  let k = 0;
  for (let i = 0; i < soKhoi; i++) {
    const dai = dlNgan + (i < soKhoiNgan ? 0 : 1);
    const dl = tu.slice(k, k + dai);
    k += dai;
    khoi.push(dl);
    sua.push(sinhSuaLoi(dl, ec));
  }
  const kq: number[] = [];
  for (let i = 0; i <= dlNgan; i++) for (const b of khoi) if (i < b.length) kq.push(b[i]!);
  for (let i = 0; i < ec; i++) for (const s of sua) kq.push(s[i]!);
  return kq;
}

// ------------------------------------------------------------------ ma trận
function viTriCanChinh(v: number): number[] {
  if (v === 1) return [];
  const so = Math.floor(v / 7) + 2;
  const canh = 17 + 4 * v;
  const buoc = Math.ceil((v * 4 + 4) / (so * 2 - 2)) * 2;
  const kq = [6];
  for (let p = canh - 7; kq.length < so; p -= buoc) kq.splice(1, 0, p);
  return kq;
}

function bitDinhDang(mask: number): number {
  const d = (BIT_MUC_M << 3) | mask;
  let r = d;
  for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
  return ((d << 10) | r) ^ 0x5412;
}

class MaTran {
  readonly n: number;
  readonly o: boolean[][];
  readonly chucNang: boolean[][];
  readonly v: number;
  constructor(v: number) {
    this.v = v;
    this.n = 17 + 4 * v;
    this.o = Array.from({ length: this.n }, () => new Array<boolean>(this.n).fill(false));
    this.chucNang = Array.from({ length: this.n }, () => new Array<boolean>(this.n).fill(false));
  }
  /** Đặt ô chức năng tại cột x, hàng y. */
  dat(x: number, y: number, toi: boolean) {
    this.o[y]![x] = toi;
    this.chucNang[y]![x] = true;
  }
  veMauChucNang() {
    const n = this.n;
    for (let i = 0; i < n; i++) {   // vạch định thời
      this.dat(6, i, i % 2 === 0);
      this.dat(i, 6, i % 2 === 0);
    }
    for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]] as const) {   // ba mắt định vị + vùng tách
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        this.dat(x, y, d !== 2 && d !== 4);
      }
    }
    const vt = viTriCanChinh(this.v);
    for (let i = 0; i < vt.length; i++) for (let j = 0; j < vt.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === vt.length - 1) || (i === vt.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        this.dat(vt[i]! + dx, vt[j]! + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    this.veDinhDang(0);   // giữ chỗ — vẽ lại khi đã chọn mặt nạ
    if (this.v >= 7) {
      let r = this.v;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (this.v << 12) | r;
      for (let i = 0; i < 18; i++) {
        const bit = ((b >>> i) & 1) === 1;
        const a = n - 11 + (i % 3), c = Math.floor(i / 3);
        this.dat(a, c, bit);
        this.dat(c, a, bit);
      }
    }
  }
  veDinhDang(mask: number) {
    const b = bitDinhDang(mask), n = this.n;
    const bit = (i: number) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) this.dat(8, i, bit(i));
    this.dat(8, 7, bit(6));
    this.dat(8, 8, bit(7));
    this.dat(7, 8, bit(8));
    for (let i = 9; i < 15; i++) this.dat(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) this.dat(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) this.dat(8, n - 15 + i, bit(i));
    this.dat(8, n - 8, true);   // ô tối cố định
  }
  datDuLieu(tu: number[]) {
    const n = this.n;
    let i = 0;
    for (let phai = n - 1; phai >= 1; phai -= 2) {
      if (phai === 6) phai = 5;
      const len = ((phai + 1) & 2) === 0;
      for (let k = 0; k < n; k++) for (let j = 0; j < 2; j++) {
        const x = phai - j, y = len ? n - 1 - k : k;
        if (this.chucNang[y]![x] || i >= tu.length * 8) continue;
        this.o[y]![x] = ((tu[i >>> 3]! >>> (7 - (i & 7))) & 1) === 1;
        i++;
      }
    }
  }
  apMask(m: number) {
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) {
      if (this.chucNang[y]![x]) continue;
      let dao: boolean;
      switch (m) {
        case 0: dao = (x + y) % 2 === 0; break;
        case 1: dao = y % 2 === 0; break;
        case 2: dao = x % 3 === 0; break;
        case 3: dao = (x + y) % 3 === 0; break;
        case 4: dao = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: dao = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: dao = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        default: dao = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
      }
      if (dao) this.o[y]![x] = !this.o[y]![x];
    }
  }
  /** Điểm phạt N1 (chuỗi ≥ 5 cùng màu), N2 (khối 2×2), N3 (mẫu giống mắt định vị 1:1:3:1:1 cạnh 4 ô sáng,
   *  kể cả vùng sáng ngoài viền), N4 (lệch tỉ lệ tối/sáng khỏi 50%). */
  diemPhat(): number {
    const n = this.n;
    let diem = 0;
    const theoTruc = (lay: (i: number, j: number) => boolean) => {
      for (let i = 0; i < n; i++) {
        let mau = false, dai = 0;
        const ls = [0, 0, 0, 0, 0, 0, 0];
        const ghiLs = (d: number) => { if (ls[0] === 0) d += n; ls.pop(); ls.unshift(d); };
        const demMat = () => {
          const k = ls[1]!;
          const loi = k > 0 && ls[2] === k && ls[3] === k * 3 && ls[4] === k && ls[5] === k;
          return (loi && ls[0]! >= k * 4 && ls[6]! >= k ? 1 : 0) + (loi && ls[6]! >= k * 4 && ls[0]! >= k ? 1 : 0);
        };
        for (let j = 0; j < n; j++) {
          if (lay(i, j) === mau) {
            dai++;
            if (dai === 5) diem += 3;
            else if (dai > 5) diem++;
          } else {
            ghiLs(dai);
            if (!mau) diem += demMat() * 40;
            mau = lay(i, j);
            dai = 1;
          }
        }
        if (mau) { ghiLs(dai); dai = 0; }
        ghiLs(dai + n);
        diem += demMat() * 40;
      }
    };
    theoTruc((i, j) => this.o[i]![j]!);   // hàng
    theoTruc((i, j) => this.o[j]![i]!);   // cột
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
      const c = this.o[y]![x];
      if (c === this.o[y]![x + 1] && c === this.o[y + 1]![x] && c === this.o[y + 1]![x + 1]) diem += 3;
    }
    let toi = 0;
    for (const h of this.o) for (const c of h) if (c) toi++;
    const tong = n * n;
    diem += (Math.ceil(Math.abs(toi * 20 - tong * 10) / tong) - 1) * 10;
    return diem;
  }
}

/** Mã hoá chuỗi (UTF-8) hoặc byte thành QR mức M. Lỗi khi quá dung lượng phiên bản tối đa (mặc định 10). */
export function maHoaQr(noiDung: string | Uint8Array, tuyChon: { phienBanToiDa?: number; mask?: number } = {}): MaQr {
  const du_lieu = typeof noiDung === "string" ? utf8(noiDung) : noiDung;
  const toiDa = Math.min(tuyChon.phienBanToiDa ?? PHIEN_BAN_TOI_DA, PHIEN_BAN_TOI_DA);
  let v = 1;
  while (v <= toiDa && du_lieu.length > dungLuongByte(v)) v++;
  if (v > toiDa) throw new RangeError(`QR: ${du_lieu.length} byte vượt dung lượng phiên bản ${toiDa} (tối đa ${dungLuongByte(toiDa)} byte)`);

  const mt = new MaTran(v);
  mt.veMauChucNang();
  mt.datDuLieu(danXen(dongGoi(du_lieu, v), v));

  let mask = tuyChon.mask ?? -1;
  if (mask < 0 || mask > 7) {
    let tot = Infinity;
    for (let m = 0; m < 8; m++) {
      mt.apMask(m);
      mt.veDinhDang(m);
      const d = mt.diemPhat();
      if (d < tot) { tot = d; mask = m; }
      mt.apMask(m);   // XOR lần hai = gỡ mặt nạ
    }
  }
  mt.apMask(mask);
  mt.veDinhDang(mask);
  return { phienBan: v, mask, kichThuoc: mt.n, o: mt.o };
}

/** Đường SVG (mỗi ô = 1 đơn vị, gộp ô tối liền nhau theo hàng), đã chừa vùng yên tĩnh `le` ô quanh mã.
 *  Dùng với viewBox="0 0 {kichThuoc + 2·le} {kichThuoc + 2·le}". */
export function duongQr(qr: MaQr, le = 4): string {
  const p: string[] = [];
  qr.o.forEach((hang, y) => {
    for (let x = 0; x < hang.length;) {
      if (!hang[x]) { x++; continue; }
      let d = 1;
      while (x + d < hang.length && hang[x + d]) d++;
      p.push(`M${x + le} ${y + le}h${d}v1h-${d}z`);
      x += d;
    }
  });
  return p.join("");
}

/** Vẽ QR lên canvas 2D: (x, y) góc trên trái của ô mã đầu tiên (không gồm vùng yên tĩnh), `canh` = cạnh mã (px). */
export function veQrCanvas(
  ctx: CanvasRenderingContext2D, qr: MaQr, x: number, y: number, canh: number, mauToi: string,
): void {
  const o = canh / qr.kichThuoc;
  ctx.fillStyle = mauToi;
  qr.o.forEach((hang, r) => {
    for (let c = 0; c < hang.length;) {
      if (!hang[c]) { c++; continue; }
      let d = 1;
      while (c + d < hang.length && hang[c + d]) d++;
      // Phủ chồng 0,5 px để không lộ khe giữa ô khi cạnh ô không tròn pixel.
      ctx.fillRect(x + c * o, y + r * o, d * o + 0.5, o + 0.5);
      c += d;
    }
  });
}
