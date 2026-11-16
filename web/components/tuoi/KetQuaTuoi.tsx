// TDG-1 — hiển thị kết quả (engine tính): tuổi làm nhà / cưới, hướng xấu theo năm (bàn 9 cung), tuổi xông đất.
// Dùng được cả ở máy chủ (trang SEO) lẫn trình duyệt (công cụ). Lời lẽ trung tính, không doạ.
// EN-ALL GĐ 8: `ngonNgu` (mặc định "vi" — HTML bản Việt không đổi) chọn chữ ở lib/chu/nam-tuoi.ts; tên MÃ (hướng, chi, nạp âm)
// hiện qua `ten_hien` của engine; link chỉ tới trang đã mở bản Anh.
import Link from "@/components/khung/Lien";
import { CalendarHeart, Compass, Home, Sparkles, Users } from "lucide-react";
import type { HanNam, LamNha, SaoHan, XongDat } from "@/lib/tuoi-dan-gian";
import { NAM_BANG_TU, duongHanNam, duongLamNha, duongLamNhaNam, duongXongDat, duongXongDatNam } from "@/lib/tuoi-dan-gian";
import { chuNamTuoi, lienNN, ngayNN } from "@/lib/chu/nam-tuoi";
import { tenTheo, type TenHien } from "@/lib/ten-hien";

type NN = "vi" | "en";
/** Chữ + tên + link theo ngôn ngữ cho một khối kết quả. */
function bo(ngonNgu: NN, th?: TenHien | null) {
  const t = chuNamTuoi(ngonNgu);
  return { ...t, ten: tenTheo(th, t.en), L: (d: string) => lienNN(t.en, d) };
}

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

