// QT-1 — nói chuyện với GitHub cho trang quản trị. Chỉ chạy ở MÁY CHỦ. Git là nguồn gốc của kho tri thức:
// đọc file từ nhánh main, "Xuất bản" = tạo nhánh quan-tri/… + commit + mở PR → CI kiểm → chủ dự án merge.
// Token: env QUAN_TRI_GITHUB_TOKEN (fine-grained, CHỈ repo này, quyền Contents + Pull requests: Read and write).

export const THU_MUC_KB = "engine/app/kb/data";
export const NHANH_GOC = "main";
export const TIEN_TO_NHANH = "quan-tri/";
/** File sửa bằng công cụ riêng (sổ thẩm định: scripts/tham_dinh.py) — trang quản trị chỉ cho xem. */
export const CHI_XEM = new Set(["tham_dinh.json"]);
export const TEN_TEP = /^[a-z0-9_]+\.json$/;

const repo = () => process.env.QUAN_TRI_GITHUB_REPO || "mrducluan/hieubanthan";
export const coGithub = () => Boolean(process.env.QUAN_TRI_GITHUB_TOKEN);
export const urlRepo = () => `https://github.com/${repo()}`;

export class LoiGithub extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

async function gh<T>(duong: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.QUAN_TRI_GITHUB_TOKEN;
  if (!token) throw new LoiGithub(503, "Chưa đặt QUAN_TRI_GITHUB_TOKEN trên Vercel.");
  const r = await fetch(`${process.env.QUAN_TRI_GITHUB_API || "https://api.github.com"}/repos/${repo()}${duong}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      accept: "application/vnd.github+json", authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28", ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
  if (!r.ok) {
    const noi = r.status === 401 || r.status === 403 ? "Token GitHub sai, hết hạn hoặc thiếu quyền (Contents + Pull requests: Read and write)."
      : r.status === 404 ? "Không thấy repo/file trên GitHub (kiểm tra token có quyền repo này)."
      : r.status === 409 || r.status === 422 ? "GitHub từ chối vì file vừa đổi — tải lại trang rồi sửa lại."
      : `GitHub lỗi ${r.status}.`;
    throw new LoiGithub(r.status === 422 ? 409 : r.status, noi);
  }
  return (await r.json()) as T;
}

export interface TepKb { ten: string; kichThuoc: number; chiXem: boolean }

export async function danhSachTepKb(): Promise<TepKb[]> {
  const ds = await gh<{ name: string; size: number; type: string }[]>(`/contents/${THU_MUC_KB}?ref=${NHANH_GOC}`);
  return ds.filter((f) => f.type === "file" && TEN_TEP.test(f.name))
    .map((f) => ({ ten: f.name, kichThuoc: f.size, chiXem: CHI_XEM.has(f.name) }))
    .sort((a, b) => a.ten.localeCompare(b.ten));
}

export async function docTepKb(ten: string): Promise<{ text: string; sha: string }> {
  if (!TEN_TEP.test(ten)) throw new LoiGithub(400, "Tên file không hợp lệ.");
  const f = await gh<{ content: string; encoding: string; sha: string }>(`/contents/${THU_MUC_KB}/${ten}?ref=${NHANH_GOC}`);
  if (f.encoding !== "base64") throw new LoiGithub(502, "File quá lớn để đọc qua GitHub API.");
  return { text: Buffer.from(f.content, "base64").toString("utf8"), sha: f.sha };
}

export interface PrMo { so: number; tieuDe: string; url: string; nhanh: string; luc: string }

export async function prQuanTriDangMo(): Promise<PrMo[]> {
  const ds = await gh<{ number: number; title: string; html_url: string; head: { ref: string }; created_at: string }[]>(
    `/pulls?state=open&base=${NHANH_GOC}&per_page=50`);
  return ds.filter((p) => p.head.ref.startsWith(TIEN_TO_NHANH))
    .map((p) => ({ so: p.number, tieuDe: p.title, url: p.html_url, nhanh: p.head.ref, luc: p.created_at }));
}

/** Tạo nhánh từ main, ghi file mới (GitHub tự từ chối nếu file trên main đã khác `shaGoc`), mở PR. */
export async function moPrSuaKb(o: { ten: string; shaGoc: string; text: string; tieuDe: string; moTa: string }): Promise<PrMo> {
  const dau = await gh<{ object: { sha: string } }>(`/git/ref/heads/${NHANH_GOC}`);
  const tem = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const nhanh = `${TIEN_TO_NHANH}${o.ten.replace(/\.json$/, "").replace(/_/g, "-")}-${tem}`;
  await gh(`/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${nhanh}`, sha: dau.object.sha }) });
  try {
    await gh(`/contents/${THU_MUC_KB}/${o.ten}`, {
      method: "PUT",
      body: JSON.stringify({ message: o.tieuDe, content: Buffer.from(o.text, "utf8").toString("base64"), sha: o.shaGoc, branch: nhanh }),
    });
  } catch (e) {
    await gh(`/git/refs/heads/${nhanh}`, { method: "DELETE" }).catch(() => { /* nhánh rỗng, xoá được thì xoá */ });
    throw e;
  }
  const pr = await gh<{ number: number; title: string; html_url: string; created_at: string }>(`/pulls`, {
    method: "POST", body: JSON.stringify({ title: o.tieuDe, head: nhanh, base: NHANH_GOC, body: o.moTa }),
  });
  return { so: pr.number, tieuDe: pr.title, url: pr.html_url, nhanh, luc: pr.created_at };
}
