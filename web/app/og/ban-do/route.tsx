// GET /og/ban-do?ma=…[&khung=doc] — CTA-1: ảnh thẻ "Bản đồ 5 mảng của tôi" — "chữ ký" của site.
// Concept: chòm sao năm điểm sáng nối nhau trên nền đêm sao, ánh vàng; mỗi mảng một điểm có biểu tượng + nhãn. Đường đời
// để dấu "?" (mời người xem đoán — trò "Đoán số" ở trang nhận). 1200×630 (xem trước link) · 1080×1350 (tải về / story —
// bản chính). Dữ liệu CHỈ từ mã đã ký (docMaBanDo): tên hiển thị + nhãn engine đã tính — không ngày sinh.
import { ImageResponse } from "next/og";
import { docMaBanDo, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";
import { bienThe, dien, DIEM_BAN_DO, manhBanDo, NOI_BAN_DO, type ManhBanDo } from "@/lib/the-ban-do";

export const runtime = "nodejs";

/** Biểu tượng mảng (vẽ bằng nét, cùng hình với BieuTuongManh trên web) — gọi như hàm trong <svg> (satori). */
function bieuTuong(ma: ManhBanDo["ma"], cx: number, cy: number, s: number, mau: string) {
  const k = s / 24, X = (v: number) => cx + (v - 12) * k, Y = (v: number) => cy + (v - 12) * k;
  const net = { fill: "none", stroke: mau, strokeWidth: 1.8 * k, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (ma === "so") return <g><circle cx={cx} cy={cy} r={8.5 * k} {...net} /><path d={`M${X(9)} ${Y(9.5)} L${X(12)} ${Y(7)} L${X(12)} ${Y(17)}`} {...net} /></g>;
  if (ma === "nhat_chu") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={4 * k} {...net} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((g) => {
          const r = (g * Math.PI) / 180;
          return <line key={g} x1={cx + Math.sin(r) * 6.4 * k} y1={cy - Math.cos(r) * 6.4 * k} x2={cx + Math.sin(r) * 8.8 * k} y2={cy - Math.cos(r) * 8.8 * k} {...net} />;
        })}
      </g>
    );
  }
  if (ma === "sao") return <path d={`M${X(12)} ${Y(2.8)} L${X(14)} ${Y(10)} L${X(21.2)} ${Y(12)} L${X(14)} ${Y(14)} L${X(12)} ${Y(21.2)} L${X(10)} ${Y(14)} L${X(2.8)} ${Y(12)} L${X(10)} ${Y(10)} Z`} {...net} />;
  if (ma === "phi") return <g><circle cx={cx} cy={cy} r={8.5 * k} {...net} /><path d={`M${X(12)} ${Y(5.5)} L${X(14.2)} ${Y(12)} L${X(12)} ${Y(18.5)} L${X(9.8)} ${Y(12)} Z`} {...net} /></g>;
  return <g><path d={`M${X(5)} ${Y(7)} L${X(19)} ${Y(7)} M${X(5)} ${Y(12)} L${X(10.5)} ${Y(12)} M${X(13.5)} ${Y(12)} L${X(19)} ${Y(12)} M${X(5)} ${Y(17)} L${X(19)} ${Y(17)}`} {...net} /></g>;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaBanDo(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("bd", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/ban-do/${ma}?tu=${tu}`, `${GOC_QR}/?tu=${tu}`) : GOC_QR;
  const bt = bienThe(nd?.b ?? 0);
  const ten = nd?.t ?? "bạn";
  const manh = nd ? manhBanDo(nd, true)
    : manhBanDo({ s: 1, k: "", n: "?", h: "bản chất", m: "?", c: "", g: "?", q: "?" }, true);
  const sao = saoRai(bam(ma || "ban-do"), doc ? 120 : 80, W, H);

  // Vùng chòm sao: khung 1000×640 của DIEM_BAN_DO co vào vùng (x0, y0, rộng, cao).
  const V = doc ? { x0: 40, y0: 250, w: 1000, h: 640, r: 46, ten: 30, gt: 50, phu: 22, nhan: 400 }
    : { x0: 20, y0: 112, w: 760, h: 486, r: 34, ten: 18, gt: 34, phu: 16, nhan: 260 };
  const P = DIEM_BAN_DO.map(([x, y]) => [V.x0 + (x / 1000) * V.w, V.y0 + ((y - 60) / 640) * V.h] as const);
  const tuyetDoi = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at 50% ${doc ? 42 : 48}%, #2b2152 0%, #16122e 38%, ${MAU.nen} 72%)`,
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
          {NOI_BAN_DO.map(([a, b], i) => (
            <line key={`${a}-${b}`} x1={P[a]![0]} y1={P[a]![1]} x2={P[b]![0]} y2={P[b]![1]}
              stroke={i < 5 ? MAU.vang : MAU.trang} strokeOpacity={i < 5 ? 0.6 : 0.3} strokeWidth={i < 5 ? 2.4 : 1.6}
              strokeDasharray={i < 5 ? undefined : "4 10"} />
          ))}
          {P.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={V.r * 2} fill={MAU.vang} fillOpacity={0.05} />
              <circle cx={x} cy={y} r={V.r * 1.45} fill={MAU.vang} fillOpacity={0.09} />
              <circle cx={x} cy={y} r={V.r} fill="#1a1530" stroke={manh[i]!.thieu ? MAU.mo : MAU.vang} strokeWidth={2.4} />
              {bieuTuong(manh[i]!.ma, x, y, V.r * 1.05, manh[i]!.thieu ? MAU.mo : MAU.vang)}
            </g>
          ))}
        </svg>

        <div style={{ ...tuyetDoi(doc ? 70 : 30, doc ? 0 : 40, doc ? W : 760), flexDirection: "column", alignItems: doc ? "center" : "flex-start" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Bản đồ 5 mảng</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 64 : 44, marginTop: 6, color: MAU.chu }}>{dien(bt.tieuDe, ten)}</div>
        </div>

        {/* Nhãn dưới mỗi điểm sáng */}
        {P.map(([x, y], i) => {
          const m = manh[i]!;
          return (
            <div key={m.ma} style={{ ...tuyetDoi(y + V.r + 8, x - V.nhan / 2, V.nhan), justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", background: "rgba(13,11,29,0.82)", borderRadius: 16, padding: doc ? "4px 18px 8px" : "2px 12px 6px" }}>
              <div style={{ display: "flex", fontSize: V.ten, letterSpacing: 3, color: MAU.mo, textTransform: "uppercase" }}>{m.nhom}</div>
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: i === 0 ? V.gt * 1.25 : V.gt, color: i === 0 || !m.thieu ? MAU.vang : MAU.mo, lineHeight: 1.1 }}>{m.gia_tri}</div>
              <div style={{ display: "flex", fontSize: V.phu, color: MAU.mo2, marginTop: 2 }}>{i === 0 ? `đoán xem — số mấy?` : m.phu}</div>
            </div>
            </div>
          );
        })}

        {doc ? (
          <div style={{ ...tuyetDoi(975, 0, W), flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: 44, color: MAU.vang }}>{bt.loiMoi}</div>
            <div style={{ display: "flex", marginTop: 26 }}>
              <ChanQr url={qr} canh={176} loiMoi={`Quét để đoán số của ${ten} và ghép bản đồ của bạn`} doc />
            </div>
          </div>
        ) : (
          <div style={{ ...tuyetDoi(140, 800, 360), flexDirection: "column", alignItems: "flex-end", height: 460, justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: 36, color: MAU.vang, lineHeight: 1.2 }}>{bt.loiMoi}</div>
              <div style={{ display: "flex", fontSize: 19, color: MAU.mo2, marginTop: 14, lineHeight: 1.4 }}>
                {`Đoán đường đời của ${ten}, rồi ghép bản đồ 5 mảng của chính bạn.`}
              </div>
            </div>
            <ChanQr url={qr} canh={140} loiMoi="Quét để chơi" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
