// GET /og/quan-ly?hinh=quy-trinh|ngu-hanh|tinh-huong|ke-hoach — QLNS-2: ảnh minh hoạ 1200×630 cho trang /quan-ly-nhan-su.
// Chữ trong ảnh = chữ dùng làm alt + chú thích trên trang (lib/quan-ly-hinh.ts) — một nguồn, đọc kho từ ENGINE.
// Nền giấy sáng như /og/tom-tat (đọc rõ ở Google Hình ảnh) + mã QR + hieuban.com (docs/THE-CHIA-SE.md).
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { ChanQr, CO_ANH, napPhong } from "@/lib/og-chung";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";
import { layDanhMucQuanLy } from "@/lib/quan-ly-danh-muc";
import { hinhQL, khoaHanh, laKieuHinhQL, THU_TU_SINH, type HinhQL } from "@/lib/quan-ly-hinh";
import { BieuTuongTuan, CanhBuoc, CanhTraoDoi, CanhVanPhong, NhanVatHanh } from "./canh";

export const runtime = "nodejs";

const DUONG = "/quan-ly-nhan-su";
const M = { nen: "linear-gradient(180deg, #fbf7ee 0%, #f4ecda 62%, #ece0c6 100%)", chu: "#241f38", mo: "#5f5878", vang: "#9a6f1c",
  the: "rgba(255,255,255,0.72)", vien: "rgba(154,111,28,0.38)" };
// Màu từng hành (chỉ để phân biệt, không mang nghĩa tốt/xấu).
const MAU_HANH: Record<string, string> = { moc: "#3f8a5a", hoa: "#c4622d", tho: "#a8801f", kim: "#7a7f93", thuy: "#3f6fb0" };

function Khung({ h, children }: { h: HinhQL; children: ReactNode }) {
  const { width: W, height: H } = CO_ANH.ngang;
  return (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", position: "relative", background: M.nen, color: M.chu,
      fontFamily: "Sans", padding: "40px 56px 0" }}>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: M.vang, textTransform: "uppercase" }}>{h.nhan}</div>
      <div style={{ display: "flex", fontSize: 44, marginTop: 10, fontFamily: "Serif", lineHeight: 1.12, maxWidth: h.kieu === "ngu-hanh" ? 470 : 1000 }}>{h.tieuDe}</div>
      {children}
      <div style={{ display: "flex", position: "absolute", left: 56, right: 56, bottom: 26, justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 20, color: M.mo }}>Xem đầy đủ tại</div>
          <div style={{ display: "flex", fontSize: 24, marginTop: 4 }}>{`${TEN_MIEN}${DUONG}`}</div>
        </div>
        <ChanQr url={`${GOC_QR}${DUONG}`} canh={104} loiMoi="Quét để xem" mauChu={M.chu} mauMo={M.mo} />
      </div>
    </div>
  );
}

const The = ({ children, style }: { children: ReactNode; style?: Record<string, string | number> }) => (
  <div style={{ display: "flex", background: M.the, border: `2px solid ${M.vien}`, borderRadius: 22, ...style }}>{children}</div>
);
const Vong = ({ chu, mau, co = 46 }: { chu: string; mau: string; co?: number }) => (
  <div style={{ display: "flex", width: co, height: co, borderRadius: co / 2, background: mau, color: "#fbf7ee", fontSize: chu.length > 2 ? co * 0.36 : co * 0.5,
    alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{chu}</div>
);

function VanPhong() {
  return <div style={{ display: "flex", marginTop: 22, width: 1088, height: 330 }}><CanhVanPhong /></div>;
}

function QuyTrinh({ h }: { h: HinhQL }) {
  return (
    <div style={{ display: "flex", marginTop: 30, alignItems: "center", width: 1088 }}>
      {h.muc.map((m, i) => (
        <div key={m.nhan} style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <The style={{ flex: 1, flexDirection: "column", padding: "20px 26px 22px", height: 300 }}>
            <div style={{ display: "flex", position: "relative", width: 280, height: 104 }}>
              <CanhBuoc buoc={(i + 1) as 1 | 2 | 3} />
              <div style={{ position: "absolute", left: 8, top: 8, display: "flex" }}><Vong chu={m.nhan} mau={M.vang} co={34} /></div>
            </div>
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: 30, lineHeight: 1.15, marginTop: 16 }}>{m.tieu}</div>
            <div style={{ display: "flex", fontSize: 21, lineHeight: 1.35, color: M.mo, marginTop: 10 }}>{m.phu}</div>
          </The>
          {i < h.muc.length - 1 && <div style={{ display: "flex", width: 40, justifyContent: "center", fontSize: 44, color: M.vang }}>{"›"}</div>}
        </div>
      ))}
    </div>
  );
}

