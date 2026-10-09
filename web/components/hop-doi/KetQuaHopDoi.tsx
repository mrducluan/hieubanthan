"use client";
import { motion, useReducedMotion } from "motion/react";
import { Ban, Handshake, HeartHandshake, MessagesSquare, Moon, Sparkles, Target, Zap } from "lucide-react";
import { EASE } from "@/lib/chuyen-dong";
import { cn } from "@/lib/utils";

export interface VaiT {
  so: number; vai_cua_ban: string;
  vai?: string; can?: string; tranh?: string; cach_noi?: string;
}
export interface KetQuaHopDoiT {
  engine_version: string;
  a: { duong_doi: number; tu_khoa: string | null };
  b: { duong_doi: number; tu_khoa: string | null };
  cac_cap: {
    vi_tri: string; ten_vi_tri: string; so_a: number; so_b: number; cap: string;
    nghia: { hoa: string; va: string; cung_lam: string } | null;
  }[];
  /** TS-SAU — có từ khi engine luận theo loại quan hệ. */
  quan_he?: { ma: string; ten: string; tieu_de: string; trong_tam: string; cau_hoi_chung: string };
  trong_vai?: { a: VaiT; b: VaiT };
  nhip_nam?: {
    nam: number; cach_doc: string;
    a: { so: number; chu_de: string | null; y_nghia: string | null };
    b: { so: number; chu_de: string | null; y_nghia: string | null };
  } | null;
  cach_doc: string;
  nguon: { nguon?: string | null; trang_thai?: string | null };
}

const TEN_VAI: Record<string, string> = { nguoi_yeu: "người yêu", ban_be: "bạn", dong_nghiep: "người cùng làm việc", sep: "sếp", gia_dinh: "người thân" };

function Cau({ so, ten, tuKhoa, tre }: { so: number; ten: string; tuKhoa: string | null; tre: number }) {
  const giam = useReducedMotion();
  return (
    <motion.div className="flex w-28 flex-col items-center text-center sm:w-36"
      {...(giam ? {} : { initial: { opacity: 0, scale: 0.7 }, animate: { opacity: 1, scale: 1 }, transition: { delay: tre, duration: 0.7, ease: EASE } })}>
      <div className="relative grid size-24 place-items-center rounded-full border border-gold/50 bg-gold/10 shadow-glow sm:size-28">
        {!giam && <motion.span className="absolute inset-0 rounded-full border border-gold/30" animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 3.2, repeat: Infinity, delay: tre }} aria-hidden />}
        <span className="text-gradient-gold font-serif text-5xl">{so}</span>
      </div>
      <p className="mt-3 font-serif text-lg leading-tight">{ten}</p>
      {tuKhoa && <p className="mt-0.5 text-xs text-fg-muted">{tuKhoa}</p>}
    </motion.div>
  );
}

function TheVai({ v, tieuDe, tre }: { v: VaiT; tieuDe: string; tre: number }) {
  const giam = useReducedMotion();
  const dong = [
    { Icon: Sparkles, nhan: "Thường thể hiện", noi: v.vai, mau: "text-gold" },
    { Icon: Target, nhan: "Cần", noi: v.can, mau: "text-jade" },
    { Icon: Ban, nhan: "Nên tránh", noi: v.tranh, mau: "text-cinnabar" },
    { Icon: MessagesSquare, nhan: "Cách nói chuyện hợp", noi: v.cach_noi, mau: "text-moon" },
  ].filter((d) => d.noi);
  return (
    <motion.article className="glass rounded-2xl p-5" data-testid="the-vai"
      {...(giam ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: tre, duration: 0.5, ease: EASE } })}>
      <header className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full border border-gold/50 font-serif text-xl text-gold">{v.so}</span>
        <div>
          <h3 className="text-lg leading-tight">{tieuDe}</h3>
          <p className="text-xs text-fg-faint">trong vai {TEN_VAI[v.vai_cua_ban] ?? v.vai_cua_ban} · số Đường đời {v.so}</p>
        </div>
      </header>
      <dl className="mt-4 space-y-3 text-[0.95rem]">
        {dong.map(({ Icon, nhan, noi, mau }) => (
          <div key={nhan} className="flex gap-3">
            <dt><Icon className={cn("mt-1 size-4", mau)} aria-label={nhan} /></dt>
            <dd><b className={mau}>{nhan}.</b> {noi}</dd>
          </div>
        ))}
      </dl>
    </motion.article>
  );
}

