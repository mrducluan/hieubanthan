// GET /og/hai?ma=…[&khung=doc] — TCS-1: ảnh thẻ "Điểm hai người" (Xem lá số 2 người).
// Concept: vòng điểm ở giữa + hai chòm sao hai bên nối vào nhau. 1200×630 (xem trước link) · 1080×1350 (tải về / story).
// Dữ liệu CHỈ từ mã đã ký (lib/ma-moi.ts docMaHai): tên hiển thị, quan hệ, điểm, mức, ≤ 3 tiêu chí — không ngày sinh.
import { ImageResponse } from "next/og";
import { docMaHai, tuTuMa, type NoiDungMaHai } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import {
  GOC_QR, MAU_MUC_HAI, NHAN_MUC_HAI, TEN_QUAN_HE_HAI, TEN_TIEU_CHI_HAI, tenHai, urlQr,
} from "@/lib/the-chia-se";

export const runtime = "nodejs";

// Hai chòm sao (toạ độ tương đối trong ô 260×200), chòm phải là ảnh guong — điểm 0 là sao nối vào vòng điểm.
const CHOM: [number, number][] = [[250, 100], [180, 60], [120, 95], [60, 40], [40, 140], [130, 170]];
const NOI: [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 0]];

function ChomSao({ x, y, guong, tl, mau }: { x: number; y: number; guong: boolean; tl: number; mau: string }) {
  const p = CHOM.map(([a, b]) => [x + (guong ? 260 - a : a) * tl, y + b * tl] as const);
  return (
    <g>
      {NOI.map(([i, j]) => (
        <line key={`${i}-${j}`} x1={p[i]![0]} y1={p[i]![1]} x2={p[j]![0]} y2={p[j]![1]} stroke={mau} strokeOpacity="0.45" strokeWidth={2 * tl} />
      ))}
      {p.map(([a, b], i) => (
        <circle key={i} cx={a} cy={b} r={(i === 0 ? 7 : 4.5) * tl} fill={i === 0 ? MAU.vang : MAU.chu} fillOpacity={i === 0 ? 1 : 0.85} />
      ))}
    </g>
  );
}

function VongDiem({ cx, cy, r, diem, mau, day }: { cx: number; cy: number; r: number; diem: number; mau: string; day: number }) {
  const chuVi = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + day * 1.6} fill="none" stroke={MAU.trang} strokeOpacity="0.14" strokeWidth="2" strokeDasharray="3 12" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth={day} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={mau} strokeWidth={day} strokeLinecap="round"
        strokeDasharray={`${(chuVi * diem) / 100} ${chuVi}`} transform={`rotate(-90 ${cx} ${cy})`} />
    </g>
  );
}

