// QT-2 — chuỗi theo tuần (số tổng, hàm thong_ke_tang_truong). Mỗi chỉ số một hàng cột nhỏ cùng một màu (độ lớn),
// rê chuột/chạm vào cột hiện tuần + số. Bảng số đầy đủ ở <details> bên dưới (đọc được không cần màu).
export interface TuanTT { tuan: string; tai_khoan_moi: number; ho_so_moi: number; loi_moi: number; sao_tang: number; sao_dung: number; cau_hoi: number }

const CHI_SO: [keyof Omit<TuanTT, "tuan">, string][] = [
  ["tai_khoan_moi", "Tài khoản mới"], ["ho_so_moi", "Hồ sơ lưu"], ["cau_hoi", "Câu hỏi"],
  ["loi_moi", "Lời mời thành công"], ["sao_tang", "Sao tặng"], ["sao_dung", "Sao đã dùng"],
];
const nhanTuan = (s: string) => { const [, m, d] = s.split("-"); return `${d}/${m}`; };
const so = (n: number) => n.toLocaleString("vi-VN");

export function TangTruongTuan({ ds }: { ds: TuanTT[] }) {
  const gan = ds.slice(-4);
  const tk4 = gan.reduce((a, t) => a + t.tai_khoan_moi, 0), moi4 = gan.reduce((a, t) => a + t.loi_moi, 0);
  const k = tk4 > 0 ? moi4 / tk4 : null;
  return (
    <div data-testid="qt-tang-truong-tuan">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p><span className="font-serif text-3xl">{k === null ? "—" : k.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}</span>
          <span className="ml-2 text-sm text-fg-muted">hệ số mời K (4 tuần: lời mời thành công / tài khoản mới)</span></p>
      </div>
      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHI_SO.map(([khoa, ten]) => {
          const max = Math.max(1, ...ds.map((t) => t[khoa]));
          const cuoi = ds.at(-1)?.[khoa] ?? 0;
          return (
            <div key={khoa}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-fg-muted">{ten}</span>
                <span className="text-fg">{so(cuoi)} <span className="text-xs text-fg-faint">tuần này</span></span>
              </div>
              <div className="mt-1 flex h-12 items-end gap-[2px] border-b border-line/60" role="img"
                aria-label={`${ten} theo tuần: ${ds.map((t) => `${nhanTuan(t.tuan)} ${t[khoa]}`).join(", ")}`}>
                {ds.map((t) => (
                  <span key={t.tuan} title={`Tuần ${nhanTuan(t.tuan)}: ${so(t[khoa])}`}
                    className="group relative flex h-full flex-1 items-end">
                    <span className="w-full rounded-t-[4px] bg-gold/70 group-hover:bg-gold"
                      style={{ height: t[khoa] ? `${Math.max(4, (t[khoa] / max) * 100)}%` : "0" }} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-fg-muted hover:text-fg">Bảng số theo tuần</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead><tr className="text-fg-muted"><th className="py-1 text-left font-normal">Tuần từ</th>
              {CHI_SO.map(([k, t]) => <th key={k} className="px-2 font-normal">{t}</th>)}</tr></thead>
            <tbody>{ds.map((t) => (
              <tr key={t.tuan} className="border-t border-line/60"><td className="py-1 text-left">{nhanTuan(t.tuan)}</td>
                {CHI_SO.map(([k]) => <td key={k} className="px-2">{so(t[k])}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
