// GET /og/ba-la?ma=…[&khung=doc] — BT-UI: ảnh thẻ "Ba lá của {tên} hôm nay". Concept: ba lá bài giấy ngà xoè nhẹ trên trời
// đêm — lá Tarot (tên lá), lá Con số (số ngày cá nhân lớn), lá Thời khắc (đồng hồ + tên quẻ đầu ngày); QR + hieuban.com. 1200×630 · 1080×1350.
// Dữ liệu CHỈ từ mã đã ký (docMaBaLa): tên hiển thị, số ngày, tên quẻ, ngày xem, lá Tarot khi mã có mang — không có ngày sinh.
import { ImageResponse } from "next/og";
import { docMaBaLa, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";

export const runtime = "nodejs";
const MUC = "#2a2140";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaBaLa(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("bl", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/ba-la/${ma}?tu=${tu}`, `${GOC_QR}/hom-nay?tu=${tu}`) : `${GOC_QR}/hom-nay`;
  const sao = saoRai(bam(ma || "ba-la"), doc ? 110 : 70, W, H);
  const ngay = nd ? nd.d.split("-").reverse().slice(0, 2).join("/") : "";
  const rong = doc ? 250 : 170;
  const cao = Math.round(rong * (200 / 120));
  const abs = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });
  const la = [
    { nhan: "Lá Tarot", lon: null as string | null, ten: nd?.l?.[1] ?? "Lật mới thấy", xoay: -6, y: 18 },
    { nhan: "Lá Con số", lon: nd ? String(nd.n) : "?", ten: "Ngày cá nhân", xoay: 0, y: 0 },
    { nhan: "Lá Thời khắc", lon: null, ten: nd?.q ? `Quẻ ${nd.q}` : "Giờ tốt · quẻ ngày", xoay: 6, y: 18 },
  ];

  const hangLa = (
    <div style={{ display: "flex", gap: doc ? 26 : 22, justifyContent: "center", alignItems: "flex-start" }}>
      {la.map((l, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: rong, height: cao, marginTop: l.y,
          borderRadius: 16, background: MAU.giay, border: `5px solid ${MAU.vang}`, padding: doc ? 18 : 12, transform: `rotate(${l.xoay}deg)` }}>
          <div style={{ display: "flex", fontSize: doc ? 20 : 13, letterSpacing: doc ? 3 : 1.5, color: MUC, opacity: 0.7, textTransform: "uppercase" }}>{l.nhan}</div>
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            {l.lon ? (
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 150 : 104, color: MUC, lineHeight: 1 }}>{l.lon}</div>
            ) : i === 0 ? (
              <svg width={rong * 0.46} height={rong * 0.46} viewBox="0 0 20 20"><path d="M10,0 L12.2,7.8 L20,10 L12.2,12.2 L10,20 L7.8,12.2 L0,10 L7.8,7.8 Z" fill={MUC} fillOpacity={0.85} /></svg>
            ) : (
              /* Đồng hồ (không vẽ quẻ: hình quẻ phải đúng 6 hào thật, thẻ chỉ mang TÊN quẻ). */
              <svg width={rong * 0.46} height={rong * 0.46} viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8.6" fill="none" stroke={MUC} strokeOpacity={0.85} strokeWidth="1.3" />
                <path d="M10 4.6 V10 L13.6 12.2" fill="none" stroke={MUC} strokeOpacity={0.85} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 26 : 18, color: MUC, textAlign: "center", lineHeight: 1.1 }}>{l.ten}</div>
        </div>
      ))}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at 50% 30%, #1d1a3f 0%, #121632 45%, ${MAU.nen} 80%)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
        </svg>
        <div style={{ ...abs(doc ? 90 : 40, 0, W), flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Ba lá của ngày</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 64 : 44, marginTop: 8 }}>{nd ? `Ba lá của ${nd.t} ngày ${ngay}` : "Ba lá của bạn hôm nay"}</div>
          <div style={{ display: "flex", fontSize: doc ? 30 : 22, marginTop: 8, color: MAU.vang }}>Còn ba lá của bạn là gì?</div>
        </div>
        <div style={{ ...abs(doc ? 380 : 200, 0, W), justifyContent: "center" }}>{hangLa}</div>
        {doc ? (
          <div style={{ ...abs(1060, 0, W), flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 22, color: MAU.mo2, marginBottom: 20 }}>Mỗi ngày ba lá mới, theo ngày sinh của bạn</div>
            <ChanQr url={qr} canh={190} loiMoi="Quét để lật ba lá của bạn — miễn phí, không cần tài khoản" doc />
          </div>
        ) : (
          <div style={{ ...abs(H - 176, W - 136 - 48 - 300, 136 + 300), justifyContent: "flex-end", alignItems: "flex-end" }}>
            <ChanQr url={qr} canh={136} loiMoi="Quét để lật ba lá của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
