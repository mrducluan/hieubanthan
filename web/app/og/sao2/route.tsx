// GET /og/sao2?ma=…[&khung=doc] — CHANG-4: ảnh thẻ "Hợp đôi chiêm tinh". Concept: một vòng hoàng đạo, hai điểm Mặt Trời
// (vàng = người gửi, ngọc = người ấy) và ≤ 3 chủ đề hai bản đồ sao tương tác. Không điểm số, không tên người kia.
// Dữ liệu CHỈ từ mã đã ký (docMaSao2).
import { ImageResponse } from "next/og";
import { docMaSao2, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { VongHoangDao, type DiemSao } from "@/lib/og-sao";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";
import { tenTheSao2 } from "@/lib/the-sao";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaSao2(ma);
  const doc = khungTuThamSo(url.searchParams.get("khung")) === "doc";
  const { width: W, height: H } = CO_ANH[doc ? "doc" : "ngang"];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("sd", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/sao2/${ma}?tu=${tu}`, `${GOC_QR}/chiem-tinh?tu=${tu}#hop-doi`) : `${GOC_QR}/chiem-tinh`;
  const sao = saoRai(bam(ma || "sao2"), doc ? 110 : 70, W, H);
  const ds: DiemSao[] = nd ? [
    { cung: nd.s[0], mau: MAU.vang, ban_kinh: doc ? 16 : 12 },
    ...(nd.k ? [{ cung: nd.k[0], mau: MAU.ngoc, ban_kinh: doc ? 16 : 12 }] : []),
  ] : [];
  const r = doc ? 250 : 200;
  const cx = doc ? W / 2 : 290, cy = doc ? 500 : H / 2;
  const tuyetDoi = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at ${doc ? "50% 38%" : "25% 50%"}, #1c1f3d 0%, #121632 40%, ${MAU.nen} 78%)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, rr, o], i) => <circle key={i} cx={x} cy={y} r={rr} fill={MAU.chu} fillOpacity={o} />)}
          {VongHoangDao({ cx, cy, r, ds })}
        </svg>
        <div style={{ ...tuyetDoi(doc ? 70 : 60, doc ? 0 : 560, doc ? W : 590), flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Chiêm tinh · hai bản đồ sao</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 60 : 42, marginTop: 8, lineHeight: 1.1 }}>{nd ? tenTheSao2(nd.a) : "Hai bản đồ sao"}</div>
          <div style={{ display: "flex", fontSize: doc ? 30 : 22, marginTop: 12, color: MAU.mo2 }}>
            <span style={{ color: MAU.vang }}>{`Mặt Trời ${nd?.s[1] ?? "?"}`}</span>
            <span style={{ marginLeft: 12, marginRight: 12 }}>·</span>
            <span style={{ color: MAU.ngoc }}>{`Mặt Trời ${nd?.k?.[1] ?? "?"}`}</span>
          </div>
        </div>
        <div style={{ ...tuyetDoi(doc ? 800 : 230, doc ? 110 : 560, doc ? W - 220 : 590), flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: doc ? 24 : 17, color: MAU.mo, marginBottom: 10 }}>Chỗ hai bản đồ sao gặp nhau</div>
          {(nd?.c ?? []).map(([ma2, ten]) => (
            <div key={ma2} style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 32 : 23, marginBottom: doc ? 12 : 8, lineHeight: 1.25 }}>{`• ${ten}`}</div>
          ))}
          <div style={{ display: "flex", fontSize: doc ? 22 : 16, color: MAU.mo2, marginTop: 6 }}>Không chấm điểm — chỉ chỉ ra chỗ dễ đồng điệu, chỗ cần thoả thuận.</div>
        </div>
        {doc ? (
          <div style={{ ...tuyetDoi(1120, 0, W), flexDirection: "column", alignItems: "center" }}>
            <ChanQr url={qr} canh={150} loiMoi="Quét để xem hai bản đồ sao của bạn — không cần tài khoản" doc />
          </div>
        ) : (
          <div style={{ ...tuyetDoi(H - 120 - 30, W - 120 - 40 - 300, 120 + 300), justifyContent: "flex-end", alignItems: "flex-end" }}>
            <ChanQr url={qr} canh={120} loiMoi="Quét để xem của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