function NhipNam({ nn, tenA, tenB }: { nn: NonNullable<KetQuaHopDoiT["nhip_nam"]>; tenA: string; tenB: string }) {
  const o = (ten: string, x: { so: number; chu_de: string | null; y_nghia: string | null }) => (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="grid size-16 place-items-center rounded-full border border-moon/50 bg-moon/10 font-serif text-3xl text-moon">{x.so}</div>
      <p className="mt-2 font-serif text-lg">{ten}</p>
      {x.chu_de && <p className="text-sm text-moon">{x.chu_de}</p>}
      {x.y_nghia && <p className="mt-1 max-w-xs text-xs text-fg-muted">{x.y_nghia}</p>}
    </div>
  );
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="nhip-nam" data-testid="nhip-nam">
      <p className="eyebrow flex items-center gap-1.5 text-moon"><Moon className="size-3.5" aria-hidden /> Nhịp năm {nn.nam}</p>
      <h3 id="nhip-nam" className="mt-1 text-xl">Hai người đang ở năm cá nhân nào</h3>
      <div className="mt-4 flex items-start gap-4">{o(tenA, nn.a)}<div className="mt-8 h-px w-10 shrink-0 bg-moon/40" aria-hidden />{o(tenB, nn.b)}</div>
      <p className="mt-4 text-center text-xs text-fg-faint">{nn.cach_doc}</p>
    </section>
  );
}

// Hai "vì sao" nối bằng một sợi sáng; đọc theo loại quan hệ: mỗi người trong vai của mình, nhịp năm, rồi từng cặp số.
// Không có điểm số hợp/khắc.
export function KetQuaHopDoi({ kq, tenA, tenB }: { kq: KetQuaHopDoiT; tenA: string; tenB: string }) {
  const giam = useReducedMotion();
  return (
    <div className="space-y-8" data-testid="ket-qua-hop-doi">
      {kq.quan_he && (
        <header className="text-center">
          <p className="eyebrow" data-testid="ten-quan-he">{kq.quan_he.ten}</p>
          <h2 className="mt-1 text-3xl sm:text-4xl">{kq.quan_he.tieu_de}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-fg-muted">{kq.quan_he.trong_tam}</p>
        </header>
      )}
      <div className="flex items-center justify-center gap-2 sm:gap-6">
        <Cau so={kq.a.duong_doi} ten={tenA} tuKhoa={kq.a.tu_khoa} tre={0} />
        <motion.div className="relative h-px w-12 origin-left bg-gradient-to-r from-gold/0 via-gold to-gold/0 sm:w-28" aria-hidden
          {...(giam ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { delay: 0.35, duration: 0.6, ease: EASE } })}>
          <HeartHandshake className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-gold" />
        </motion.div>
        <Cau so={kq.b.duong_doi} ten={tenB} tuKhoa={kq.b.tu_khoa} tre={0.2} />
      </div>
      <p className="mx-auto max-w-xl text-center text-sm text-fg-muted">{kq.cach_doc}</p>

      {kq.trong_vai && (
        <section aria-label="Mỗi người trong vai của mình" className="grid gap-4 md:grid-cols-2">
          <TheVai v={kq.trong_vai.b} tieuDe={`Điều nên biết về ${tenB}`} tre={0.1} />
          <TheVai v={kq.trong_vai.a} tieuDe={`Điều ${tenB} nên biết về ${tenA}`} tre={0.2} />
        </section>
      )}

      {kq.nhip_nam && <NhipNam nn={kq.nhip_nam} tenA={tenA} tenB={tenB} />}

      <div className="grid gap-4 md:grid-cols-2">
        {kq.cac_cap.map((c) => (
          <article key={c.vi_tri} className="glass rounded-2xl p-5" data-testid={`cap-${c.vi_tri}`}>
            <header className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl">{c.ten_vi_tri}</h3>
              <span className="font-serif text-lg text-gold">{c.so_a} × {c.so_b}</span>
            </header>
            {c.nghia ? (
              <dl className="mt-4 space-y-3 text-[0.95rem]">
                <div className="flex gap-3"><dt><Sparkles className="mt-1 size-4 text-jade" aria-label="Điểm hoà" /></dt><dd><b className="text-jade">Điểm hoà.</b> {c.nghia.hoa}</dd></div>
                <div className="flex gap-3"><dt><Zap className="mt-1 size-4 text-cinnabar" aria-label="Điểm va" /></dt><dd><b className="text-cinnabar">Điểm va.</b> {c.nghia.va}</dd></div>
                <div className="flex gap-3"><dt><Handshake className="mt-1 size-4 text-gold" aria-label="Cùng làm" /></dt><dd><b className="text-gold">Cùng làm.</b> {c.nghia.cung_lam}</dd></div>
              </dl>
            ) : <p className="mt-3 text-sm text-fg-faint">Kho tri thức chưa có nghĩa cho cặp {c.cap}.</p>}
          </article>
        ))}
      </div>

      {kq.quan_he && (
        <p className="mx-auto max-w-2xl rounded-2xl border border-moon/30 bg-moon/[0.06] px-5 py-4 text-center font-serif text-lg italic text-moon">
          “{kq.quan_he.cau_hoi_chung}”
        </p>
      )}
      {kq.nguon.nguon && (
        <p className="text-center text-xs text-fg-faint">
          Nguồn: {kq.nguon.nguon}{kq.nguon.trang_thai === "nhap_ai" ? " · biên soạn có AI hỗ trợ, chờ thẩm định" : ""}
        </p>
      )}
    </div>
  );
}
