// GET /og/que?ma=…[&khung=doc] — UI-KD 6: ảnh thẻ "Quẻ của tôi". Concept: sáu vạch quẻ dựng lớn giữa trời đêm (vạch liền /
// đứt, hào động sáng vàng có quầng), mũi tên sang quẻ biến khi có hào động. 1200×630 (xem trước link) · 1080×1350 (tải về).
// Dữ liệu CHỈ từ mã đã ký (docMaQue): tên hiển thị, 6 giá trị hào, tên quẻ bản / biến, tên chủ đề — không câu hỏi, không giờ gieo.
import { ImageResponse } from "next/og";
import { docMaQue, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";

export const runtime = "nodejs";

/** Sáu vạch (hào 1 dưới cùng) vẽ bằng rect trong svg — hào động màu vàng + quầng; `bien` = quẻ biến (đã đổi vạch động). */
function Vach({ g, x, y, rong, cao, khe, bien = false }: { g: number[]; x: number; y: number; rong: number; cao: number; khe: number; bien?: boolean }) {
  const buoc = cao + khe;
  const tien = bien ? "b" : "a";
  return [
      ...g.map((v, i) => {
        const dong = v === 6 || v === 9;
        const duong = bien ? (v === 7 || v === 6) : (v === 7 || v === 9);
        const yy = y + (5 - i) * buoc;
        const mau = dong ? MAU.vang : MAU.chu;
        const op = dong ? 1 : 0.85;
        return duong ? (
          <rect key={`${tien}${i}`} x={x} y={yy} width={rong} height={cao} rx={cao / 3} fill={mau} fillOpacity={op} />
        ) : (
          <g key={`${tien}${i}`}>
            <rect x={x} y={yy} width={rong * 0.42} height={cao} rx={cao / 3} fill={mau} fillOpacity={op} />
            <rect x={x + rong * 0.58} y={yy} width={rong * 0.42} height={cao} rx={cao / 3} fill={mau} fillOpacity={op} />
          </g>
        );
      }),
      ...g.map((v, i) => ((v === 6 || v === 9) ? (
        <rect key={`${tien}q${i}`} x={x - 10} y={y + (5 - i) * buoc - 10} width={rong + 20} height={cao + 20} rx={cao} fill={MAU.vang} fillOpacity={0.12} />
      ) : null)),
  ];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaQue(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("qu", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/que/${ma}?tu=${tu}`, `${GOC_QR}/kinh-dich?tu=${tu}`) : `${GOC_QR}/kinh-dich`;
  const sao = saoRai(bam(ma || "que"), doc ? 110 : 70, W, H);
  const g = nd?.g ?? [7, 8, 7, 8, 7, 8];
  const coBien = !!nd?.b;
  const ten = nd?.t.trim() ? `Quẻ của ${nd.t.trim()}` : nd ? "Quẻ của tôi" : "Gieo một quẻ cho một việc";

  // Kích thước vạch theo khung
  const L = doc ? { rong: 300, cao: 34, khe: 26, qr: 190 } : { rong: 220, cao: 24, khe: 18, qr: 136 };
  const caoQue = 6 * L.cao + 5 * L.khe;
  const tongRong = coBien ? L.rong * 2 + (doc ? 120 : 110) : L.rong;
  const x0 = doc ? (W - tongRong) / 2 : 72;
  const y0 = doc ? 330 : (H - caoQue) / 2 - 20;
  const xBien = x0 + L.rong + (doc ? 120 : 110);
  const tuyetDoi = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at ${doc ? "50% 35%" : "28% 50%"}, #1c1f3d 0%, #121632 40%, ${MAU.nen} 78%)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
          {Vach({ g, x: x0, y: y0, rong: L.rong, cao: L.cao, khe: L.khe })}
          {coBien && <path d={`M${x0 + L.rong + 28} ${y0 + caoQue / 2} h${(doc ? 120 : 110) - 56}`} stroke={MAU.mo2} strokeWidth={3} strokeLinecap="round" />}
          {coBien && <path d={`M${xBien - 40} ${y0 + caoQue / 2 - 12} l14 12 -14 12`} stroke={MAU.mo2} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          {coBien && Vach({ g, x: xBien, y: y0, rong: L.rong, cao: L.cao, khe: L.khe, bien: true })}
        </svg>
        {/* nhãn dưới mỗi quẻ */}
        <div style={{ ...tuyetDoi(y0 + caoQue + 18, x0, L.rong), justifyContent: "center", fontFamily: "Serif", fontSize: doc ? 40 : 30 }}>{nd ? nd.q : "?"}</div>
        {coBien && <div style={{ ...tuyetDoi(y0 + caoQue + 18, xBien, L.rong), justifyContent: "center", fontFamily: "Serif", fontSize: doc ? 40 : 30, color: MAU.mo2 }}>{nd!.b}</div>}

        <div style={{ ...tuyetDoi(doc ? 90 : 60, doc ? 0 : x0 + tongRong + 60, doc ? W : W - x0 - tongRong - 120), flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Kinh Dịch · {nd?.c ?? "một quẻ cho một việc"}</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 66 : 44, marginTop: 8, lineHeight: 1.1 }}>{ten}</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 36 : 28, marginTop: 10, color: MAU.vang }}>
            {nd ? (coBien ? `${nd.q} biến ${nd.b}` : `${nd.q} — không hào động`) : "Quẻ do máy gieo, bạn tự lật từng hào"}
          </div>
          {!doc && (
            <div style={{ display: "flex", fontSize: 18, color: MAU.mo2, marginTop: 18, lineHeight: 1.4 }}>
              Vạch vàng là hào động — chỗ việc đang chuyển. Thẻ không mang câu hỏi hay giờ gieo.
            </div>
          )}
        </div>

        {doc ? (
          <div style={{ ...tuyetDoi(1080, 0, W), flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 24, color: MAU.mo2, marginBottom: 22 }}>Vạch vàng là hào động — chỗ việc đang chuyển</div>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để gieo quẻ của bạn — 1 phút, không cần tài khoản" doc />
          </div>
        ) : (
          <div style={{ ...tuyetDoi(H - L.qr - 40, W - L.qr - 48 - 300, L.qr + 300), justifyContent: "flex-end", alignItems: "flex-end" }}>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để gieo quẻ của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
