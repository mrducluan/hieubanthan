// GET /og/nha?ma=…[&khung=doc] — UI-PT2 P7: ảnh thẻ "Nhà của bạn". Concept: sơ đồ Cửu cung 3×3 tô màu theo mức (lục thuận ·
// xám-lam cân bằng · hổ phách cần lưu ý, không đỏ) với mũi tên hướng nhà, trên nền đêm sao. 1200×630 (xem trước link) ·
// 1080×1350 (tải về / story). Dữ liệu CHỈ từ mã đã ký (docMaNha): tên hiển thị, hướng 8, loại nhà, mức, ≤ 6 phòng.
import { ImageResponse } from "next/og";
import { CUNG_9, docMaNha, HUONG_8, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, MAU_MUC_THE, NHAN_MUC_THE, TEN_LOAI_NHA_THE, TEN_PHONG_THE, tenNhaThe, urlQr } from "@/lib/the-chia-se";

export const runtime = "nodejs";

/** Vị trí 9 ô theo bản đồ (Bắc trên, Đông phải) — cùng LUOI_9 của SoDoNha. */
const O_9: Record<(typeof CUNG_9)[number], [number, number]> = {
  "Tây Bắc": [0, 0], "Bắc": [1, 0], "Đông Bắc": [2, 0], "Tây": [0, 1], "Trung cung": [1, 1], "Đông": [2, 1],
  "Tây Nam": [0, 2], "Nam": [1, 2], "Đông Nam": [2, 2],
};
const THU_TU = { can_chu_dong: 0, can_bang: 1, thuan: 2 } as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaNha(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("nh", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/nha/${ma}?tu=${tu}`, `${GOC_QR}/phong-thuy?tu=${tu}`) : `${GOC_QR}/phong-thuy`;
  const sao = saoRai(bam(ma || "nha"), doc ? 100 : 70, W, H);
  const ten = nd ? tenNhaThe(nd.t) : "Nhà của bạn";
  const mauMuc = nd?.m ? MAU_MUC_THE[nd.m] ?? MAU.vang : MAU.vang;

  // Lưới: cạnh ô theo khung; đặt bên trái (ngang) hoặc giữa (dọc).
  const L = doc ? { o: 250, gap: 12, x0: 72, y0: 300, chu: 26, phong: 30, tieu: 70, qr: 190 } : { o: 150, gap: 8, x0: 64, y0: 128, chu: 17, phong: 20, tieu: 44, qr: 136 };
  const theoO = new Map<string, { ten: string; muc: string | null }[]>();
  for (const [ph, c, m] of nd?.p ?? []) { const l = theoO.get(c) ?? []; l.push({ ten: TEN_PHONG_THE[ph] ?? ph, muc: m }); theoO.set(c, l); }
  const mucO = (c: string) => {
    const ms = (theoO.get(c) ?? []).map((x) => x.muc).filter((m): m is keyof typeof THU_TU => Boolean(m));
    return ms.length ? ms.sort((a, b) => THU_TU[a] - THU_TU[b])[0]! : null;
  };
  const tuyetDoi = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });
  const luoiRong = 3 * L.o + 2 * L.gap;
  const x0 = doc ? (W - luoiRong) / 2 : L.x0;
  const cua = nd ? O_9[nd.h] : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at 50% ${doc ? 40 : 50}%, #1d2a3a 0%, #121a2c 40%, ${MAU.nen} 75%)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
          {CUNG_9.map((c) => {
            const [cx, cy] = O_9[c];
            const m = mucO(c);
            const x = x0 + cx * (L.o + L.gap), y = L.y0 + cy * (L.o + L.gap);
            const mau = m ? MAU_MUC_THE[m]! : null;
            return (
              <g key={c}>
                <rect x={x} y={y} width={L.o} height={L.o} rx={Math.round(L.o * 0.08)} fill={mau ? `${mau}2b` : "rgba(255,255,255,0.05)"}
                  stroke={mau ?? "rgba(255,255,255,0.16)"} strokeWidth={cua && cua[0] === cx && cua[1] === cy ? 3 : 1.5} />
                {cua && cua[0] === cx && cua[1] === cy && (
                  <path d={`M${x + L.o / 2} ${y + 8} l-10 14 h20 z`} fill={MAU.vang} />
                )}
              </g>
            );
          })}
        </svg>
        {/* chữ trong ô (satori không vẽ text đáng tin trong svg) */}
        {CUNG_9.map((c) => {
          const [cx, cy] = O_9[c];
          const x = x0 + cx * (L.o + L.gap), y = L.y0 + cy * (L.o + L.gap);
          const ds = theoO.get(c) ?? [];
          return (
            <div key={c} style={{ ...tuyetDoi(y + 10, x + 12, L.o - 24), flexDirection: "column", height: L.o - 20 }}>
              <div style={{ display: "flex", fontSize: L.chu * 0.75, letterSpacing: 2, color: MAU.mo, textTransform: "uppercase" }}>{c === "Trung cung" ? "Giữa nhà" : c}</div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
                {ds.slice(0, 2).map((p, i) => (
                  <div key={i} style={{ display: "flex", fontFamily: "Serif", fontSize: L.phong, color: p.muc ? MAU_MUC_THE[p.muc] : MAU.chu, lineHeight: 1.15 }}>{p.ten}</div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ ...tuyetDoi(doc ? 70 : 30, doc ? 0 : x0 + luoiRong + 48, doc ? W : W - x0 - luoiRong - 96), flexDirection: "column", alignItems: doc ? "center" : "flex-start", textAlign: doc ? "center" : "left" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>
            {nd ? `${TEN_LOAI_NHA_THE[nd.l ?? "khac"]} hướng ${nd.h}` : "Phong thuỷ"}
          </div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: L.tieu, marginTop: 8, lineHeight: 1.1 }}>{ten}</div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 40 : 30, marginTop: 10, color: mauMuc }}>
            {nd?.m ? `Với người ở: ${NHAN_MUC_THE[nd.m]}` : nd ? "Đọc theo hướng nhà" : "Nhà bạn hợp với bạn không?"}
          </div>
          {!doc && (
            <div style={{ display: "flex", fontSize: 18, color: MAU.mo2, marginTop: 18, lineHeight: 1.4 }}>
              Lục = thuận lợi · xám = cân bằng · cam = cần lưu ý. Bắc ở trên, mũi tên là phía cửa.
            </div>
          )}
        </div>

        {doc ? (
          <div style={{ ...tuyetDoi(1090, 0, W), flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 24, color: MAU.mo2, marginBottom: 22 }}>Lục = thuận lợi · xám = cân bằng · cam = cần lưu ý · Bắc ở trên</div>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để đọc nhà của bạn — 2 phút, không cần tài khoản" doc />
          </div>
        ) : (
          <div style={{ ...tuyetDoi(H - L.qr - 40, W - L.qr - 48 - 300, L.qr + 300), justifyContent: "flex-end", alignItems: "flex-end" }}>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để đọc nhà của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}

// giữ HUONG_8 trong phạm vi để TypeScript không báo import thừa khi đổi concept sau này
void HUONG_8;
