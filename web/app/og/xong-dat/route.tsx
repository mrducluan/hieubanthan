// GET /og/xong-dat?nam=2027[&tu=xd.…][&khung=doc] — thẻ chia sẻ "Tết {can chi} {năm}: ai xông đất nhà bạn?" (TDG-1 tiếp, khâu MỜI).
// Concept "bước chân đầu năm": cánh cửa ngày Tết, hai đèn lồng, nhành mai, dấu chân đi vào cửa; mã QR + hieuban.com.
// CHỈ dữ liệu công khai của NĂM (can chi năm, mùng 1, giờ hoàng đạo, hướng — engine `/v1/tuoi/xong-dat-nam`) — không có tuổi
// gia chủ hay danh sách tuổi hợp (suy ngược được con giáp gia chủ — docs/THE-CHIA-SE.md). Năm ngoài bảng / engine lỗi →
// ảnh mời chung, vẫn có QR. 1200×630 (xem trước link) · 1080×1350 (tải về, đăng story).
import { ImageResponse } from "next/og";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, MAU_TU } from "@/lib/the-chia-se";
import { docNamBang, duongXongDatNam, xongDatNamCongKhai, type XongDatNam } from "@/lib/tuoi-dan-gian";

export const runtime = "nodejs";

const SON = "#5a1f2b", SON_SANG = "#7a2d3a", HONG_MAI = "#f2c8d0";
const dmy = (iso: string) => iso.split("-").reverse().join("/");

