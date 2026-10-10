// QT-0 — bảng điều khiển CHỈ ĐỌC (docs/KIEN-TRUC-QUAN-TRI.md). Mọi số liệu người dùng là SỐ TỔNG (hàm
// thong_ke_quan_tri, migration 0010) — trang này không đọc được hồ sơ, ngày giờ sinh của ai. Env chỉ báo đã đặt
// hay chưa, không bao giờ hiện giá trị khoá.
import type { Metadata } from "next";
import { Activity, BookOpen, ExternalLink, KeyRound, ScrollText, ShieldCheck, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri, TEN_VAI_TRO } from "@/lib/quan-tri";
import { mucLuc } from "@/lib/kien-thuc";
import { layCauHinh } from "@/lib/cau-hinh";
import { TangTruongTuan, type TuanTT } from "@/components/quan-tri/TangTruongTuan";

export const metadata: Metadata = { title: "Bảng điều khiển" };

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

interface SucKhoe { ok: boolean; engine_version?: string; khoa_engine?: boolean; ms: number }

async function sucKhoeEngine(): Promise<SucKhoe> {
  const bd = Date.now();
  try {
    const r = await fetch(`${ENGINE_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(5_000) });
    const j = r.ok ? ((await r.json()) as Omit<SucKhoe, "ms">) : null;
    return { ...(j ?? { ok: false }), ms: Date.now() - bd };
  } catch {
    return { ok: false, ms: Date.now() - bd };
  }
}

// Tên biến env — chỉ kiểm đã đặt chưa. Công tắc (không bí mật) thì hiện giá trị.
const ENV_BAT_BUOC = ["ENGINE_URL", "ENGINE_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "LOI_MOI_SECRET"];
const ENV_DO_LUONG = ["NEXT_PUBLIC_POSTHOG_KEY", "SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "GOOGLE_SITE_VERIFICATION"];
const CONG_TAC: [string, string][] = [["NEXT_PUBLIC_HOI_DONG_Y_COOKIE", "Hỏi đồng ý cookie khi mở trang"]];
const daDat = (k: string) => Boolean((process.env[k] ?? "").trim());

const BANG_NGOAI: [string, string][] = [
  ["Vercel", "https://vercel.com/dashboard"], ["Render", "https://dashboard.render.com"],
  ["Supabase", "https://supabase.com/dashboard/projects"], ["PostHog", "https://us.posthog.com"],
  ["Search Console", "https://search.google.com/search-console"], ["Tag Manager", "https://tagmanager.google.com"],
  ["Sentry", "https://sentry.io"], ["GitHub", "https://github.com/mrducluan/hieubanthan"],
];

const TEN_SO: Record<string, string> = {
  tai_khoan: "Tài khoản", tai_khoan_7_ngay: "Tài khoản mới 7 ngày", dang_nhap_7_ngay: "Đăng nhập 7 ngày",
  ho_so: "Hồ sơ đã lưu", sao_da_tang: "Sao đã tặng", sao_da_dung: "Sao đã dùng", loi_moi_thanh_cong: "Lời mời thành công",
  quan_tri: "Người quản trị",
};
const TEN_TRANG_THAI: Record<string, string> = { da_duyet: "Đã duyệt", nhap_ai: "Nháp AI" };

interface DongNhatKy { id: number; hanh_dong: string; doi_tuong: string | null; tao_luc: string }

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));

function Muc({ icon: Icon, tieuDe, children, className }: {
  icon: typeof Activity; tieuDe: string; children: React.ReactNode; className?: string;
}) {
  return (
    <Card className={className}>
      <h2 className="flex items-center gap-2 text-lg"><Icon className="size-4 text-gold" aria-hidden />{tieuDe}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Dong({ ten, children }: { ten: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5 text-sm last:border-0">
      <span className="min-w-0 text-fg-muted [overflow-wrap:anywhere]">{ten}</span><span className="shrink-0 whitespace-nowrap text-right">{children}</span>
    </div>
  );
}

const TenEnv = ({ k }: { k: string }) => <span className="font-mono text-xs">{k}</span>;
const CoKhong = ({ co }: { co: boolean }) => <Badge tone={co ? "jade" : "cinnabar"}>{co ? "Đã đặt" : "Chưa đặt"}</Badge>;

export default async function Page() {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;

  const [sk, ds, tk, nk, tt, thuSao] = await Promise.all([
    sucKhoeEngine(),
    mucLuc(),
    p.sb.rpc("thong_ke_quan_tri"),
    p.vaiTro === "chu_so_huu"
      ? p.sb.from("nhat_ky_quan_tri").select("id,hanh_dong,doi_tuong,tao_luc").order("tao_luc", { ascending: false }).limit(10)
      : Promise.resolve(null),
    p.sb.rpc("thong_ke_tang_truong", { p_tuan: 12 }),
    layCauHinh<boolean>("luan_giai.thu_sao"),
  ]);
  const tuan = (tt.error ? null : tt.data) as TuanTT[] | null;
  const thongKe = (tk.error ? null : tk.data) as Record<string, number> | null;
  const nhatKy = (nk && !nk.error ? nk.data : null) as DongNhatKy[] | null;

  const theoTrangThai = new Map<string, number>(), theoLoai = new Map<string, number>();
  for (const t of ds) {
    theoTrangThai.set(t.trang_thai, (theoTrangThai.get(t.trang_thai) ?? 0) + 1);
    theoLoai.set(t.loai, (theoLoai.get(t.loai) ?? 0) + 1);
  }
  const daThamDinh = ds.filter((t) => t.tham_dinh).length;

  return (
    <div data-testid="qt-tong-quan">
      <p className="eyebrow">Quản trị</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">Bảng điều khiển</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <span>{p.user.email}</span>
          <Badge tone="gold">{TEN_VAI_TRO[p.vaiTro]}</Badge>
          <Badge tone="jade"><ShieldCheck className="size-3" aria-hidden />MFA</Badge>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Đối chiếu mục tiêu: thu hút → quay lại → mời bạn → nạp Sao (docs/MUC-TIEU-TANG-TRUONG.md). Số liệu người dùng chỉ là số tổng.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Muc icon={TrendingUp} tieuDe="Tăng trưởng 12 tuần" className="md:col-span-2 lg:col-span-3">
          {tuan ? <TangTruongTuan ds={tuan} />
            : <p className="text-sm text-cinnabar">Chưa đọc được (chạy migration 0011 trên Supabase).</p>}
          <p className="mt-3 text-xs text-fg-faint">
            Search Console, GA4 và phễu sự kiện: <Link href="/quan-tri/tang-truong" className="text-gold hover:underline">Tăng trưởng</Link>.
          </p>
        </Muc>

        <Muc icon={Activity} tieuDe="Engine tính toán">
          <Dong ten="Trạng thái"><Badge tone={sk.ok ? "jade" : "cinnabar"}>{sk.ok ? "Đang chạy" : "Không trả lời"}</Badge></Dong>
          <Dong ten="Phiên bản">{sk.engine_version ?? "—"}</Dong>
          <Dong ten="Khoá engine">{sk.ok ? <CoKhong co={Boolean(sk.khoa_engine)} /> : "—"}</Dong>
          <Dong ten="Thời gian phản hồi">{sk.ms} ms</Dong>
        </Muc>

        <Muc icon={Users} tieuDe="Tài khoản & Sao">
          {thongKe
            ? Object.entries(TEN_SO).map(([k, ten]) => <Dong key={k} ten={ten}>{(thongKe[k] ?? 0).toLocaleString("vi-VN")}</Dong>)
            : <p className="text-sm text-cinnabar">Chưa đọc được thống kê.</p>}
          <p className="mt-3 text-xs text-fg-faint">Chỉ số tổng — không xem được hồ sơ của ai.</p>
        </Muc>

        <Muc icon={KeyRound} tieuDe="Cấu hình web">
          {ENV_BAT_BUOC.map((k) => <Dong key={k} ten={<TenEnv k={k} />}><CoKhong co={daDat(k)} /></Dong>)}
          {ENV_DO_LUONG.map((k) => <Dong key={k} ten={<TenEnv k={k} />}><CoKhong co={daDat(k)} /></Dong>)}
          <Dong ten={<Link href="/quan-tri/cai-dat" className="hover:text-gold">Thu Sao luận giải toàn bộ</Link>}>
            <Badge tone={thuSao ? "gold" : "muted"}>{thuSao ? "Bật" : "Tắt"}</Badge>
          </Dong>
          {CONG_TAC.map(([k, ten]) => (
            <Dong key={k} ten={ten}><Badge tone={process.env[k] === "1" ? "gold" : "muted"}>{process.env[k] === "1" ? "Bật" : "Tắt"}</Badge></Dong>
          ))}
          <p className="mt-3 text-xs text-fg-faint">Chỉ báo đã đặt hay chưa — giá trị khoá không bao giờ hiện ở đây.</p>
        </Muc>

        <Muc icon={BookOpen} tieuDe="Kho tri thức" className="md:col-span-2">
          {ds.length === 0 ? <p className="text-sm text-cinnabar">Chưa lấy được mục lục từ engine.</p> : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-3xl font-serif">{ds.length.toLocaleString("vi-VN")}</p><p className="text-xs text-fg-muted">trang kiến thức</p></div>
                <div><p className="text-3xl font-serif">{(theoTrangThai.get("da_duyet") ?? 0).toLocaleString("vi-VN")}</p><p className="text-xs text-fg-muted">đã duyệt</p></div>
                <div><p className="text-3xl font-serif">{daThamDinh.toLocaleString("vi-VN")}</p><p className="text-xs text-fg-muted">chuyên gia thẩm định</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...theoTrangThai].map(([k, n]) => <Badge key={k} tone={k === "da_duyet" ? "jade" : "moon"}>{TEN_TRANG_THAI[k] ?? k}: {n}</Badge>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...theoLoai].sort((a, b) => b[1] - a[1]).map(([k, n]) => <Badge key={k}>{k}: {n}</Badge>)}
              </div>
            </>
          )}
        </Muc>

        <Muc icon={ExternalLink} tieuDe="Bảng điều khiển ngoài">
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {BANG_NGOAI.map(([ten, url]) => (
              <li key={ten}><a href={url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{ten}</a></li>
            ))}
          </ul>
        </Muc>

        {nhatKy && (
          <Muc icon={ScrollText} tieuDe="Nhật ký quản trị" className="md:col-span-2 lg:col-span-3">
            {nhatKy.length === 0 ? <p className="text-sm text-fg-muted">Chưa có thao tác nào.</p> : (
              <ul className="text-sm">
                {nhatKy.map((d) => (
                  <li key={d.id} className="flex gap-3 border-b border-line/60 py-1.5 last:border-0">
                    <span className="w-32 shrink-0 text-fg-faint">{ngayGio(d.tao_luc)}</span>
                    <span className="font-mono text-xs leading-5">{d.hanh_dong}</span>
                    {d.doi_tuong && <span className="text-fg-muted">{d.doi_tuong}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Muc>
        )}
      </div>
    </div>
  );
}
