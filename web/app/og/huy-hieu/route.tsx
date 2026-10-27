// GET /og/huy-hieu?ma=chuoi_7[&tu=hh.…][&khung=doc] — thẻ chia sẻ huy hiệu (SAO-HH, khâu MỜI). Concept "một vì sao được
// thắp": huy chương vàng giữa trời đêm, ngôi sao năm cánh trong vòng nguyệt quế, các tia sáng toả ra. CHỈ mã huy hiệu
// (danh mục công khai, không tên, không ngày đạt) → không cần ký mã (docs/THE-CHIA-SE.md). Mã lạ → ảnh mời chung, vẫn có
// QR. 1200×630 (xem trước link) · 1080×1350 (tải về, đăng story).
import { ImageResponse } from "next/og";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { DANH_MUC, duongTheHuyHieu, laMaHuyHieu, THE_HUY_HIEU } from "@/lib/huy-hieu";
import { GOC_QR, MAU_TU } from "@/lib/the-chia-se";

export const runtime = "nodejs";

/** Huy chương: tia sáng, vòng nguyệt quế, đĩa vàng, sao năm cánh. Gọi như hàm (satori không nhận fragment trong svg). */
function huyChuong(cx: number, cy: number, r: number) {
  const tia = Array.from({ length: 16 }, (_, i) => {
    const g = (i / 16) * Math.PI * 2, dai = i % 2 ? 1.55 : 1.8;
    return <line key={`t${i}`} x1={cx + Math.cos(g) * r * 1.18} y1={cy + Math.sin(g) * r * 1.18}
      x2={cx + Math.cos(g) * r * dai} y2={cy + Math.sin(g) * r * dai} stroke={MAU.vang} strokeOpacity={i % 2 ? 0.25 : 0.45} strokeWidth={i % 2 ? 2 : 3} />;
  });
  const la = Array.from({ length: 14 }, (_, i) => {
    const ben = i < 7 ? -1 : 1, k = i % 7, g = Math.PI / 2 + ben * (0.35 + k * 0.33);
    const x = cx + Math.cos(g) * r * 1.08, y = cy + Math.sin(g) * r * 1.08;
    const goc = (g * 180) / Math.PI + (ben < 0 ? -60 : 60);
    return <ellipse key={`l${i}`} cx={x} cy={y} rx={r * 0.07} ry={r * 0.16} fill={MAU.ngoc} fillOpacity={0.75} transform={`rotate(${goc} ${x} ${y})`} />;
  });
  const sao = Array.from({ length: 10 }, (_, i) => {
    const g = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.27 : r * 0.62;
    return `${(cx + Math.cos(g) * rr).toFixed(1)},${(cy + Math.sin(g) * rr).toFixed(1)}`;
  }).join(" ");
  return [
    <circle key="quang" cx={cx} cy={cy} r={r * 1.45} fill={MAU.vang} fillOpacity={0.06} />,
    ...tia,
    ...la,
    <circle key="dia" cx={cx} cy={cy} r={r} fill="#2a2140" stroke={MAU.vang} strokeWidth={r * 0.07} />,
    <circle key="vien" cx={cx} cy={cy} r={r * 0.84} fill="none" stroke={MAU.vang} strokeOpacity={0.45} strokeWidth={2} />,
    <polygon key="sao" points={sao} fill={MAU.vang} />,
  ];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const maTho = url.searchParams.get("ma") ?? "";
  const ma = laMaHuyHieu(maTho) ? maTho : null;
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tuThamSo = url.searchParams.get("tu") ?? "";
  const tu = MAU_TU.test(tuThamSo) ? tuThamSo : null;
  const qr = `${GOC_QR}${ma ? duongTheHuyHieu(ma) : "/"}${tu ? `?tu=${tu}` : ""}`;
  const sao = saoRai(bam(`hh${ma ?? ""}`), doc ? 90 : 70, W, H);
  const the = ma ? THE_HUY_HIEU[ma] : null;
  const hc = doc ? { cx: W / 2, cy: 290, r: 130 } : { cx: 930, cy: 285, r: 125 };

  const chu = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
      <div style={{ display: "flex", fontSize: doc ? 30 : 22, letterSpacing: 6, color: MAU.vang, textTransform: "uppercase" }}>
        {ma ? "Một dấu mốc mới" : "Huy hiệu Hiểu Bản Thân"}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 84 : 64, marginTop: doc ? 18 : 12, fontFamily: "Serif", lineHeight: 1.08, maxWidth: doc ? 940 : 640 }}>
        {ma ? DANH_MUC[ma].ten : "Những dấu mốc của riêng bạn"}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 34 : 26, marginTop: doc ? 24 : 18, color: MAU.mo2, maxWidth: doc ? 900 : 620, lineHeight: 1.35 }}>
        {the ? the.cau : "Ghé mỗi ngày, rủ bạn bè, giữ lời hẹn với chính mình."}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 34 : 24, marginTop: doc ? 30 : 22, color: MAU.chu, maxWidth: doc ? 900 : 620 }}>
        {the ? the.moi : "Bắt đầu từ bốn con số của bạn — miễn phí."}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: `linear-gradient(${doc ? 180 : 135}deg, #0a0a17 0%, #16142e 55%, #2b2240 100%)`, color: MAU.chu, fontFamily: "Sans",
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o * 0.8} />)}
          {huyChuong(hc.cx, hc.cy, hc.r)}
        </svg>

        <div style={{ display: "flex", position: "absolute", top: doc ? 575 : 70, left: doc ? 0 : 64, width: doc ? W : 700, justifyContent: doc ? "center" : "flex-start" }}>
          {chu}
        </div>

        {doc ? (
          <div style={{ display: "flex", position: "absolute", top: H - 56 - 190 - 60, left: 0, width: W, justifyContent: "center" }}>
            <ChanQr url={qr} canh={190} loiMoi="Quét để bắt đầu hành trình của bạn" doc />
          </div>
        ) : (
          <div style={{ display: "flex", position: "absolute", top: H - 22 - 120, left: 64, width: W - 64 - 30, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 18, color: MAU.mo2 }}>Hiểu Bản Thân · Huy hiệu</div>
            <ChanQr url={qr} canh={120} loiMoi="Quét để bắt đầu hành trình của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
