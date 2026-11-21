// Tải vòng 24 Sơn chuẩn từ engine (cache một promise duy nhất ở module; lỗi thì bỏ qua nhẹ nhàng, la bàn vẫn chạy).
export interface MucSon24 {
  stt: number;
  son: string;
  ky_hieu_han: string;
  quai: string;
  phuong: string;
  nguyen: string;
  am_duong: string;
  do_tam: number;
  do_tu: number;
  do_den: number;
}

let _cache: MucSon24[] | null = null;
let _dangTai: Promise<MucSon24[] | null> | null = null;

export function son24DaCo(): MucSon24[] | null {
  return _cache;
}

export function taiSon24(): Promise<MucSon24[] | null> {
  if (_cache) return Promise.resolve(_cache);
  if (!_dangTai) {
    _dangTai = fetch("/api/phongthuy/tam-yeu/la-ban-24-son")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.son_24) && d.son_24.length === 24) {
          _cache = d.son_24 as MucSon24[];
          return _cache;
        }
        return null;
      })
      .catch(() => null);
  }
  return _dangTai;
}
