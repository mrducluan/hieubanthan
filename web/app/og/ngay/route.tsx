// GET /og/ngay?ma=…[&tu=hn.…][&khung=doc] — NHIP-1: ảnh thẻ "Hôm nay {tên} là Ngày cá nhân N — còn bạn?".
// TCS-1 concept "đêm nay": trăng lưỡi liềm, dãy núi chân trời, con số ngày lớn như vì sao sáng nhất; mã QR + hieuban.com.
// 1200×630 (xem trước link) · 1080×1350 (tải về, đăng story). Dữ liệu CHỈ từ mã đã ký (docMaNgay) — không có ngày sinh.
import { ImageResponse } from "next/og";
import { docMaNgay, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, MAU_TU } from "@/lib/the-chia-se";

export const runtime = "nodejs";

/** Dãy núi chân trời (hai lớp) — đường gấp khúc tất định. */
function nui(W: number, H: number, day: number, cao: number, hat: number): string {
  let s = hat >>> 0 || 7;
  const r = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 2 ** 32; };
  const buoc = W / 9;
  const p = [`M0 ${H}`, `L0 ${day - cao * r()}`];
  for (let x = buoc / 2; x <= W + buoc; x += buoc / 2) p.push(`L${Math.round(x)} ${Math.round(day - cao * (0.25 + 0.75 * r()))}`);
  p.push(`L${W} ${H} Z`);
  return p.join(" ");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaNgay(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  // ?tu= của đúng link đã chia sẻ (máy người gửi tạo) — không có thì suy từ mã thẻ, vẫn gán nguồn được.
  const tuThamSo = url.searchParams.get("tu") ?? "";
  const tu = MAU_TU.test(tuThamSo) ? tuThamSo : nd ? tuTuMa("hn", ma) : null;
  const qr = `${GOC_QR}/hom-nay${tu ? `?tu=${tu}` : ""}`;
  const ngay = nd ? nd.d.split("-").reverse().slice(0, 2).join("/") : "";
  const sao = saoRai(bam(ma || "ngay"), doc ? 110 : 80, W, Math.round(H * 0.8));
  const chanTroi = doc ? 1040 : 470;
  const trang = doc ? { x: 930, y: 120, r: 54 } : { x: 1040, y: 110, r: 52 };

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: `linear-gradient(180deg, #070714 0%, #1b1840 ${doc ? 60 : 55}%, #3a2a4a 100%)`, color: MAU.chu, fontFamily: "Sans",
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
          {/* trăng lưỡi liềm: đĩa vàng bị đĩa nền che một phần */}
          <defs>
            <mask id="luoi-liem">
              <rect x="0" y="0" width={W} height={H} fill="#fff" />
              <circle cx={trang.x + trang.r * 0.42} cy={trang.y - trang.r * 0.22} r={trang.r * 0.9} fill="#000" />
            </mask>
            <radialGradient id="quang">
              <stop offset="0%" stopColor={MAU.vang} stopOpacity="0.22" />
              <stop offset="100%" stopColor={MAU.vang} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={trang.x} cy={trang.y} r={trang.r * 2.4} fill="url(#quang)" />
          <circle cx={trang.x} cy={trang.y} r={trang.r} fill={MAU.vang} mask="url(#luoi-liem)" />
          <path d={nui(W, H, chanTroi, doc ? 170 : 110, 11)} fill="#141230" />
          <path d={nui(W, H, chanTroi + (doc ? 70 : 45), doc ? 120 : 80, 29)} fill="#0b0a1c" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", top: doc ? 210 : 46, left: 0, width: W }}>
          <div style={{ display: "flex", fontSize: doc ? 32 : 24, letterSpacing: 6, color: MAU.mo2, textTransform: "uppercase" }}>
            {nd ? `Hôm nay ${ngay}` : "Hôm nay của bạn"}
          </div>
          {nd ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: doc ? 56 : 40, marginTop: doc ? 28 : 10, fontFamily: "Serif" }}>{`${nd.t} là Ngày cá nhân`}</div>
              <div style={{ display: "flex", fontSize: doc ? 380 : 200, lineHeight: 1, color: MAU.vang, fontFamily: "Serif", marginTop: doc ? 10 : 0 }}>{String(nd.n)}</div>
              {nd.k && <div style={{ display: "flex", fontSize: doc ? 44 : 30, fontFamily: "Serif", marginTop: doc ? 16 : 2, maxWidth: doc ? 900 : 860, textAlign: "center", justifyContent: "center" }}>{nd.k}</div>}
              {nd.s && <div style={{ display: "flex", fontSize: doc ? 30 : 22, marginTop: doc ? 22 : 10, color: MAU.trang }}>{`Số nổi bật ${nd.s}`}</div>}
              <div style={{ display: "flex", fontSize: doc ? 40 : 28, marginTop: doc ? 40 : 14, color: MAU.vang }}>Còn bạn hôm nay là ngày mấy?</div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: doc ? 70 : 56, marginTop: 40, fontFamily: "Serif", textAlign: "center", maxWidth: 900 }}>Mỗi ngày một con số của riêng bạn</div>
          )}
        </div>

        {doc ? (
          <div style={{ display: "flex", position: "absolute", top: H - 56 - 190 - 80, left: 0, width: W, justifyContent: "center" }}>
            <ChanQr url={qr} canh={190} loiMoi="Quét để xem ngày của bạn" doc />
          </div>
        ) : (
          <div style={{ display: "flex", position: "absolute", top: H - 22 - 120, left: 40, width: W - 40 - 30, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 18, color: MAU.mo2 }}>Hiểu Bản Thân · Hôm nay của bạn</div>
            <ChanQr url={qr} canh={120} loiMoi="Quét để xem ngày của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
