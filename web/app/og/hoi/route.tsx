// GET /og/hoi?ma=…[&khung=doc] — HD-CS đợt 3 (ý 2): ảnh thẻ "một câu trả lời". Concept: câu hỏi chuẩn ở trên, hình của câu
// trả lời vẽ lớn giữa trời đêm (cột năm hành · con số · bàn 12 cung · vòng 9 năm), QR + hieuban.com ở chân.
// Dữ liệu CHỈ từ mã đã ký (docMaHoi): mảng, câu hỏi chuẩn, khối dạng gọn — không chữ người dùng gõ, không ngày sinh.
import { ImageResponse } from "next/og";
import { docMaHoi, tuTuMa } from "@/lib/ma-moi";
import { bam, ChanQr, CO_ANH, khungTuThamSo, MAU, napPhong, saoRai } from "@/lib/og-chung";
import { GOC_QR, urlQr } from "@/lib/the-chia-se";
import { DUONG_MANG, TEN_MANG, tieuDeThe, veKhoi, type TheGon } from "@/lib/the-hoi";

export const runtime = "nodejs";

const SAC: Record<string, string> = { chinh: MAU.vang, hop: MAU.ngoc, trung: MAU.trang, nhat: "#3a3a63" };
const F = { display: "flex" } as const;