export function BangHanNam({ h, gon = false, ngonNgu = "vi" }: { h: HanNam; gon?: boolean; ngonNgu?: NN }) {
  const { c, p, ten, L } = bo(ngonNgu, h.ten_hien);
  const theo = Object.fromEntries((h.phi_tinh ?? []).map((x) => [x.cung, x]));
  const canTranh = new Set(h.huong_tranh.filter((x) => x.ma === "ngu_hoang" || x.ma === "nhi_hac").map((x) => x.phuong));
  return (
    <section aria-labelledby={`han-nam-${h.nam}`} className="bau-troi p-5 sm:p-6" data-testid="han-nam">
      <h2 id={`han-nam-${h.nam}`} className="inline-flex items-center gap-2 text-xl"><Compass className="size-5 text-gold" aria-hidden />
        {p("kq.han_tieu_de", { can_chi: h.can_chi, nam: h.nam })}</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,17rem)_1fr]">
        <div className="grid grid-cols-3 content-start gap-1.5 self-start" role="table" aria-label={c("kq.han_aria", { nam: h.nam })}>
          {LUOI.flat().map((c) => {
            const x = theo[c]!;
            const xau = x.sao === 5 || x.sao === 2;
            return (
              <div key={c} role="cell" title={x.y_nghia ?? undefined}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-center ${xau ? "border-cinnabar/50 bg-cinnabar/10" : c === "Trung cung" ? "border-gold/40 bg-gold/10" : "border-line/70 bg-bg/40"}`}>
                <span className={`font-serif text-2xl ${xau ? "text-cinnabar" : "text-gold"}`}>{x.sao}</span>
                <span className="text-[0.7rem] leading-tight text-fg-muted">{ten("huong", x.phuong)}</span>
                <span className="text-[0.65rem] leading-tight text-fg-muted">{x.ten_sao}</span>
              </div>
            );
          })}
        </div>
        <ul className="space-y-2 text-sm">
          {h.huong_tranh.map((x) => (
            <li key={x.ma} className="rounded-xl border border-line/70 bg-bg/40 p-3">
              <b className={canTranh.has(x.phuong) && (x.ma === "ngu_hoang" || x.ma === "nhi_hac") ? "text-cinnabar" : "text-gold"}>{x.ten}</b>
              {" — "}<b>{ten("huong", x.phuong)}</b>{x.chi?.length ? ` (${x.chi.map((y) => ten("chi", y)).join(", ")})` : ""}
              {!gon && <span className="block text-fg-muted">{x.nghia}</span>}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-fg-muted">{h.moc}{" " + c("kq.han_chu_ban")}{" "}
        {gon && L(duongHanNam(h.nam)) && <Link href={L(duongHanNam(h.nam))!} className="text-gold underline">{p("kq.han_chi_tiet", { nam: h.nam })}</Link>}</p>
    </section>
  );
}

/** AUD-Q1 (2026-11-03): trên TRANG THEO TUỔI (SEO), khối chung của cả năm (bàn 9 cung, mùng 1 Tết) giống hệt ở 46 trang →
 *  chỉ giữ một câu tóm + link về trang năm; công cụ (trình duyệt) vẫn hiện đầy đủ. */
function HanNamGon({ h, ngonNgu }: { h: HanNam; ngonNgu: NN }) {
  const { c, p, ten, L } = bo(ngonNgu, h.ten_hien);
  return (
    <p className="glass rounded-2xl p-4 text-sm text-fg-muted" data-testid="han-nam-gon">
      {p("kq.han_gon", { can_chi: h.can_chi, nam: h.nam })}{" "}
      {h.huong_tranh.map((x) => c("kq.han_gon_muc", { ten: x.ten, phuong: ten("huong", x.phuong) })).join(" · ")}.{" "}
      {L(duongHanNam(h.nam)) && <Link href={L(duongHanNam(h.nam))!} className="text-gold underline">{p("kq.han_gon_link", { nam: h.nam })}</Link>}
    </p>
  );
}

/** AUD-P1: 10 năm tới của CHÍNH tuổi này (dữ kiện riêng của trang — engine tính bằng đúng hàm công cụ từng năm). */
function MuoiNam({ d, ngonNgu }: { d: LamNha; ngonNgu: NN }) {
  const { c, p, L } = bo(ngonNgu, d.ten_hien);
  const ds = d.muoi_nam ?? [];
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="muoi-nam" data-testid="muoi-nam">
      <h2 id="muoi-nam" className="text-lg">{p("kq.mn_tieu_de", { can_chi: d.can_chi, nam_sinh: d.nam_sinh })}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead className="text-fg-faint"><tr><th className="py-1.5 pr-3 font-normal">{c("kq.cot_nam")}</th><th className="py-1.5 pr-3 font-normal">{c("kq.cot_tuoi_mu")}</th>
            <th className="py-1.5 pr-3 font-normal">{c("kq.cot_kim_lau")}</th><th className="py-1.5 pr-3 font-normal">{c("kq.cot_hoang_oc")}</th><th className="py-1.5 pr-3 font-normal">{c("kq.cot_tam_tai")}</th><th className="py-1.5 font-normal">{c("kq.cot_lam_nha")}</th></tr></thead>
          <tbody>
            {ds.map((x) => (
              <tr key={x.nam} className="border-t border-line/50">
                <td className="py-1.5 pr-3"><Link href={L(duongLamNha(x.nam, d.nam_sinh))!} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nam}</Link> <span className="text-fg-faint">{x.can_chi}</span></td>
                <td className="py-1.5 pr-3">{x.tuoi_mu}</td>
                <td className="py-1.5 pr-3">{x.kim_lau ?? "—"}</td>
                <td className="py-1.5 pr-3">{x.hoang_oc}</td>
                <td className="py-1.5 pr-3">{x.tam_tai ? c("c.nam_thu", { n: x.tam_tai }) : "—"}</td>
                <td className={`py-1.5 ${x.thuan ? "text-jade" : "text-moon"}`}>{x.thuan ? c("kq.thuan") : c("kq.can_nhac")}
                  {x.nam_tuoi && <span className="block text-xs text-fg-faint" data-testid="muoi-nam-tuoi">{x.nam_tuoi === "trung" ? c("kq.nam_tuoi_trung") : c("kq.nam_tuoi_xung")}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ds.some((x) => x.nam_tuoi) && <p className="mt-2 text-xs text-fg-muted">{c("kq.mn_chu_thich")}</p>}
    </section>
  );
}

/** AUD-P1: tuổi hợp xông đất cho CÁC TẾT KẾ TIẾP của chính gia chủ này. */
function TetToi({ d, ngonNgu }: { d: XongDat; ngonNgu: NN }) {
  const { c, p, L } = bo(ngonNgu, d.ten_hien);
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="tet-toi" data-testid="tet-toi">
      <h2 id="tet-toi" className="text-lg">{p("kq.tt_tieu_de", { can_chi: d.chu.can_chi, nam_sinh: d.chu.nam_sinh })}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {(d.tet_toi ?? []).map((t) => (
          <li key={t.nam}>
            <Link href={L(duongXongDat(t.nam, d.chu.nam_sinh))!} className="text-gold underline decoration-gold/40 underline-offset-2">{p("kq.tt_tet", { nam: t.nam, can_chi: t.can_chi })}</Link>:{" "}
            <span className="text-fg-muted">{t.tuoi.length ? t.tuoi.map((x) => `${x.nam_sinh} (${x.can_chi})`).join(", ") : c("kq.tt_chua_thay")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KetQuaLamNha({ d, trangTuoi = false, ngonNgu = "vi" }: { d: LamNha; trangTuoi?: boolean; ngonNgu?: NN }) {
  const { c, p, L } = bo(ngonNgu, d.ten_hien);
  const thuan = d.ket_luan.ma === "thuan";
  return (
    <div className="space-y-4" data-testid="ket-qua-lam-nha">
      <div className="bau-troi p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted"><Home className="size-4 text-gold" aria-hidden />
              {p("kq.ln_dau", { can_chi: d.can_chi, nam_sinh: d.nam_sinh, can_chi_nam: d.can_chi_nam_xay, nam: d.nam_xay })}</p>
            <p className="mt-1 font-serif text-4xl"><span className="text-gradient-gold">{d.tuoi_mu}</span>
              <span className="text-2xl text-fg-muted">{c("kq.tuoi_mu")}</span></p>
          </div>
          <span data-testid="ket-luan"
            className={`rounded-full px-3 py-1 text-sm font-semibold ${thuan ? "nhan-sang bg-gold/15 text-gold" : "border border-moon/50 bg-moon/10 text-moon"}`}>
            {thuan ? c("kq.ln_thuan") : c("kq.ln_tranh")}</span>
        </div>
        <p className="mt-3">{d.ket_luan.chu}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Nhan tot={!d.kim_lau} testId="nhan-kim-lau">{d.kim_lau ? d.kim_lau.ten : c("kq.khong_kim_lau")}</Nhan>
          <Nhan tot={d.hoang_oc.tot} testId="nhan-hoang-oc">{p("kq.hoang_oc", { ten: d.hoang_oc.ten })}</Nhan>
          <Nhan tot={!d.tam_tai} testId="nhan-tam-tai">{d.tam_tai ? c("kq.tam_tai_n", { n: d.tam_tai.nam_thu }) : c("kq.khong_tam_tai")}</Nhan>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-fg-muted">
          {d.kim_lau && <li><b className="text-fg">{d.kim_lau.ten}:</b> {d.kim_lau.nghia}.</li>}
          <li><b className="text-fg">{d.hoang_oc.ten}:</b> {d.hoang_oc.nghia}.</li>
          <li><b className="text-fg">{c("kq.tam_tai_ten")}</b>{p("kq.tam_tai_cac_nam", { chi: d.can_chi.split(" ")[1] ?? "", nam: d.cac_nam_tam_tai.join(", ") })}</li>
        </ul>
        {d.uoc_luong_nam_sinh && <p className="mt-3 text-xs text-fg-muted">{c("kq.uoc_luong_ln")}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="glass rounded-2xl p-5" aria-labelledby="nam-thuan">
          <h2 id="nam-thuan" className="inline-flex items-center gap-2 text-lg"><CalendarHeart className="size-5 text-jade" aria-hidden />{c("kq.nam_thuan")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2" data-testid="nam-thuan">
            {d.nam_thuan.map((n) => (
              <li key={n.nam}><Link href={L(duongLamNha(n.nam, d.nam_sinh))!} className="vung-cham inline-flex rounded-full border border-jade/40 px-3 py-1 text-sm text-jade hover:bg-jade/10">
                {p("kq.nam_thuan_muc", { nam: n.nam, can_chi: n.can_chi, tuoi: n.tuoi_mu })}</Link></li>
            ))}
          </ul>
        </section>
        <section className="glass rounded-2xl p-5" aria-labelledby="cuoi-hoi">
          <h2 id="cuoi-hoi" className="inline-flex items-center gap-2 text-lg"><Sparkles className="size-5 text-gold" aria-hidden />{c("kq.cuoi_hoi")}</h2>
          <p className="mt-2 text-sm">{d.cuoi_hoi}</p>
        </section>
      </div>
      {d.cach_dan_gian && <p className="glass rounded-2xl p-4 text-sm text-fg-muted" data-nosnippet="">{d.cach_dan_gian}</p>}
      {trangTuoi && d.muoi_nam?.length ? <MuoiNam d={d} ngonNgu={ngonNgu} /> : null}
      {trangTuoi ? <HanNamGon h={{ ...d.han_nam, ten_hien: d.han_nam.ten_hien ?? d.ten_hien }} ngonNgu={ngonNgu} /> : <BangHanNam h={{ ...d.han_nam, ten_hien: d.han_nam.ten_hien ?? d.ten_hien }} gon ngonNgu={ngonNgu} />}
      <p className="text-xs text-fg-muted">{d.cach_tinh ?? (d.nam_xay >= NAM_BANG_TU && L(duongLamNhaNam(d.nam_xay)) ? <>{c("kq.cach_tinh_ln") + " "}<Link href={L(duongLamNhaNam(d.nam_xay))!} className="underline">{p("kq.cach_tinh_ln_link", { nam: d.nam_xay })}</Link>.</> : null)} {d.luu_y}</p>
    </div>
  );
}

export function KetQuaXongDat({ d, trangTuoi = false, ngonNgu = "vi" }: { d: XongDat; trangTuoi?: boolean; ngonNgu?: NN }) {
  const { c, p, ten, L, en } = bo(ngonNgu, d.ten_hien);
  const tet = ngayNN(en, d.mung_mot.ngay);
  const hoangLich = L(`/xem-ngay-tot/${d.mung_mot.ngay}`), bangNam = d.nam.nam >= NAM_BANG_TU ? L(duongXongDatNam(d.nam.nam)) : null;
  const hd = d.mung_mot.hoang_dao ? c("kq.hoang_dao") : c("kq.hac_dao");
  return (
    <div className="space-y-4" data-testid="ket-qua-xong-dat">
      <div className="bau-troi p-5 sm:p-7">
        <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted"><Users className="size-4 text-gold" aria-hidden />
          {p("kq.xd_dau", { can_chi: d.chu.can_chi, nam_sinh: d.chu.nam_sinh, can_chi_nam: d.nam.can_chi })}</p>
        <h2 className="mt-2 text-2xl">{c("kq.xd_tuoi_hop")}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="tuoi-hop">
          {d.tuoi_hop.map((x, i) => (
            <li key={x.nam_sinh} className={`rounded-xl border p-3 ${i < 3 ? "border-gold/40 bg-gold/[0.06]" : "border-line/70 bg-bg/40"}`}>
              <p><b className="font-serif text-xl text-gold">{x.nam_sinh}</b> <span className="text-fg">· {x.can_chi}</span>
                <span className="block text-xs text-fg-muted">{ten("nap_am", x.nap_am)}</span></p>
              <p className="mt-1 text-sm text-fg-muted">{x.ly_do.join(" · ")}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm"><span className="text-moon">{c("kq.xd_nen_tranh")}</span> {d.nen_tranh.join(" · ")}.</p>
        {d.uoc_luong_nam_sinh && <p className="mt-2 text-xs text-fg-muted">{c("kq.uoc_luong")}</p>}
      </div>
{trangTuoi ? (
        <p className="glass rounded-2xl p-4 text-sm text-fg-muted" data-testid="mung-mot-gon">
          {p("kq.mm_gon", { tet, can_chi: d.mung_mot.can_chi, hd })}{" "}
          {hoangLich && <Link href={hoangLich} className="text-gold underline">{c("kq.mm_hoang_lich")}</Link>}
          {bangNam && <>{hoangLich ? " · " : ""}<Link href={bangNam} className="text-gold underline">{p("kq.mm_bang", { nam: d.nam.nam })}</Link></>}
        </p>
      ) : (
            <section className="glass rounded-2xl p-5" aria-labelledby="mung-mot">
        <h2 id="mung-mot" className="text-lg">{p("kq.mm_tieu_de", { tet, can_chi: d.mung_mot.can_chi, hd, than: d.mung_mot.than ?? "" })}</h2>
        <p className="mt-2 text-sm"><span className="text-fg-muted">{c("kq.mm_gio")}</span> {(d.mung_mot.gio_hoang_dao ?? []).map((g) => `${ten("chi", g.chi)} (${g.khung})`).join(" · ")}</p>
        <p className="mt-1 text-sm"><span className="text-fg-muted">{c("kq.mm_huong")}</span>{p("kq.mm_huong_gia_tri", { hy: ten("huong", d.mung_mot.huong?.hy_than ?? ""), tai: ten("huong", d.mung_mot.huong?.tai_than ?? "") })}</p>
        {hoangLich && <Link href={hoangLich} className="mt-2 inline-block text-sm text-gold underline">{c("kq.mm_hoang_lich")}</Link>}
      </section>
      )}
      {trangTuoi && d.tet_toi?.length ? <TetToi d={d} ngonNgu={ngonNgu} /> : null}
      <p className="text-xs text-fg-muted">{d.cach_chon} {d.luu_y}</p>
    </div>
  );
}

// ---- MT-ĐS B3 — sao hạn theo tuổi: tục lệ, lời bằng việc nên làm, câu cố định; không đèn / hướng lễ / vật phẩm.
export function KetQuaSaoHan({ d, ngonNgu = "vi" }: { d: SaoHan; ngonNgu?: NN }) {
  const { c, p } = bo(ngonNgu, d.ten_hien);
  const gioi = d.nguoi.gioi_tinh === "nam" ? c("kq.gioi_nam") : c("kq.gioi_nu");
  return (
    <div className="space-y-4" data-testid="ket-qua-sao-han">
      <div className="bau-troi p-5 sm:p-7">
        <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted"><Sparkles className="size-4 text-gold" aria-hidden />
          {p("kq.sh_dau", { gioi, can_chi: d.nguoi.can_chi, nam_sinh: d.nguoi.nam_sinh, can_chi_nam: d.nam.can_chi, nam: d.nam.nam, tuoi: d.tuoi_mu })}</p>
        {d.sao ? (
          <>
            <h2 className="mt-2 font-serif text-3xl"><span className="text-gradient-gold">{p("kq.sh_sao", { ten: d.sao.ten })}</span>
              {d.han && <span className="text-xl text-fg-muted">{p("kq.sh_han", { ten: d.han.ten })}</span>}</h2>
            <p className="mt-3 leading-relaxed">{d.sao.nghia}</p>
            {d.han && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{d.han.nghia}</p>}
            <p className="mt-4 text-sm font-semibold text-fg">{c("kq.sh_viec")}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg-muted" data-testid="sao-han-viec">{d.sao.viec.map((v) => <li key={v}>{v}</li>)}</ul>
            <p className="mt-3 text-sm italic text-fg-muted">{p("kq.sh_tu_soi", { cau: d.sao.tu_soi })}</p>
            {(d.kim_lau || d.tam_tai) && (
              <p className="mt-3 text-xs text-fg-muted">{p("kq.sh_cung_nam", { ds: [d.kim_lau, d.tam_tai ? c("kq.tam_tai_n", { n: d.tam_tai }) : null].filter(Boolean).join(" · ") })}</p>
            )}
          </>
        ) : <p className="mt-3">{c("kq.sh_duoi_10")}</p>}
        {d.uoc_luong_nam_sinh && <p className="mt-3 text-xs text-fg-muted">{c("kq.uoc_luong")}</p>}
      </div>
      <p className="glass rounded-2xl p-4 text-sm text-fg-muted" data-nosnippet="">{d.cau_co_dinh}</p>
      <p className="text-xs text-fg-muted">{d.cach_tinh} {d.luu_y}</p>
    </div>
  );
}
