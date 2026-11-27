// GET /og/sao?ma=…[&khung=doc] — CHANG-4: ảnh thẻ "Bản đồ sao của tôi". Concept: vòng hoàng đạo 12 cung giữa trời đêm, ba
// điểm sáng — Mặt Trời (vàng), Mặt Trăng (bạc tím), cung Mọc (ngọc). 1200×630 (xem trước link) · 1080×1350 (tải về).
// Dữ liệu CHỈ từ mã đã ký (docMaSao): tên hiển thị + ba cung — không ngày giờ, nơi sinh.
import { ImageResponse } from "next/og";
import { docMaSao, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { VongHoangDao, type DiemSao } from "@/lib/og-sao";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";
import { tenTheSao } from "@/lib/the-sao";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaSao(ma);
  const doc = khungTuThamSo(url.searchParams.get("khung")) === "doc";
  const { width: W, height: H } = CO_ANH[doc ? "doc" : "ngang"];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("st", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/sao/${ma}?tu=${tu}`, `${GOC_QR}/chiem-tinh?tu=${tu}`) : `${GOC_QR}/chiem-tinh`;
  const sao = saoRai(bam(ma || "sao"), doc ? 110 : 70, W, H);
  const dong: [string, string, string | null][] = [
    ["Mặt Trời", MAU.vang, nd?.s[1] ?? null], ["Mặt Trăng", MAU.trang, nd?.m?.[1] ?? null], ["Cung Mọc", MAU.ngoc, nd?.a?.[1] ?? null],
  ];
  const ds: DiemSao[] = nd ? [
    { cung: nd.s[0], mau: MAU.vang, ban_kinh: doc ? 16 : 12 },
    ...(nd.m ? [{ cung: nd.m[0], mau: MAU.trang, ban_kinh: doc ? 13 : 10 }] : []),
    ...(nd.a ? [{ cung: nd.a[0], mau: MAU.ngoc, ban_kinh: doc ? 13 : 10 }] : []),
  ] : [];
  const r = doc ? 300 : 210;
  const cx = doc ? W / 2 : 300, cy = doc ? 560 : H / 2;
  const tuyetDoi = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at ${doc ? "50% 42%" : "25% 50%"}, #1c1f3d 0%, #121632 40%, ${MAU.nen} 78%)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, rr, o], i) => <circle key={i} cx={x} cy={y} r={rr} fill={MAU.chu} fillOpacity={o} />)}
          {VongHoangDao({ cx, cy, r, ds })}
        </svg>
        <div style={{ ...tuyetDoi(doc ? 70 : 70, doc ? 0 : 580, doc ? W : 560), flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Chiêm tinh · bản đồ sao</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 64 : 46, marginTop: 8, lineHeight: 1.1 }}>{nd ? tenTheSao(nd.t) : "Bản đồ sao của bạn"}</div>
        </div>
        <div style={{ ...tuyetDoi(doc ? 900 : 230, doc ? 140 : 580, doc ? W - 280 : 560), flexDirection: "column" }}>
          {dong.map(([nhan, mau, ten]) => (
            <div key={nhan} style={{ display: "flex", alignItems: "center", marginBottom: doc ? 16 : 12 }}>
              <div style={{ display: "flex", width: doc ? 22 : 16, height: doc ? 22 : 16, borderRadius: 99, background: mau, marginRight: 14 }} />
              <div style={{ display: "flex", fontSize: doc ? 32 : 24, color: MAU.mo2, width: doc ? 220 : 170 }}>{nhan}</div>
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 40 : 30, color: ten ? MAU.chu : MAU.mo }}>{ten ?? (nhan === "Cung Mọc" ? "cần giờ sinh" : "chưa chắc")}</div>
            </div>
          ))}
        </div>
        {doc ? (
          <div style={{ ...tuyetDoi(1110, 0, W), flexDirection: "column", alignItems: "center" }}>
            <ChanQr url={qr} canh={150} loiMoi="Quét để xem bản đồ sao của bạn — không cần tài khoản" doc />
          </div>
        ) : (
          <div style={{ ...tuyetDoi(H - 136 - 40, W - 136 - 48 - 300, 136 + 300), justifyContent: "flex-end", alignItems: "flex-end" }}>
            <ChanQr url={qr} canh={136} loiMoi="Quét để xem bản đồ sao của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