function TieuChi({ nd, rong, co }: { nd: NoiDungMaHai; rong: number; co: number }) {
  const mau = MAU_MUC_HAI[nd.m] ?? MAU.vang;
  return (
    <div style={{ display: "flex", gap: Math.round(co * 1.4) }}>
      {nd.c.map(([ma, pt]) => (
        <div key={ma} style={{ display: "flex", flexDirection: "column", width: rong }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: co, color: MAU.mo2 }}>
            <span>{TEN_TIEU_CHI_HAI[ma]}</span><span style={{ color: MAU.chu, marginLeft: 8 }}>{pt}%</span>
          </div>
          <div style={{ display: "flex", height: Math.round(co * 0.45), borderRadius: 99, background: "rgba(255,255,255,0.09)", marginTop: 8 }}>
            <div style={{ display: "flex", width: `${Math.max(pt, 3)}%`, height: "100%", borderRadius: 99, background: mau }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaHai(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("hp", ma) : null;
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/hai/${ma}?tu=${tu}`, `${GOC_QR}/tu-vi?tu=${tu}#hop-tham`) : `${GOC_QR}/tu-vi#hop-tham`;
  const mau = nd ? MAU_MUC_HAI[nd.m] ?? MAU.vang : MAU.vang;
  const [a, b] = nd ? tenHai(nd.a, nd.q) : ["Bạn", "Người ấy"];
  const sao = saoRai(bam(ma || "hai"), doc ? 90 : 70, W, H);

  // Bố cục (toạ độ tuyệt đối — satori không hỗ trợ fragment / bottom đáng tin): vòng điểm giữa, hai chòm sao hai bên.
  const L = doc
    ? { R: 165, cy: 560, day: 24, chomY: 150, chomX: 70, ten: 46, so: 150, muc: 54, mucY: 790, tcY: 890, tcRong: 290, tcCo: 28, qr: 200 }
    : { R: 112, cy: 250, day: 18, chomY: 120, chomX: 60, ten: 36, so: 96, muc: 38, mucY: 392, tcY: 476, tcRong: 196, tcCo: 19, qr: 132 };
  const { R, cy, day } = L;
  const cx = W / 2;
  const chomTrai = { x: L.chomX, y: L.chomY };
  const chomPhai = { x: W - L.chomX - 260, y: L.chomY };
  const noiTrai = [chomTrai.x + 250, chomTrai.y + 100] as const;
  const noiPhai = [chomPhai.x + 10, chomPhai.y + 100] as const;
  const tuyetDoi = (top: number, left: number, width: number) => ({ display: "flex", position: "absolute" as const, top, left, width });

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        background: `radial-gradient(circle at 50% ${Math.round((cy / H) * 100)}%, #2b2152 0%, ${MAU.nen} 62%)`, color: MAU.chu, fontFamily: "Sans",
      }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={o} />)}
          {ChomSao({ x: chomTrai.x, y: chomTrai.y, guong: false, tl: 1, mau: MAU.trang })}
          {ChomSao({ x: chomPhai.x, y: chomPhai.y, guong: true, tl: 1, mau: MAU.trang })}
          {/* hai sợi nối từ hai chòm vào vòng điểm */}
          <path d={`M${noiTrai[0]} ${noiTrai[1]} Q ${(noiTrai[0] + cx - R) / 2} ${(noiTrai[1] + cy) / 2 + 40} ${cx - R - day} ${cy}`} fill="none" stroke={MAU.vang} strokeOpacity="0.6" strokeWidth="2" strokeDasharray="2 8" />
          <path d={`M${noiPhai[0]} ${noiPhai[1]} Q ${(noiPhai[0] + cx + R) / 2} ${(noiPhai[1] + cy) / 2 + 40} ${cx + R + day} ${cy}`} fill="none" stroke={MAU.vang} strokeOpacity="0.6" strokeWidth="2" strokeDasharray="2 8" />
          {VongDiem({ cx, cy, r: R, diem: nd?.p ?? 0, mau, day })}
        </svg>

        <div style={{ ...tuyetDoi(doc ? 64 : 30, 0, W), justifyContent: "center", fontSize: doc ? 28 : 21, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>
          {nd ? `Xem lá số 2 người · ${TEN_QUAN_HE_HAI[nd.q]}` : "Xem lá số 2 người"}
        </div>

        {/* Tên hai người dưới hai chòm sao */}
        <div style={{ ...tuyetDoi(chomTrai.y + 196, chomTrai.x - 20, 300), justifyContent: "center", fontFamily: "Serif", fontSize: L.ten }}>{a}</div>
        <div style={{ ...tuyetDoi(chomPhai.y + 196, chomPhai.x - 20, 300), justifyContent: "center", fontFamily: "Serif", fontSize: L.ten }}>{b}</div>

        {/* Số điểm giữa vòng */}
        <div style={{ ...tuyetDoi(cy - L.so * 0.72, cx - 160, 320), flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: L.so, lineHeight: 1, color: nd ? MAU.chu : MAU.vang }}>{nd ? String(nd.p) : "?"}</div>
          <div style={{ display: "flex", fontSize: Math.round(L.so * 0.2), color: MAU.mo, marginTop: 4 }}>{nd ? "/ 100" : "điểm hai người"}</div>
        </div>

        <div style={{ ...tuyetDoi(L.mucY, 0, W), justifyContent: "center", fontFamily: "Serif", fontSize: L.muc, color: mau }}>
          {nd ? NHAN_MUC_HAI[nd.m] : "Hai người hoà ở đâu, khác ở đâu?"}
        </div>

        {doc ? (
          <div style={{ ...tuyetDoi(L.tcY, 0, W), flexDirection: "column", alignItems: "center" }}>
            {nd && <TieuChi nd={nd} rong={L.tcRong} co={L.tcCo} />}
            <div style={{ display: "flex", marginTop: nd ? 70 : 150 }}>
              <ChanQr url={qr} canh={L.qr} loiMoi="Quét để xem điểm của bạn với người ấy" doc />
            </div>
          </div>
        ) : (
          <div style={{ ...tuyetDoi(L.tcY, 56, W - 112), justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {nd && <TieuChi nd={nd} rong={L.tcRong} co={L.tcCo} />}
              <div style={{ display: "flex", fontSize: 16, color: MAU.mo, marginTop: 22 }}>
                Điểm tham khảo theo sách cổ — mối quan hệ do hai người vun đắp
              </div>
            </div>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để xem của bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