/** Cánh cửa + đèn lồng + nhành mai + dấu chân — toạ độ theo khung (x, y góc trên trái cửa, rộng w). Gọi như hàm (satori). */
function canhCua(x: number, y: number, w: number) {
  const h = w * 1.35, r = w / 2;
  const den = (cx: number) => [
    <line key={`d${cx}`} x1={cx} y1={y - 6} x2={cx} y2={y + w * 0.12} stroke={MAU.vang} strokeWidth={2} />,
    <ellipse key={`e${cx}`} cx={cx} cy={y + w * 0.21} rx={w * 0.075} ry={w * 0.095} fill={SON_SANG} stroke={MAU.vang} strokeWidth={2} />,
    <rect key={`r${cx}`} x={cx - w * 0.02} y={y + w * 0.3} width={w * 0.04} height={w * 0.05} fill={MAU.vang} />,
  ];
  const hoa = ([[0.05, 0.02], [0.16, -0.04], [0.27, 0.05], [0.36, -0.02], [0.47, 0.06]] as const).map(([dx, dy], i) => (
    <circle key={`h${i}`} cx={x + w * 1.08 - w * dx} cy={y - w * 0.18 + w * dy} r={w * 0.035} fill={i % 2 ? HONG_MAI : MAU.vang} fillOpacity={0.9} />
  ));
  const chan = [0, 1, 2, 3].map((i) => {
    const t = i / 3, cx = x + r + (i % 2 ? w * 0.08 : -w * 0.08), cy = y + h + w * (0.62 - t * 0.48);
    return <ellipse key={`c${i}`} cx={cx} cy={cy} rx={w * (0.035 - t * 0.008)} ry={w * (0.06 - t * 0.014)} fill={MAU.mo2} fillOpacity={0.35 + t * 0.35} />;
  });
  return [
    <path key="khung" d={`M${x - w * 0.12} ${y + h} L${x - w * 0.12} ${y + r * 0.2} Q${x + r} ${y - r * 0.55} ${x + w * 1.12} ${y + r * 0.2} L${x + w * 1.12} ${y + h} Z`} fill={SON} />,
    <path key="vom" d={`M${x} ${y + h} L${x} ${y + r * 0.35} Q${x + r} ${y - r * 0.25} ${x + w} ${y + r * 0.35} L${x + w} ${y + h} Z`} fill="#1d1430" />,
    <rect key="la1" x={x + w * 0.04} y={y + r * 0.45} width={w * 0.44} height={h - r * 0.45} fill={SON_SANG} />,
    <rect key="la2" x={x + w * 0.52} y={y + r * 0.45} width={w * 0.44} height={h - r * 0.45} fill={SON_SANG} />,
    <path key="sang" d={`M${x + w * 0.48} ${y + r * 0.45} L${x + w * 0.52} ${y + r * 0.45} L${x + w * 0.62} ${y + h} L${x + w * 0.38} ${y + h} Z`} fill={MAU.vang} fillOpacity={0.55} />,
    <circle key="nam1" cx={x + w * 0.42} cy={y + h * 0.6} r={w * 0.025} fill={MAU.vang} />,
    <circle key="nam2" cx={x + w * 0.58} cy={y + h * 0.6} r={w * 0.025} fill={MAU.vang} />,
    ...den(x - w * 0.02), ...den(x + w * 1.02),
    <path key="canh" d={`M${x + w * 1.25} ${y - w * 0.3} Q${x + w * 0.85} ${y - w * 0.12} ${x + w * 0.5} ${y - w * 0.16}`} stroke="#6b4a2f" strokeWidth={4} fill="none" />,
    ...hoa,
    ...chan,
  ];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const n = docNamBang(url.searchParams.get("nam") ?? "");
  let d: XongDatNam | null = null;
  if (n) { try { d = await xongDatNamCongKhai(n); } catch { d = null; } }
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tuThamSo = url.searchParams.get("tu") ?? "";
  const tu = MAU_TU.test(tuThamSo) ? tuThamSo : null;
  const qr = `${GOC_QR}${d && n ? duongXongDatNam(n) : "/tuoi-xong-dat"}${tu ? `?tu=${tu}` : ""}`;
  const sao = saoRai(bam(`xd${n ?? 0}`), doc ? 90 : 70, W, Math.round(H * (doc ? 0.45 : 0.9)));
  const gio = d ? d.mung_mot.gio_hoang_dao.slice(0, 4).map((g) => g.chi).join(", ") : "";
  const cua = doc ? { x: 430, y: 140, w: 220 } : { x: 880, y: 105, w: 190 };

  const chu = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
      <div style={{ display: "flex", fontSize: doc ? 32 : 24, letterSpacing: 6, color: MAU.vang, textTransform: "uppercase" }}>
        {d && n ? `Tết ${d.nam.can_chi} ${n}` : "Tết đến nhà"}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 88 : 66, marginTop: doc ? 18 : 12, fontFamily: "Serif", lineHeight: 1.08 }}>Ai xông đất nhà bạn?</div>
      {d && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: doc ? "center" : "flex-start", marginTop: doc ? 30 : 22, fontSize: doc ? 32 : 24, color: MAU.mo2 }}>
          <div style={{ display: "flex" }}>{`Mùng 1 Tết: ${dmy(d.mung_mot.ngay)} · ngày ${d.mung_mot.can_chi}`}</div>
          {gio && <div style={{ display: "flex", marginTop: 8 }}>{`Giờ hoàng đạo: ${gio}`}</div>}
          <div style={{ display: "flex", marginTop: 8 }}>{`Hỷ thần ${d.mung_mot.huong.hy_than} · Tài thần ${d.mung_mot.huong.tai_than}`}</div>
        </div>
      )}
      <div style={{ display: "flex", fontSize: doc ? 38 : 28, marginTop: doc ? 36 : 26, color: MAU.chu, maxWidth: doc ? 900 : 700 }}>
        Gõ năm sinh gia chủ — biết ngay 3 tuổi hợp
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: `linear-gradient(${doc ? 180 : 135}deg, #0a0a17 0%, #1b1430 55%, #3a1d2c 100%)`, color: MAU.chu, fontFamily: "Sans",
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o * 0.8} />)}
          {canhCua(cua.x, cua.y, cua.w)}
        </svg>

        <div style={{ display: "flex", position: "absolute", top: doc ? 630 : 70, left: doc ? 0 : 64, width: doc ? W : 740, justifyContent: doc ? "center" : "flex-start" }}>
          {chu}
        </div>

        {doc ? (
          <div style={{ display: "flex", position: "absolute", top: H - 56 - 190 - 60, left: 0, width: W, justifyContent: "center" }}>
            <ChanQr url={qr} canh={190} loiMoi="Quét để xem tuổi hợp nhà bạn" doc />
          </div>
        ) : (
          <div style={{ display: "flex", position: "absolute", top: H - 22 - 120, left: 64, width: W - 64 - 30, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 18, color: MAU.mo2 }}>Hiểu Bản Thân · Tuổi xông đất</div>
            <ChanQr url={qr} canh={120} loiMoi="Quét để xem tuổi hợp nhà bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
