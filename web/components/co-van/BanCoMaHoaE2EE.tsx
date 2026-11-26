"use client";
// Sổ nháp đối tác & mặt bằng — lưu trên trình duyệt này, khoá bằng mật khẩu (AES-GCM 256-bit + PBKDF2 210.000 vòng).
// Lưu / mở khoá không gửi gì lên mạng. KHÔNG phải mã hoá đầu cuối: khi người dùng bấm đưa sang Góp vốn hoặc Cẩm nang,
// ngày sinh / hướng được gửi lên máy chủ để tính (không lưu) — giao diện nói rõ điều này.
import { useEffect, useState } from "react";
import { Download, KeyRound, Lock, Plus, ShieldCheck, Trash2, Unlock } from "lucide-react";
import {
  docGoiBanCoMay,
  giaiMaBanCo,
  luuGoiBanCoMay,
  maHoaBanCo,
  xoaGoiBanCoMay,
  type DoiTacBanCo,
  type DuLieuBanCoKinhDoanh,
  type GoiMaHoaBanCo,
  type MatBangBanCo,
} from "@/lib/ma-hoa-ban-co";

const BAN_CO_RONG: DuLieuBanCoKinhDoanh = {
  phien_ban: 1,
  ten_ban_co: "Sổ nháp đối tác & mặt bằng của tôi",
  ghi_chu: "",
  doi_tac: [
    { id: "dt-1", ten: "Đối tác A", vai_tro_du_kien: "Tài chính", ngay: 15, thang: 5, nam: 1990, gioi_tinh: "nam", ty_le_du_kien: 50 },
    { id: "dt-2", ten: "Đối tác B", vai_tro_du_kien: "Thị trường", ngay: 20, thang: 9, nam: 1992, gioi_tinh: "nu", ty_le_du_kien: 50 },
  ],
  mat_bang: [
    { id: "mb-1", ten_diem: "Mặt bằng dự kiến #1", loai_hinh: "cua_hang", do_huong: 180, nam_xay: null },
  ],
};