function NguHanh({ h }: { h: HinhQL }) {
  // Khung 1088×470 đặt cạnh tiêu đề (kéo lên bằng lề âm); satori tính vị trí tuyệt đối theo cha → mọi toạ độ ở đây là toạ độ trong khung.
  const cx = 714, cy = 250, R = 148, r = 46, rong = 205;
  const goc = (k: number) => ((-90 + 72 * k) * Math.PI) / 180;
  const diem = (k: number) => [cx + R * Math.cos(goc(k)), cy + R * Math.sin(goc(k))] as const;
  const theoKhoa = new Map(h.muc.map((m) => [khoaHanh(m.nhan), m]));
  // Quanh vòng bắt đầu từ Hỏa ở đỉnh: Hỏa → Thổ → Kim → Thủy → Mộc (chiều kim đồng hồ, cùng chiều tương sinh).
  const vong = [...THU_TU_SINH.slice(1), THU_TU_SINH[0]];
  const mui = vong.map((_, k) => {
    const [x1, y1] = diem(k), [x2, y2] = diem((k + 1) % 5);
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    const ux = dx / d, uy = dy / d, t = r + 8;
    const ax = x2 - ux * t, ay = y2 - uy * t, bx = x1 + ux * t, by = y1 + uy * t;
    const px = -uy * 11, py = ux * 11;
    return { bx, by, ax, ay, c1: [ax - ux * 17 + px, ay - uy * 17 + py], c2: [ax - ux * 17 - px, ay - uy * 17 - py] };
  });
  return (
    <div style={{ display: "flex", position: "relative", width: 1088, height: 470, marginTop: -118 }}>
      <div style={{ display: "flex", position: "absolute", left: 0, top: 296, width: 300, fontSize: 22, lineHeight: 1.4, color: M.mo }}>
        Mũi tên chạy theo chiều tương sinh. Vai trò là gợi ý để chia việc và trao đổi, không để xếp hạng người.
      </div>
      <svg width={1088} height={470} viewBox="0 0 1088 470" style={{ position: "absolute", left: 0, top: 0 }}>
        {mui.map((m, i) => (
          <g key={i}>
            <line x1={m.bx} y1={m.by} x2={m.ax} y2={m.ay} stroke={M.vang} strokeWidth={3} strokeOpacity={0.7} />
            <polygon points={`${m.ax},${m.ay} ${m.c1[0]},${m.c1[1]} ${m.c2[0]},${m.c2[1]}`} fill={M.vang} fillOpacity={0.85} />
          </g>
        ))}
      </svg>
      {vong.map((k, i) => {
        const m = theoKhoa.get(k);
        if (!m) return null;
        const [x, y] = diem(i);
        const trai = x < cx - 10;
        return [
          <div key={`${k}-v`} style={{ position: "absolute", display: "flex", left: x - r, top: y - r }}>
            <NhanVatHanh d={r * 2} mau={MAU_HANH[k] ?? M.vang} kieu={i} />
          </div>,
          <div key={`${k}-n`} style={{ position: "absolute", display: "flex", left: x - 34, top: y + r - 12, width: 68, height: 28, borderRadius: 14,
            background: MAU_HANH[k] ?? M.vang, color: "#fbf7ee", fontSize: 19, alignItems: "center", justifyContent: "center" }}>{m.nhan}</div>,
          <div key={`${k}-c`} style={{ position: "absolute", display: "flex", width: rong, fontSize: 22, lineHeight: 1.3, color: M.chu, top: y - 30,
            ...(trai ? { left: x - r - 14 - rong, justifyContent: "flex-end", textAlign: "right" } : { left: x + r + 14 }) }}>{m.tieu}</div>,
        ];
      })}
    </div>
  );
}

function TinhHuong({ h }: { h: HinhQL }) {
  return (
    <div style={{ display: "flex", marginTop: 26, width: 1088, gap: 22 }}>
      <div style={{ display: "flex", flexWrap: "wrap", width: 776, gap: 12, alignContent: "flex-start" }}>
        {h.muc.map((m) => (
          <The key={m.nhan} style={{ width: 382, height: 104, padding: "0 18px", alignItems: "center" }}>
            <Vong chu={m.nhan} mau={M.vang} co={40} />
            <div style={{ display: "flex", flex: 1, marginLeft: 14, fontSize: 22, lineHeight: 1.25 }}>{m.tieu}</div>
          </The>
        ))}
      </div>
      <div style={{ display: "flex", width: 290, height: 330 }}><CanhTraoDoi /></div>
    </div>
  );
}

function KeHoach({ h }: { h: HinhQL }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
      <div style={{ display: "flex", height: 4, background: M.vien, borderRadius: 2, marginBottom: -26, marginTop: 23 }} />
      <div style={{ display: "flex", gap: 22 }}>
        {h.muc.map((m) => (
          <div key={m.nhan} style={{ display: "flex", flex: 1, flexDirection: "column" }}>
            <div style={{ display: "flex", width: 48, height: 48, marginBottom: 12, marginLeft: 16 }}><BieuTuongTuan tuan={(Number(m.nhan.replace(/\D/g, "")) || 1) as 1 | 2 | 3 | 4} d={48} /></div>
            <The style={{ flexDirection: "column", padding: "16px 20px", height: 252 }}>
              <div style={{ display: "flex", fontSize: 21, letterSpacing: 3, color: M.vang, textTransform: "uppercase" }}>{m.nhan}</div>
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: 27, lineHeight: 1.15, marginTop: 8 }}>{m.tieu}</div>
              <div style={{ display: "flex", fontSize: 20, lineHeight: 1.35, color: M.mo, marginTop: 10 }}>{m.phu}</div>
            </The>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const v = new URL(req.url).searchParams.get("hinh");
  if (!laKieuHinhQL(v)) return new Response("Không có hình này", { status: 404 });
  const dm = v === "quy-trinh" || v === "van-phong" ? null : await layDanhMucQuanLy();
  const h = hinhQL(v, dm);
  if (!h) return new Response("Chưa dựng được hình lúc này", { status: 503, headers: { "cache-control": "no-store" } });
  const fonts = await napPhong();
  const { width, height } = CO_ANH.ngang;
  return new ImageResponse(
    <Khung h={h}>
      {h.kieu === "van-phong" ? <VanPhong /> : h.kieu === "quy-trinh" ? <QuyTrinh h={h} /> : h.kieu === "ngu-hanh" ? <NguHanh h={h} />
        : h.kieu === "tinh-huong" ? <TinhHuong h={h} /> : <KeHoach h={h} />}
    </Khung>,
    { width, height, ...(fonts.length ? { fonts } : {}),
      headers: { "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" } },
  );
}
