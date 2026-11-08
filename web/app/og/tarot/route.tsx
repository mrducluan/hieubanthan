// GET /og/tarot?ma=…[&khung=doc] — TR-3: ảnh thẻ "Câu trả lời của lá bài". Concept: hàng lá bài giấy ngà trên trời đêm (lá ngược
// có dải "NGƯỢC", tên lá đọc xuôi), dòng nghiêng lớn màu theo hướng (lục / vàng / hổ phách — không đỏ). 1200×630 · 1080×1350.
// Dữ liệu CHỈ từ mã đã ký (docMaTarot): tên hiển thị, lá + vị trí, nghiêng, nhãn loại việc — không câu hỏi, không ngày sinh.
import { ImageResponse } from "next/og";
import { docMaTarot, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";

export const runtime = "nodejs";
const MAU_NG = { tien: MAU.ngoc, dieu_kien: MAU.vang, cho: "#f0b35c" } as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaTarot(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("ta", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/tarot/${ma}?tu=${tu}`, `${GOC_QR}/tarot?tu=${tu}`) : `${GOC_QR}/tarot`;
  const sao = saoRai(bam(ma || "tarot"), doc ? 110 : 70, W, H);
  const la = (nd?.l ?? [["dai_0", false, "Chàng Khờ", "Lá cho câu hỏi"]]).slice(0, 5);
  const ten = nd?.t.trim() ? `Lá bài trả lời ${nd.t.trim()}` : "Lá bài trả lời tôi";
  const rong = doc ? Math.min(170, (W - 120) / la.length - 16) : Math.min(120, 560 / la.length - 14);
  const cao = rong * (200 / 120);
  const mauNg = nd ? MAU_NG[nd.n] : MAU.vang;
  const abs = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });

  const hangLa = (
    <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
      {la.map(([id, nguoc, tenLa, vt], i) => (
        <div key={`${id}${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: rong }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: rong, height: cao,
            borderRadius: 12, background: MAU.giay, border: `4px solid ${MAU.vang}`, padding: 10, position: "relative" }}>
            {nguoc ? <div style={{ display: "flex", position: "absolute", top: 8, right: 8, background: "#b9772f", color: "#fff8e6", fontSize: doc ? 16 : 12, padding: "2px 8px", borderRadius: 10 }}>NGƯỢC</div> : null}
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
              {/* sao bốn cánh vẽ bằng svg (không ký tự đặc biệt — ImageResponse sẽ đi tải phông ngoài) */}
              <svg width={rong * 0.42} height={rong * 0.42} viewBox="0 0 20 20"><path d="M10,0 L12.2,7.8 L20,10 L12.2,12.2 L10,20 L7.8,12.2 L0,10 L7.8,7.8 Z" fill="#2a2140" fillOpacity={nguoc ? 0.45 : 0.85} /></svg>
            </div>
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 22 : 16, color: "#2a2140", textAlign: "center", lineHeight: 1.1 }}>{tenLa}</div>
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: doc ? 18 : 13, color: MAU.mo2, textAlign: "center" }}>{vt}</div>
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
        <div style={{ ...abs(doc ? 90 : 46, 0, W), flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>Tarot · {nd?.w ?? "một câu hỏi, vài lá bài"}</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 62 : 42, marginTop: 8 }}>{ten}</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 52 : 36, marginTop: 6, color: mauNg }}>{nd?.h ?? "Có, có điều kiện hay chưa nên vội?"}</div>
        </div>
        <div style={{ ...abs(doc ? 400 : 210, 0, W), justifyContent: "center" }}>{hangLa}</div>
        {doc && nd ? (
          <div style={{ ...abs(400 + cao + 90, 90, W - 180), justifyContent: "center", textAlign: "center", fontSize: 30, lineHeight: 1.45, color: MAU.mo2 }}>{nd.c}</div>
        ) : null}
        {doc ? (
          <div style={{ ...abs(1060, 0, W), flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 22, color: MAU.mo2, marginBottom: 20 }}>Lá bài cho hướng nghiêng, quyết định là của người hỏi</div>
            <ChanQr url={qr} canh={190} loiMoi="Quét để rút bài cho việc của bạn — 1 phút, không cần tài khoản" doc />
          </div>
        ) : (
          <div style={{ ...abs(H - 176, W - 136 - 48 - 300, 136 + 300), justifyContent: "flex-end", alignItems: "flex-end" }}>
            <ChanQr url={qr} canh={136} loiMoi="Quét để rút bài cho việc của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