function Hinh({ g, rong, cao }: { g: TheGon; rong: number; cao: number }) {
  const k = veKhoi(g);
  switch (k.kieu) {
    case "cot": {
      const lon = Math.max(1, ...k.muc.map((m) => Number(m.gia_tri)));
      const r = rong / 5 - 24;
      return (
        <div style={{ ...F, width: rong, height: cao, alignItems: "flex-end", justifyContent: "space-between" }}>
          {k.muc.map((m) => (
            <div key={m.nhan} style={{ ...F, flexDirection: "column", alignItems: "center", width: r + 16 }}>
              <div style={{ ...F, fontSize: 30, color: SAC[m.sac ?? "trung"], marginBottom: 8 }}>{`${m.gia_tri}%`}</div>
              <div style={{ ...F, width: r, height: Math.max(8, (Number(m.gia_tri) / lon) * (cao - 110)), borderRadius: 10, background: SAC[m.sac ?? "trung"] }} />
              <div style={{ ...F, fontSize: 30, marginTop: 12, color: MAU.chu }}>{m.nhan}</div>
            </div>
          ))}
        </div>
      );
    }
    case "so":
      return (
        <div style={{ ...F, width: rong, height: cao, alignItems: "center", justifyContent: "center", gap: 24 }}>
          {k.muc.map((m) => (
            <div key={m.nhan} style={{ ...F, flexDirection: "column", alignItems: "center", padding: "24px 26px", borderRadius: 24, border: `2px solid ${m.sac === "chinh" ? MAU.vang : "#3a3a63"}` }}>
              <div style={{ ...F, fontFamily: "Serif", fontSize: 92, lineHeight: 1, color: m.sac === "chinh" ? MAU.vang : MAU.trang }}>{String(m.gia_tri)}</div>
              <div style={{ ...F, fontSize: 24, marginTop: 10, color: MAU.mo2 }}>{m.nhan}</div>
            </div>
          ))}
        </div>
      );
    case "chu_ky":
      return (
        <div style={{ ...F, width: rong, height: cao, flexDirection: "column", justifyContent: "center", gap: 18 }}>
          <div style={{ ...F, gap: 12 }}>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
              <div key={s} style={{ ...F, width: (rong - 96) / 9, height: 110, borderRadius: 16, alignItems: "center", justifyContent: "center", fontSize: 40,
                background: s === k.hien_tai ? MAU.vang : s < k.hien_tai ? "#3b3524" : "#1d1d3a", color: s === k.hien_tai ? MAU.nen : MAU.mo2 }}>{String(s)}</div>
            ))}
          </div>
          <div style={{ ...F, fontSize: 28, color: MAU.mo2 }}>{`Năm cá nhân số ${k.hien_tai}`}</div>
        </div>
      );
    case "cung": {
      const vt: Record<string, [number, number]> = { "Tỵ": [0, 0], "Ngọ": [0, 1], "Mùi": [0, 2], "Thân": [0, 3], "Thìn": [1, 0], "Dậu": [1, 3],
        "Mão": [2, 0], "Tuất": [2, 3], "Dần": [3, 0], "Sửu": [3, 1], "Tý": [3, 2], "Hợi": [3, 3] };
      const c = Math.min(rong, cao) / 4;
      const hoi = k.muc.find((m) => m.vai === "hoi");
      return (
        <div style={{ ...F, width: c * 4, height: c * 4, position: "relative" }}>
          {k.muc.map((m) => {
            const [hang, cot] = vt[m.chi] ?? [0, 0];
            const mau = m.vai === "hoi" ? MAU.vang : m.vai === "tam_hop" ? MAU.ngoc : m.vai === "xung" ? MAU.trang : "#3a3a63";
            return (
              <div key={m.chi} style={{ ...F, position: "absolute", top: hang * c + 4, left: cot * c + 4, width: c - 8, height: c - 8, borderRadius: 12,
                border: `2px ${m.vai === "xung" ? "dashed" : "solid"} ${mau}`, background: m.vai === "hoi" ? "rgba(233,196,106,0.18)" : "transparent",
                padding: 10, flexDirection: "column", justifyContent: "space-between", fontSize: 20, color: m.vai ? mau : MAU.mo }}>
                <div style={F}>{m.nhan}</div>
                <div style={{ ...F, fontSize: 16, color: MAU.mo2 }}>{(m.sao ?? []).join(", ")}</div>
              </div>
            );
          })}
          <div style={{ ...F, position: "absolute", top: c, left: c, width: c * 2, height: c * 2, alignItems: "center", justifyContent: "center", fontFamily: "Serif", fontSize: 44, color: MAU.vang }}>{hoi?.nhan ?? ""}</div>
        </div>
      );
    }
    default:
      return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const nd = docMaHoi(ma);
  const khung = khungTuThamSo(url.searchParams.get("khung"));
  const doc = khung === "doc";
  const { width: W, height: H } = CO_ANH[khung];
  const fonts = await napPhong();
  const tu = nd ? tuTuMa("hq", ma) : null;
  const dich = nd ? DUONG_MANG[nd.m] : "/huyen-hoc";
  const qr = nd && tu ? urlQr(`${GOC_QR}/the/hoi/${ma}?tu=${tu}`, `${GOC_QR}${dich}?tu=${tu}`) : `${GOC_QR}${dich}`;
  const sao = saoRai(bam(ma || "hoi"), doc ? 110 : 70, W, H);
  const g: TheGon = nd?.g ?? { t: "cot", v: [20, 20, 20, 20, 20] };
  const L = doc ? { hinhW: 920, hinhH: 620, qr: 190, top: 330 } : { hinhW: 560, hinhH: 430, qr: 136, top: 120 };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Sans", color: MAU.chu,
        background: `radial-gradient(circle at ${doc ? "50% 40%" : "70% 50%"}, #1c1f3d 0%, #121632 40%, ${MAU.nen} 78%)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {sao.map(([x, y, r, op], i) => <circle key={i} cx={x} cy={y} r={r} fill={MAU.chu} fillOpacity={op} />)}
        </svg>
        <div style={{ display: "flex", position: "absolute", top: doc ? 90 : 70, left: doc ? 80 : 64, width: doc ? W - 160 : 470, flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: doc ? 26 : 17, letterSpacing: 6, color: MAU.mo, textTransform: "uppercase" }}>
            {nd ? TEN_MANG[nd.m] : "Hiểu Bản Thân"} · Hỏi đáp chuyên sâu
          </div>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: doc ? 60 : 42, marginTop: 10, lineHeight: 1.15 }}>
            {nd ? `“${nd.c}”` : "Hỏi một câu về chính bạn"}
          </div>
          <div style={{ display: "flex", fontSize: doc ? 30 : 22, marginTop: 14, color: MAU.vang }}>{tieuDeThe(g)}</div>
          {!doc && <div style={{ display: "flex", fontSize: 18, color: MAU.mo2, marginTop: 18, lineHeight: 1.4 }}>Thẻ chỉ mang hình của câu trả lời — không ngày sinh, không lời trả lời.</div>}
        </div>
        <div style={{ display: "flex", position: "absolute", top: L.top, left: doc ? (W - L.hinhW) / 2 : W - L.hinhW - 60, width: L.hinhW, height: L.hinhH, justifyContent: "center", alignItems: "center" }}>
          <Hinh g={g} rong={L.hinhW} cao={L.hinhH} />
        </div>
        {doc ? (
          <div style={{ display: "flex", position: "absolute", top: 1060, left: 0, width: W, flexDirection: "column", alignItems: "center" }}>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để hỏi câu này về chính bạn" doc />
          </div>
        ) : (
          <div style={{ display: "flex", position: "absolute", top: H - L.qr - 40, left: 64, width: 470 }}>
            <ChanQr url={qr} canh={L.qr} loiMoi="Quét để hỏi câu này về chính bạn" />
          </div>
        )}
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) },
  );
}
