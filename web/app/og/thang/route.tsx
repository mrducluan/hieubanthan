// GET /og/thang?ma=…[&tu=tk.…][&khung=doc] — KV-THANG: ảnh thẻ "Tháng N của {tên}: những buổi sáng được thắp".
// Concept: lịch tháng 7 cột trên nền đêm, ngày đã ghé là chấm vàng sáng (như sao thắp), con số tháng lớn + "tháng cá nhân K";
// mã QR + hieuban.com. Dữ liệu CHỈ từ mã đã ký (docMaThang) — không ngày sinh, không chuỗi, không huy hiệu, không hạng.
// 1200×630 (xem trước link) · 1080×1350 (tải về, đăng story). Mã hỏng → ảnh mời chung, vẫn có QR về /hom-nay.
import { ImageResponse } from "next/og";
import { docMaThang, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, MAU_TU, urlQr } from "@/lib/the-chia-se";
import { oLichThang, THU_NGAN } from "@/lib/lich-thang";

export const runtime = "nodejs";

/** Lưới lịch 7 cột bằng flex (satori không nhận <text> trong SVG): ô ngày đã ghé = tròn vàng sáng có số, ngày khác = chấm mờ. */
function Luoi({ o, nam, thang, ghe }: { o: number; nam: number; thang: number; ghe: Set<number> }) {
  const cells = oLichThang(nam, thang);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 7 * o }}>
      <div style={{ display: "flex" }}>
        {THU_NGAN.map((t) => (
          <div key={t} style={{ display: "flex", width: o, height: o * 0.6, alignItems: "center", justifyContent: "center", fontSize: o * 0.26, color: MAU.mo, letterSpacing: 1 }}>{t}</div>
        ))}
      </div>
      {Array.from({ length: cells.length / 7 }, (_, h) => (
        <div key={h} style={{ display: "flex" }}>
          {cells.slice(h * 7, h * 7 + 7).map((d, i) => (
            <div key={i} style={{ display: "flex", width: o, height: o, alignItems: "center", justifyContent: "center" }}>
              {d === null ? null : ghe.has(d) ? (
                <div style={{ display: "flex", width: o * 0.74, height: o * 0.74, borderRadius: o, background: MAU.vang, boxShadow: `0 0 ${Math.round(o * 0.35)}px ${MAU.vang}`,
                  alignItems: "center", justifyContent: "center", fontSize: o * 0.3, color: MAU.nen, fontFamily: "Sans" }}>{d}</div>
              ) : (
                <div style={{ display: "flex", width: o * 0.12, height: o * 0.12, borderRadius: o, background: MAU.mo, opacity: 0.55 }} />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaThang(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tuThamSo = url.searchParams.get("tu") ?? "";
  const tu = MAU_TU.test(tuThamSo) ? tuThamSo : nd ? tuTuMa("tk", ma) : null;
  const duPhong = `${GOC_QR}/hom-nay${tu ? `?tu=${tu}` : ""}`;
  const qr = nd ? urlQr(`${GOC_QR}/the/thang/${ma}${tu ? `?tu=${tu}` : ""}`, duPhong) : duPhong;
  const sao = saoRai(bam(ma || "thang"), doc ? 90 : 70, W, H);
  const ghe = new Set(nd?.g ?? []);
  const o = doc ? 92 : 60;                                     // cạnh ô lịch
  const lx = doc ? (W - 7 * o) / 2 : W - 64 - 7 * o, ly = doc ? 130 : 110;
  const soHang = nd ? oLichThang(nd.y, nd.m).length / 7 : 5;

  const chu = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
      <div style={{ display: "flex", fontSize: doc ? 30 : 22, letterSpacing: 6, color: MAU.vang, textTransform: "uppercase" }}>
        {nd ? `Tháng ${nd.m}/${nd.y} của ${nd.t}` : "Tháng của bạn"}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 72 : 56, marginTop: doc ? 14 : 10, fontFamily: "Serif", lineHeight: 1.1, maxWidth: doc ? 940 : 560 }}>
        {nd ? `${nd.g.length} buổi sáng được thắp` : "Những buổi sáng được thắp"}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 32 : 24, marginTop: doc ? 20 : 14, color: MAU.mo2, maxWidth: doc ? 900 : 560, lineHeight: 1.35 }}>
        {nd ? `Theo thần số, tháng ${nd.m} là tháng cá nhân ${nd.k}.` : "Mỗi ngày một con số, một câu tự soi của riêng bạn."}
      </div>
      <div style={{ display: "flex", fontSize: doc ? 32 : 22, marginTop: doc ? 26 : 18, color: MAU.chu, maxWidth: doc ? 900 : 560 }}>
        Còn tháng này của bạn là tháng mấy?
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: `linear-gradient(${doc ? 180 : 135}deg, #0a0a17 0%, #141a33 55%, #1f2a3f 100%)`, color: MAU.chu, fontFamily: "Sans",
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, op], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={op * 0.7} />)}
        </svg>
        {nd && (
          <div style={{ display: "flex", position: "absolute", top: ly, left: lx }}>
            <Luoi o={o} nam={nd.y} thang={nd.m} ghe={ghe} />
          </div>
        )}

        <div style={{ display: "flex", position: "absolute", top: doc ? ly + (soHang + 0.6) * o + 50 : 80, left: doc ? 0 : 64, width: doc ? W : 560, justifyContent: doc ? "center" : "flex-start" }}>
          {chu}
        </div>

        {doc ? (
          <div style={{ display: "flex", position: "absolute", top: H - 56 - 190 - 60, left: 0, width: W, justifyContent: "center" }}>
            <ChanQr url={qr} canh={190} loiMoi="Quét để xem tháng này của bạn" doc />
          </div>
        ) : (
          <div style={{ display: "flex", position: "absolute", top: H - 22 - 120, left: 64, width: W - 64 - 30, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 18, color: MAU.mo2 }}>Hiểu Bản Thân · Tháng của tôi</div>
            <ChanQr url={qr} canh={120} loiMoi="Quét để xem tháng này của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