export function BanCoMaHoaE2EE({
  onChuyenSangGopVon,
  onChuyenSangCamNang,
}: {
  onChuyenSangGopVon?: (ds: DoiTacBanCo[]) => void;
  onChuyenSangCamNang?: (ds: MatBangBanCo[]) => void;
}) {
  const [goiTrenMay, setGoiTrenMay] = useState<GoiMaHoaBanCo | null>(null);
  const [matKhau, setMatKhau] = useState("");
  const [banCo, setBanCo] = useState<DuLieuBanCoKinhDoanh | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    setGoiTrenMay(docGoiBanCoMay());
  }, []);

  async function taoHoacMoKhoa() {
    setLoi(null);
    setThongBao(null);
    try {
      if (goiTrenMay) {
        const plain = await giaiMaBanCo(goiTrenMay, matKhau);
        setBanCo(plain);
        setThongBao("Đã giải mã bàn cờ thành công ngay trên trình duyệt.");
      } else {
        const goi = await maHoaBanCo(BAN_CO_RONG, matKhau);
        luuGoiBanCoMay(goi);
        setGoiTrenMay(goi);
        setBanCo(BAN_CO_RONG);
        setThongBao("Đã tạo sổ nháp và khoá bằng mật khẩu trên máy này.");
      }
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không thể mở khoá bàn cờ.");
    }
  }

  async function luuMaHoa() {
    if (!banCo) return;
    setLoi(null);
    try {
      const goi = await maHoaBanCo(banCo, matKhau);
      luuGoiBanCoMay(goi);
      setGoiTrenMay(goi);
      setThongBao("Đã lưu sổ nháp trên trình duyệt này (khoá bằng mật khẩu, việc lưu không gửi gì lên mạng).");
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa lưu được bàn cờ.");
    }
  }

  function taiBanSaoLuu() {
    if (!goiTrenMay) return;
    const blob = new Blob([JSON.stringify(goiTrenMay, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "so-nhap-kinh-doanh.hbt.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5" data-testid="ban-co-e2ee">
      <div className="rounded-2xl border border-jade/35 bg-jade/5 p-4 text-xs leading-relaxed text-fg-muted">
        <p className="flex items-center gap-2 font-semibold text-jade">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          <span>Sổ nháp chỉ lưu trên trình duyệt này, khoá bằng mật khẩu của bạn</span>
        </p>
        <p className="mt-1">
          Sổ được khoá bằng mật khẩu rồi cất trong trình duyệt này; lưu và mở khoá không gửi gì lên mạng. Khi bạn bấm
          <strong> đưa sang Góp vốn hoặc Cẩm nang</strong>, ngày sinh và hướng mặt bằng sẽ được gửi lên máy chủ để tính rồi bỏ, không lưu.
          Ngày sinh của người khác chỉ ghi vào sổ khi người đó đồng ý. <strong>Quên mật khẩu thì không mở lại được</strong> — tải tệp sao lưu khi cần.
        </p>
      </div>

      {!banCo ? (
        <div className="rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="e2ee-khung-khoa">
          <h3 className="font-serif text-xl text-fg">
            {goiTrenMay ? "Mở sổ nháp đã lưu trên máy này" : "Tạo sổ nháp mới"}
          </h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              minLength={8}
              placeholder="Mật khẩu của sổ (tối thiểu 8 ký tự)"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              data-testid="e2ee-mat-khau"
              className="min-h-11 flex-1 rounded-xl border border-line bg-bg px-3.5 text-sm text-fg"
            />
            <button
              type="button"
              onClick={() => void taoHoacMoKhoa()}
              data-testid="e2ee-nut-mo-khoa"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-bg"
            >
              {goiTrenMay ? <Unlock className="size-4" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
              <span>{goiTrenMay ? "Mở sổ" : "Tạo sổ"}</span>
            </button>
          </div>
          {goiTrenMay && (
            <button
              type="button"
              onClick={() => { xoaGoiBanCoMay(); setGoiTrenMay(null); setThongBao("Đã xoá sổ nháp cũ trên máy."); }}
              className="mt-3 text-xs text-fg-faint underline hover:text-amber-300"
            >
              Quên mật khẩu? Xoá sổ trên máy để tạo sổ mới
            </button>
          )}
          {loi && <p role="alert" className="mt-2.5 text-xs text-amber-300" data-testid="e2ee-loi">{loi}</p>}
          {thongBao && <p className="mt-2.5 text-xs text-jade">{thongBao}</p>}
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-gold/40 bg-surface/40 p-5" data-testid="e2ee-khung-da-mo">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={banCo.ten_ban_co}
              onChange={(e) => setBanCo({ ...banCo, ten_ban_co: e.target.value })}
              aria-label="Tên bàn cờ"
              className="rounded-lg border border-line bg-bg px-3 py-1.5 font-serif text-lg text-fg"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void luuMaHoa()}
                data-testid="e2ee-nut-luu"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-bg"
              >
                Lưu mã hoá
              </button>
              <button
                type="button"
                onClick={taiBanSaoLuu}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
              >
                <Download className="size-3.5" aria-hidden /> Tải bản sao lưu (.e2ee.json)
              </button>
              <button
                type="button"
                onClick={() => { setBanCo(null); setMatKhau(""); }}
                data-testid="e2ee-nut-khoa-lai"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
              >
                <Lock className="size-3.5" aria-hidden /> Khoá lại
              </button>
            </div>
          </div>

          {thongBao && <p className="text-xs text-jade" data-testid="e2ee-thong-bao">{thongBao}</p>}
          {loi && <p role="alert" className="text-xs text-amber-300">{loi}</p>}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gold">Danh sách Đối tác / Co-founder đang cân nhắc</h4>
              <button
                type="button"
                onClick={() => setBanCo({
                  ...banCo,
                  doi_tac: [...banCo.doi_tac, { id: `dt-${Date.now()}`, ten: "Đối tác mới", vai_tro_du_kien: "Vận hành", ngay: 1, thang: 1, nam: 1990, gioi_tinh: "nam", ty_le_du_kien: 30 }],
                })}
                className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                <Plus className="size-3.5" /> Thêm đối tác
              </button>
            </div>
            {banCo.doi_tac.map((dtItem, idx) => (
              <div key={dtItem.id} className="grid grid-cols-2 gap-2 rounded-xl border border-line/60 bg-bg/60 p-2.5 text-xs sm:grid-cols-6">
                <input
                  type="text"
                  value={dtItem.ten}
                  onChange={(e) => {
                    const m = [...banCo.doi_tac];
                    m[idx] = { ...dtItem, ten: e.target.value };
                    setBanCo({ ...banCo, doi_tac: m });
                  }}
                  className="col-span-2 rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <input
                  type="number"
                  value={dtItem.ngay}
                  onChange={(e) => {
                    const m = [...banCo.doi_tac];
                    m[idx] = { ...dtItem, ngay: Number(e.target.value) };
                    setBanCo({ ...banCo, doi_tac: m });
                  }}
                  className="rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <input
                  type="number"
                  value={dtItem.thang}
                  onChange={(e) => {
                    const m = [...banCo.doi_tac];
                    m[idx] = { ...dtItem, thang: Number(e.target.value) };
                    setBanCo({ ...banCo, doi_tac: m });
                  }}
                  className="rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <input
                  type="number"
                  value={dtItem.nam}
                  onChange={(e) => {
                    const m = [...banCo.doi_tac];
                    m[idx] = { ...dtItem, nam: Number(e.target.value) };
                    setBanCo({ ...banCo, doi_tac: m });
                  }}
                  className="rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <button
                  type="button"
                  onClick={() => setBanCo({ ...banCo, doi_tac: banCo.doi_tac.filter((x) => x.id !== dtItem.id) })}
                  aria-label="Xoá đối tác"
                  className="justify-self-end text-fg-faint hover:text-amber-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {banCo.doi_tac.length >= 2 && onChuyenSangGopVon && (
              <button
                type="button"
                onClick={() => onChuyenSangGopVon(banCo.doi_tac)}
                data-testid="e2ee-dua-sang-gop-von"
                className="mt-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold hover:bg-gold/20"
              >
                Đưa {banCo.doi_tac.length} người này sang Khi góp vốn (gửi ngày sinh để tính) →
              </button>
            )}
          </div>

          <div className="space-y-2 border-t border-line/50 pt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gold">Mặt bằng / Địa điểm đang khảo sát</h4>
              <button
                type="button"
                onClick={() => setBanCo({
                  ...banCo,
                  mat_bang: [...banCo.mat_bang, { id: `mb-${Date.now()}`, ten_diem: `Mặt bằng #${banCo.mat_bang.length + 1}`, loai_hinh: "cua_hang", do_huong: 135, nam_xay: null }],
                })}
                className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                <Plus className="size-3.5" /> Thêm mặt bằng
              </button>
            </div>
            {banCo.mat_bang.map((mbItem, idx) => (
              <div key={mbItem.id} className="grid grid-cols-2 gap-2 rounded-xl border border-line/60 bg-bg/60 p-2.5 text-xs sm:grid-cols-5">
                <input
                  type="text"
                  value={mbItem.ten_diem}
                  onChange={(e) => {
                    const m = [...banCo.mat_bang];
                    m[idx] = { ...mbItem, ten_diem: e.target.value };
                    setBanCo({ ...banCo, mat_bang: m });
                  }}
                  className="col-span-2 rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <input
                  type="number"
                  step="0.1"
                  value={mbItem.do_huong}
                  onChange={(e) => {
                    const m = [...banCo.mat_bang];
                    m[idx] = { ...mbItem, do_huong: Number(e.target.value) };
                    setBanCo({ ...banCo, mat_bang: m });
                  }}
                  className="rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <input
                  type="number"
                  value={mbItem.nam_xay ?? ""}
                  placeholder="Năm xây (nếu biết)"
                  onChange={(e) => {
                    const m = [...banCo.mat_bang];
                    m[idx] = { ...mbItem, nam_xay: e.target.value ? Number(e.target.value) : null };
                    setBanCo({ ...banCo, mat_bang: m });
                  }}
                  className="rounded border border-line bg-bg px-2 py-1 text-fg"
                />
                <button
                  type="button"
                  onClick={() => setBanCo({ ...banCo, mat_bang: banCo.mat_bang.filter((x) => x.id !== mbItem.id) })}
                  aria-label="Xoá mặt bằng"
                  className="justify-self-end text-fg-faint hover:text-amber-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {banCo.mat_bang.length >= 1 && onChuyenSangCamNang && (
              <button
                type="button"
                onClick={() => onChuyenSangCamNang(banCo.mat_bang)}
                data-testid="e2ee-dua-sang-cam-nang"
                className="mt-2 rounded-full border border-jade/50 bg-jade/10 px-4 py-1.5 text-xs font-medium text-jade hover:bg-jade/20"
              >
                Đưa {banCo.mat_bang.length} mặt bằng này sang Cẩm nang mặt bằng (gửi hướng để tính) →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
