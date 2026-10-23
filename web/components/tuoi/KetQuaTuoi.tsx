// TDG-1 — hiển thị kết quả (engine tính): tuổi làm nhà / cưới, hướng xấu theo năm (bàn 9 cung), tuổi xông đất.
// Dùng được cả ở máy chủ (trang SEO) lẫn trình duyệt (công cụ). Lời lẽ trung tính, không doạ.
import Link from "next/link";
import { CalendarHeart, Compass, Home, Sparkles, Users } from "lucide-react";
import type { HanNam, LamNha, XongDat } from "@/lib/tuoi-dan-gian";
import { duongHanNam, duongLamNha } from "@/lib/tuoi-dan-gian";

// Bàn 9 cung, phía Nam ở trên (như la bàn phong thuỷ truyền thống).
const LUOI = [["Tốn", "Ly", "Khôn"], ["Chấn", "Trung cung", "Đoài"], ["Cấn", "Khảm", "Càn"]];

function Nhan({ tot, children, testId }: { tot: boolean; children: React.ReactNode; testId?: string }) {
  return (
    <span data-testid={testId}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${tot ? "border-jade/50 bg-jade/10 text-jade" : "border-moon/50 bg-moon/10 text-moon"}`}>
      {children}
    </span>
  );
}

export function BangHanNam({ h, gon = false }: { h: HanNam; gon?: boolean }) {
  const theo = Object.fromEntries(h.phi_tinh.map((x) => [x.cung, x]));
  const canTranh = new Set(h.huong_tranh.filter((x) => x.ma === "ngu_hoang" || x.ma === "nhi_hac").map((x) => x.phuong));
  return (
    <section aria-labelledby={`han-nam-${h.nam}`} className="bau-troi p-5 sm:p-6" data-testid="han-nam">
      <h2 id={`han-nam-${h.nam}`} className="inline-flex items-center gap-2 text-xl"><Compass className="size-5 text-gold" aria-hidden />
        Hướng nên giữ yên năm {h.can_chi} ({h.nam})</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,17rem)_1fr]">
        <div className="grid grid-cols-3 content-start gap-1.5 self-start" role="table" aria-label={`Phi tinh năm ${h.nam}, phía Nam ở trên`}>
          {LUOI.flat().map((c) => {
            const x = theo[c]!;
            const xau = x.sao === 5 || x.sao === 2;
            return (
              <div key={c} role="cell" title={x.y_nghia ?? undefined}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-center ${xau ? "border-cinnabar/50 bg-cinnabar/10" : c === "Trung cung" ? "border-gold/40 bg-gold/10" : "border-line/70 bg-bg/40"}`}>
                <span className={`font-serif text-2xl ${xau ? "text-cinnabar" : "text-gold"}`}>{x.sao}</span>
                <span className="text-[0.7rem] leading-tight text-fg-muted">{x.phuong}</span>
                <span className="text-[0.65rem] leading-tight text-fg-muted">{x.ten_sao}</span>
              </div>
            );
          })}
        </div>
        <ul className="space-y-2 text-sm">
          {h.huong_tranh.map((x) => (
            <li key={x.ma} className="rounded-xl border border-line/70 bg-bg/40 p-3">
              <b className={canTranh.has(x.phuong) && (x.ma === "ngu_hoang" || x.ma === "nhi_hac") ? "text-cinnabar" : "text-gold"}>{x.ten}</b>
              {" — "}<b>{x.phuong}</b>{x.chi?.length ? ` (${x.chi.join(", ")})` : ""}
              {!gon && <span className="block text-fg-muted">{x.nghia}</span>}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-fg-muted">{h.moc} Bàn trên vẽ phía Nam ở trên như la bàn phong thuỷ.{" "}
        {gon && <Link href={duongHanNam(h.nam)} className="text-gold underline">Xem chi tiết năm {h.nam}</Link>}</p>
    </section>
  );
}

export function KetQuaLamNha({ d }: { d: LamNha }) {
  const thuan = d.ket_luan.ma === "thuan";
  return (
    <div className="space-y-4" data-testid="ket-qua-lam-nha">
      <div className="bau-troi p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted"><Home className="size-4 text-gold" aria-hidden />
              Tuổi {d.can_chi} ({d.nam_sinh}) · năm {d.can_chi_nam_xay} ({d.nam_xay})</p>
            <p className="mt-1 font-serif text-4xl"><span className="text-gradient-gold">{d.tuoi_mu}</span>
              <span className="text-2xl text-fg-muted"> tuổi mụ</span></p>
          </div>
          <span data-testid="ket-luan"
            className={`rounded-full px-3 py-1 text-sm font-semibold ${thuan ? "nhan-sang bg-gold/15 text-gold" : "border border-moon/50 bg-moon/10 text-moon"}`}>
            {thuan ? "Năm thuận theo tuổi" : "Dân gian thường tránh"}</span>
        </div>
        <p className="mt-3">{d.ket_luan.chu}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Nhan tot={!d.kim_lau} testId="nhan-kim-lau">{d.kim_lau ? d.kim_lau.ten : "Không Kim lâu"}</Nhan>
          <Nhan tot={d.hoang_oc.tot} testId="nhan-hoang-oc">Hoang ốc: {d.hoang_oc.ten}</Nhan>
          <Nhan tot={!d.tam_tai} testId="nhan-tam-tai">{d.tam_tai ? `Tam tai năm thứ ${d.tam_tai.nam_thu}` : "Không Tam tai"}</Nhan>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-fg-muted">
          {d.kim_lau && <li><b className="text-fg">{d.kim_lau.ten}:</b> {d.kim_lau.nghia}.</li>}
          <li><b className="text-fg">{d.hoang_oc.ten}:</b> {d.hoang_oc.nghia}.</li>
          <li><b className="text-fg">Tam tai</b> của tuổi {d.can_chi.split(" ")[1]} rơi vào các năm {d.cac_nam_tam_tai.join(", ")}.</li>
        </ul>
        {d.uoc_luong_nam_sinh && <p className="mt-3 text-xs text-fg-muted">Tính theo năm sinh âm lịch. Nếu bạn sinh trước Tết thì tuổi âm thuộc năm trước — nhập đủ ngày sinh để tính chính xác.</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="glass rounded-2xl p-5" aria-labelledby="nam-thuan">
          <h2 id="nam-thuan" className="inline-flex items-center gap-2 text-lg"><CalendarHeart className="size-5 text-jade" aria-hidden />Năm thuận gần nhất</h2>
          <ul className="mt-3 flex flex-wrap gap-2" data-testid="nam-thuan">
            {d.nam_thuan.map((n) => (
              <li key={n.nam}><Link href={duongLamNha(n.nam, d.nam_sinh)} className="vung-cham inline-flex rounded-full border border-jade/40 px-3 py-1 text-sm text-jade hover:bg-jade/10">
                {n.nam} · {n.can_chi} · {n.tuoi_mu} tuổi</Link></li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-5" aria-labelledby="cuoi-hoi">
          <h2 id="cuoi-hoi" className="inline-flex items-center gap-2 text-lg"><Sparkles className="size-5 text-gold" aria-hidden />Nếu là cưới hỏi</h2>
          <p className="mt-2 text-sm">{d.cuoi_hoi}</p>
        </section>
      </div>
      {d.cach_dan_gian && <p className="glass rounded-2xl p-4 text-sm text-fg-muted" data-nosnippet="">{d.cach_dan_gian}</p>}
      <BangHanNam h={d.han_nam} gon />
      <p className="text-xs text-fg-muted">{d.cach_tinh} {d.luu_y}</p>
    </div>
  );
}

export function KetQuaXongDat({ d }: { d: XongDat }) {
  const tet = d.mung_mot.ngay.split("-").reverse().join("/");
  return (
    <div className="space-y-4" data-testid="ket-qua-xong-dat">
      <div className="bau-troi p-5 sm:p-7">
        <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted"><Users className="size-4 text-gold" aria-hidden />
          Gia chủ tuổi {d.chu.can_chi} ({d.chu.nam_sinh}) · Tết {d.nam.can_chi}</p>
        <h2 className="mt-2 text-2xl">Tuổi hợp xông đất</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="tuoi-hop">
          {d.tuoi_hop.map((x, i) => (
            <li key={x.nam_sinh} className={`rounded-xl border p-3 ${i < 3 ? "border-gold/40 bg-gold/[0.06]" : "border-line/70 bg-bg/40"}`}>
              <p><b className="font-serif text-xl text-gold">{x.nam_sinh}</b> <span className="text-fg">· {x.can_chi}</span>
                <span className="block text-xs text-fg-muted">{x.nap_am}</span></p>
              <p className="mt-1 text-sm text-fg-muted">{x.ly_do.join(" · ")}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm"><span className="text-moon">Nên tránh:</span> {d.nen_tranh.join(" · ")}.</p>
        {d.uoc_luong_nam_sinh && <p className="mt-2 text-xs text-fg-muted">Tính theo năm sinh âm lịch; sinh trước Tết thì tuổi thuộc năm trước.</p>}
      </div>
      <section className="glass rounded-2xl p-5" aria-labelledby="mung-mot">
        <h2 id="mung-mot" className="text-lg">Mùng 1 Tết ({tet}) — ngày {d.mung_mot.can_chi}, {d.mung_mot.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} ({d.mung_mot.than})</h2>
        <p className="mt-2 text-sm"><span className="text-fg-muted">Giờ hoàng đạo:</span> {d.mung_mot.gio_hoang_dao.map((g) => `${g.chi} (${g.khung})`).join(" · ")}</p>
        <p className="mt-1 text-sm"><span className="text-fg-muted">Hướng xuất hành:</span> Hỷ thần {d.mung_mot.huong.hy_than} · Tài thần {d.mung_mot.huong.tai_than}</p>
        <Link href={`/xem-ngay-tot/${d.mung_mot.ngay}`} className="mt-2 inline-block text-sm text-gold underline">Xem đầy đủ hoàng lịch mùng 1</Link>
      </section>
      <p className="text-xs text-fg-muted">{d.cach_chon} {d.luu_y}</p>
    </div>
  );
}
