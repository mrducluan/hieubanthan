"use client";
// Studio Doanh Chủ — hỗ trợ 3 chế độ:
//   1. Xem thử 1 chạm (dữ liệu mẫu 4 vai trò giả lập phía server)
//   2. Nhập trực tiếp 1–8 cộng sự (khi đã có thoả thuận & đồng ý theo Luật BVDLCN 91/2025/QH15 — checkbox chưa tích sẵn)
//   3. Gửi link mời bảo mật AES-256-GCM (nhân sự tự xác nhận trên máy mình, không lộ ngày sinh cho ông chủ)
import { useRef, useState } from "react";
import { Building2, Check, Copy, Link2, Lock, Plus, Sparkles, Trash2, UserPlus, Users } from "lucide-react";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import type { CapQuanLy, KetQuaDoanhChu, NhomViec } from "@/lib/doanh-chu";
import { RadarNguHanh } from "./RadarNguHanh";
import { MaTranHaiChieu } from "./MaTranHaiChieu";

interface MaThanhVienDaThem {
  id: string;
  token: string;
  nhan: string;
}

interface ThanhVienTuNhapForm {
  id: string;
  ten: string;
  vai_tro: string;
  nhom_viec: NhomViec;
  ngay: string;
  thang: string;
  nam: string;
  gioi_tinh: "nam" | "nu";
}

function taoThanhVienTrong(thuTu: number): ThanhVienTuNhapForm {
  return {
    id: `tv-${Date.now()}-${thuTu}`,
    ten: "",
    vai_tro: "",
    nhom_viec: "",
    ngay: "10",
    thang: "3",
    nam: "1992",
    gioi_tinh: "nam",
  };
}

export function StudioDoanhChu() {
  const namMacDinh = Math.min(2050, Math.max(2020, new Date().getFullYear()));
  const [cheDoDangGoi, setCheDoDangGoi] = useState<"mau" | "tu_nhap" | "doi_ngu">("tu_nhap");
  const [tabBuoc2, setTabBuoc2] = useState<"tu_nhap" | "gui_link">("tu_nhap");
  const [namXem, setNamXem] = useState<number>(namMacDinh);
  const [capQuanLy, setCapQuanLy] = useState<CapQuanLy>("chu_dn");

  // Bước 1: Thông tin Ông chủ
  const [tenChu, setTenChu] = useState<string>("");
  const [vaiTroChu, setVaiTroChu] = useState<string>("Chủ doanh nghiệp");
  const [ngayChu, setNgayChu] = useState<string>("15");
  const [thangChu, setThangChu] = useState<string>("8");
  const [namChu, setNamChu] = useState<string>("1986");
  const [gioiTinhChu, setGioiTinhChu] = useState<"nam" | "nu">("nam");

  // Bước 2A: Nhập trực tiếp (theo DC-1, checkbox cam kết chưa tích sẵn)
  const [dsTuNhap, setDsTuNhap] = useState<ThanhVienTuNhapForm[]>([
    { id: "tv-init-1", ten: "", vai_tro: "Vận hành", nhom_viec: "van_hanh", ngay: "10", thang: "3", nam: "1992", gioi_tinh: "nu" },
  ]);
  const [camKetThoaThuan, setCamKetThoaThuan] = useState<boolean>(false);

  // Bước 2B: Link mời bảo mật AES-256-GCM
  const [tenNhom, setTenNhom] = useState<string>("Ban điều hành");
  const [maMoi, setMaMoi] = useState<string>("");
  const [dangTaoLink, setDangTaoLink] = useState<boolean>(false);
  const [daChepLink, setDaChepLink] = useState<boolean>(false);
  const [oDanMa, setODanMa] = useState<string>("");
  const [dsMaTv, setDsMaTv] = useState<MaThanhVienDaThem[]>([]);

  // Trạng thái gọi phân tích & tự cuộn xuống kết quả
  const [dangTai, setDangTai] = useState<boolean>(false);
  const [loi, setLoi] = useState<string>("");
  const [xacNhanSao, setXacNhanSao] = useState<{
    thongBao: string;
    gia: number;
    cheDo: "tu_nhap" | "doi_ngu";
  } | null>(null);
  const [ketQua, setKetQua] = useState<KetQuaDoanhChu | null>(null);
  const refKetQua = useRef<HTMLDivElement>(null);

  const linkMoi =
    maMoi && typeof window !== "undefined"
      ? `${window.location.origin}/ban-do-doi-ngu/moi?ma=${encodeURIComponent(maMoi)}`
      : "";

  function capNhatTuNhap(id: string, field: keyof ThanhVienTuNhapForm, value: string) {
    setDsTuNhap((prev) => prev.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  }

  function themDongTuNhap() {
    if (dsTuNhap.length >= 8) return;
    setDsTuNhap((prev) => [...prev, taoThanhVienTrong(prev.length + 1)]);
  }

  function xoaDongTuNhap(id: string) {
    if (dsTuNhap.length <= 1) return;
    setDsTuNhap((prev) => prev.filter((x) => x.id !== id));
  }

  async function taoLinkMoi() {
    setLoi("");
    setDangTaoLink(true);
    try {
      const r = await fetch("/api/doanh-chu/moi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ten_nhom: tenNhom.trim() || "Đội ngũ cốt cán" }),
      });
      const data = (await r.json().catch(() => null)) as { ma_moi?: string; error?: string } | null;
      if (!r.ok || !data?.ma_moi) {
        setLoi(data?.error ?? "Không tạo được liên kết mời.");
        return;
      }
      setMaMoi(data.ma_moi);
      setDsMaTv([]);
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangTaoLink(false);
    }
  }

  async function chepLink() {
    if (!linkMoi) return;
    try {
      await navigator.clipboard.writeText(linkMoi);
      setDaChepLink(true);
      setTimeout(() => setDaChepLink(false), 2000);
    } catch {
      /* trình duyệt chặn clipboard */
    }
  }

  function themMaThanhVien() {
    setLoi("");
    const tok = oDanMa.trim();
    if (!tok.startsWith("dc1.") || tok.length < 30) {
      setLoi("Mã bảo mật chưa đúng định dạng — bạn nhớ chép trọn vẹn đoạn mã cộng sự gửi lại từ liên kết mời ở trên.");
      return;
    }
    if (dsMaTv.some((x) => x.token === tok)) {
      setLoi("Mã xác nhận này đã có trong danh sách.");
      return;
    }
    if (dsMaTv.length >= 8) {
      setLoi("Tối đa 8 cộng sự trong một bản đồ đội ngũ.");
      return;
    }
    setDsMaTv((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, token: tok, nhan: `Cộng sự #${prev.length + 1}` },
    ]);
    setODanMa("");
  }

  async function chayPhanTich(cheDoGoi: "mau" | "tu_nhap" | "doi_ngu", dongYSao = false) {
    setLoi("");
    setXacNhanSao(null);

    if (cheDoGoi === "tu_nhap") {
      if (!camKetThoaThuan) {
        setLoi("Vui lòng tích xác nhận đã có thoả thuận riêng & sự đồng ý của từng thành viên trước khi phân tích.");
        return;
      }
    }

    setDangTai(true);
    setCheDoDangGoi(cheDoGoi);
    try {
      const ongChuPayload = {
        ten: tenChu.trim() || "Ông chủ",
        vai_tro: vaiTroChu.trim() || "Chủ doanh nghiệp",
        ngay: Number(ngayChu),
        thang: Number(thangChu),
        nam: Number(namChu),
        gioi_tinh: gioiTinhChu,
      };

      const body =
        cheDoGoi === "mau"
          ? { che_do: "mau" as const, nam_xem: namXem, cap_quan_ly: capQuanLy }
          : cheDoGoi === "tu_nhap"
            ? {
                che_do: "tu_nhap" as const,
                ong_chu: ongChuPayload,
                doi_ngu: dsTuNhap.map((tv, idx) => ({
                  ten: tv.ten.trim() || `Cộng sự #${idx + 1}`,
                  vai_tro: tv.vai_tro.trim(),
                  nhom_viec: tv.nhom_viec,
                  ngay: Number(tv.ngay),
                  thang: Number(tv.thang),
                  nam: Number(tv.nam),
                  gioi_tinh: tv.gioi_tinh,
                  dong_y_tu_nguyen: true as const,
                })),
                nam_xem: namXem,
                cap_quan_ly: capQuanLy,
                cam_ket_thoa_thuan: true as const,
              }
            : {
                che_do: "doi_ngu" as const,
                ma_moi: maMoi,
                ong_chu: ongChuPayload,
                tv_tokens: dsMaTv.map((x) => x.token),
                nam_xem: namXem,
                cap_quan_ly: capQuanLy,
              };

      const r = await fetch("/api/doanh-chu", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(dongYSao ? { "x-dong-y-sao": "1" } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = (await r.json().catch(() => null)) as
        | (KetQuaDoanhChu & { error?: string; can?: string; gia?: number })
        | null;

      if (r.status === 402 && data?.can === "xac_nhan_sao" && typeof data.gia === "number" && cheDoGoi !== "mau") {
        setXacNhanSao({
          thongBao: data.error ?? `Xác nhận dùng ${data.gia} Sao.`,
          gia: data.gia,
          cheDo: cheDoGoi,
        });
        return;
      }
      if (!r.ok || !data || !data.can_bang_ngu_hanh) {
        setLoi(data?.error ?? "Không thể phân tích lúc này. Kiểm tra lại ngày sinh và thông tin cộng sự.");
        return;
      }
      setKetQua(data);
      requestAnimationFrame(() => {
        refKetQua.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setLoi("Không kết nối được máy chủ.");
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* 3 giá trị thực chiến chạm thẳng nỗi đau vận hành của chủ doanh nghiệp */}
      <div className="grid gap-3.5 md:grid-cols-3">
        {CHU_DOANH_CHU.loi_ich.map((item, idx) => (
          <div key={idx} className="glass rounded-2xl p-4">
            <p className="text-sm font-semibold text-gold">{item.tieu_de}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{item.mo_ta}</p>
          </div>
        ))}
      </div>

      {/* Thanh hành động nhanh: Trải nghiệm 1 chạm */}
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10 text-gold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{CHU_DOANH_CHU.che_do.tieu_de_thu}</p>
            <p className="text-xs text-fg-muted">{CHU_DOANH_CHU.che_do.mo_ta_thu}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => chayPhanTich("mau")}
          disabled={dangTai}
          className="vien-chay inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-gold transition disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          <span>{dangTai && cheDoDangGoi === "mau" ? CHU_DOANH_CHU.che_do.dang_tai_mau : CHU_DOANH_CHU.che_do.xem_mau}</span>
        </button>
      </div>

      {/* Khối nhập liệu 2 bước */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Bước 1: Thông tin Ông chủ */}
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold">
            <Building2 className="h-4 w-4" />
            <h2>{CHU_DOANH_CHU.buoc_nhap.buoc_1_tieu_de}</h2>
          </div>

          <div className="mt-4">
            <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.cap_quan_ly_nhan}</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {CHU_DOANH_CHU.buoc_nhap.cap_quan_ly_ds.map((c) => (
                <button
                  key={c.ma}
                  type="button"
                  onClick={() => {
                    setCapQuanLy(c.ma);
                    setVaiTroChu(c.ten);
                  }}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium transition ${
                    capQuanLy === c.ma
                      ? "border-gold/60 bg-gold/15 text-gold"
                      : "border-line/70 bg-bg/50 text-fg-muted hover:text-fg"
                  }`}
                >
                  {c.ten}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.ten_nhan}</label>
              <input
                type="text"
                value={tenChu}
                onChange={(e) => setTenChu(e.target.value)}
                placeholder="VD: Anh Hoàng"
                maxLength={60}
                className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg placeholder:text-fg-faint"
              />
            </div>
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.vai_tro_nhan}</label>
              <input
                type="text"
                value={vaiTroChu}
                onChange={(e) => setVaiTroChu(e.target.value)}
                maxLength={60}
                className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg"
              />
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.ngay_nhan}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={ngayChu}
                onChange={(e) => setNgayChu(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
              />
            </div>
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.thang_nhan}</label>
              <input
                type="number"
                min={1}
                max={12}
                value={thangChu}
                onChange={(e) => setThangChu(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
              />
            </div>
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.nam_nhan}</label>
              <input
                type="number"
                min={1930}
                max={2025}
                value={namChu}
                onChange={(e) => setNamChu(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
              />
            </div>
          </div>

          <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.gioi_tinh_nhan}</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["nam", "nu"] as const).map((gt) => (
                  <button
                    key={gt}
                    type="button"
                    onClick={() => setGioiTinhChu(gt)}
                    className={`rounded-xl border py-2 text-sm transition ${
                      gioiTinhChu === gt
                        ? "border-gold/60 bg-gold/15 text-gold"
                        : "border-line/70 bg-bg/50 text-fg-muted hover:text-fg"
                    }`}
                  >
                    {gt === "nam" ? CHU_DOANH_CHU.buoc_nhap.nam : CHU_DOANH_CHU.buoc_nhap.nu}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.nam_xem_nhan}</label>
              <input
                type="number"
                min={2020}
                max={2050}
                value={namXem}
                onChange={(e) => setNamXem(Number(e.target.value) || namMacDinh)}
                className="mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm tabular-nums text-fg"
              />
            </div>
          </div>
        </div>

        {/* Bước 2: 2 Tab (Nhập trực tiếp vs Gửi link mời bảo mật AES-256-GCM) */}
        <div className="glass rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-jade">
              <Users className="h-4 w-4" />
              <h2>{CHU_DOANH_CHU.buoc_nhap.buoc_2_tieu_de}</h2>
            </div>

            <div className="inline-flex rounded-full border border-line/70 bg-bg/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTabBuoc2("tu_nhap")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                  tabBuoc2 === "tu_nhap" ? "bg-gold/20 text-gold" : "text-fg-muted hover:text-fg"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{CHU_DOANH_CHU.buoc_nhap.tab_tu_nhap}</span>
              </button>
              <button
                type="button"
                onClick={() => setTabBuoc2("gui_link")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                  tabBuoc2 === "gui_link" ? "bg-jade/20 text-jade" : "text-fg-muted hover:text-fg"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{CHU_DOANH_CHU.buoc_nhap.tab_gui_link}</span>
              </button>
            </div>
          </div>

          {tabBuoc2 === "tu_nhap" ? (
            <div className="mt-3 space-y-3.5">
              <p className="text-xs leading-relaxed text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.tu_nhap_mo_ta}</p>

              <div className="space-y-2.5">
                {dsTuNhap.map((tv, idx) => (
                  <div key={tv.id} className="rounded-2xl border border-line/70 bg-bg/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gold">Cộng sự #{idx + 1}</span>
                      {dsTuNhap.length > 1 && (
                        <button
                          type="button"
                          onClick={() => xoaDongTuNhap(tv.id)}
                          className="inline-flex items-center gap-1 text-xs text-fg-faint hover:text-[#ef8a6f]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{CHU_DOANH_CHU.buoc_nhap.xoa_thanh_vien}</span>
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        value={tv.ten}
                        onChange={(e) => capNhatTuNhap(tv.id, "ten", e.target.value)}
                        placeholder={`Biệt danh (VD: Minh)`}
                        maxLength={60}
                        className="rounded-xl border border-line bg-surface/70 px-3 py-1.5 text-xs text-fg placeholder:text-fg-faint"
                      />
                      <select
                        value={tv.nhom_viec}
                        onChange={(e) => capNhatTuNhap(tv.id, "nhom_viec", e.target.value)}
                        aria-label="Nhóm công việc chính"
                        className="rounded-xl border border-line bg-surface/70 px-2.5 py-1.5 text-xs text-fg"
                      >
                        {CHU_DOANH_CHU.buoc_nhap.nhom_viec_ds.map((nv) => (
                          <option key={nv.ma || "none"} value={nv.ma}>
                            {nv.ten}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={tv.vai_tro}
                        onChange={(e) => capNhatTuNhap(tv.id, "vai_tro", e.target.value)}
                        placeholder="Chức danh (tùy chọn)"
                        maxLength={60}
                        className="rounded-xl border border-line bg-surface/70 px-3 py-1.5 text-xs text-fg placeholder:text-fg-faint"
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={tv.ngay}
                        onChange={(e) => capNhatTuNhap(tv.id, "ngay", e.target.value)}
                        aria-label="Ngày sinh"
                        placeholder="Ngày"
                        className="rounded-xl border border-line bg-surface/70 px-2.5 py-1.5 text-xs tabular-nums text-fg"
                      />
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={tv.thang}
                        onChange={(e) => capNhatTuNhap(tv.id, "thang", e.target.value)}
                        aria-label="Tháng sinh"
                        placeholder="Tháng"
                        className="rounded-xl border border-line bg-surface/70 px-2.5 py-1.5 text-xs tabular-nums text-fg"
                      />
                      <input
                        type="number"
                        min={1930}
                        max={2025}
                        value={tv.nam}
                        onChange={(e) => capNhatTuNhap(tv.id, "nam", e.target.value)}
                        aria-label="Năm sinh"
                        placeholder="Năm"
                        className="rounded-xl border border-line bg-surface/70 px-2.5 py-1.5 text-xs tabular-nums text-fg"
                      />
                      <select
                        value={tv.gioi_tinh}
                        onChange={(e) => capNhatTuNhap(tv.id, "gioi_tinh", e.target.value as "nam" | "nu")}
                        aria-label="Giới tính"
                        className="rounded-xl border border-line bg-surface/70 px-2 py-1.5 text-xs text-fg"
                      >
                        <option value="nam">{CHU_DOANH_CHU.buoc_nhap.nam}</option>
                        <option value="nu">{CHU_DOANH_CHU.buoc_nhap.nu}</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {dsTuNhap.length < 8 && (
                <button
                  type="button"
                  onClick={themDongTuNhap}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-fg hover:border-gold/50 hover:text-gold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{CHU_DOANH_CHU.buoc_nhap.nut_them_dong} ({dsTuNhap.length}/8)</span>
                </button>
              )}

              {/* Checkbox cam kết bắt buộc (mặc định CHƯA tích) theo Luật BVDLCN 91/2025/QH15 & DC-1 */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-3 text-xs leading-relaxed text-[#f0b35c]">
                <input
                  type="checkbox"
                  checked={camKetThoaThuan}
                  onChange={(e) => setCamKetThoaThuan(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
                />
                <span>{CHU_DOANH_CHU.buoc_nhap.cam_ket_tu_nhap}</span>
              </label>

              <button
                type="button"
                disabled={dangTai || !camKetThoaThuan}
                onClick={() => chayPhanTich("tu_nhap")}
                className="w-full rounded-xl border border-gold/50 bg-gold/20 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {dangTai && cheDoDangGoi === "tu_nhap"
                  ? CHU_DOANH_CHU.buoc_nhap.dang_phan_tich
                  : `${CHU_DOANH_CHU.buoc_nhap.nut_phan_tich} (${dsTuNhap.length}/8)`}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-xs leading-relaxed text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.buoc_2_mo_ta}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={tenNhom}
                  onChange={(e) => setTenNhom(e.target.value)}
                  placeholder={CHU_DOANH_CHU.buoc_nhap.ten_nhom_goi_y}
                  maxLength={50}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-bg/70 px-3 py-2 text-sm text-fg placeholder:text-fg-faint"
                />
                <button
                  type="button"
                  onClick={taoLinkMoi}
                  disabled={dangTaoLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-jade/45 bg-jade/15 px-4 py-2 text-sm font-medium text-jade transition hover:bg-jade/25 disabled:opacity-60"
                >
                  <Link2 className="h-4 w-4" />
                  <span>{dangTaoLink ? CHU_DOANH_CHU.buoc_nhap.dang_tao_link : CHU_DOANH_CHU.buoc_nhap.nut_tao_link}</span>
                </button>
              </div>

              {linkMoi && (
                <div className="mt-3 rounded-2xl border border-jade/35 bg-jade/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-fg-muted">{linkMoi}</p>
                    <button
                      type="button"
                      onClick={chepLink}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-jade/40 bg-surface px-3 py-1 text-xs font-medium text-jade"
                    >
                      {daChepLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{daChepLink ? CHU_DOANH_CHU.buoc_nhap.da_chep : CHU_DOANH_CHU.buoc_nhap.nut_chep_link}</span>
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={oDanMa}
                      onChange={(e) => setODanMa(e.target.value)}
                      placeholder={CHU_DOANH_CHU.buoc_nhap.dan_ma_goi_y}
                      className="min-w-0 flex-1 rounded-xl border border-line bg-bg/80 px-3 py-2 text-xs text-fg placeholder:text-fg-faint"
                    />
                    <button
                      type="button"
                      onClick={themMaThanhVien}
                      className="inline-flex items-center gap-1 rounded-xl border border-gold/45 bg-gold/15 px-3.5 py-2 text-xs font-medium text-gold hover:bg-gold/25"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{CHU_DOANH_CHU.buoc_nhap.nut_them_ma}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {dsMaTv.length === 0 ? (
                  <p className="rounded-xl border border-line/50 bg-bg/40 p-3 text-xs text-fg-faint">
                    {CHU_DOANH_CHU.buoc_nhap.danh_sach_trong}
                  </p>
                ) : (
                  dsMaTv.map((tv) => (
                    <div
                      key={tv.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-jade/30 bg-surface/70 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-jade" />
                        <span className="font-medium text-fg">{tv.nhan}</span>
                        <span className="rounded-full bg-jade/15 px-2 py-0.5 text-[11px] text-jade">
                          {CHU_DOANH_CHU.buoc_nhap.huy_hieu_xac_nhan}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDsMaTv((prev) => prev.filter((x) => x.id !== tv.id))}
                        className="inline-flex items-center gap-1 text-fg-faint hover:text-[#ef8a6f]"
                        aria-label={CHU_DOANH_CHU.buoc_nhap.xoa_thanh_vien}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                disabled={dangTai || !maMoi || dsMaTv.length === 0}
                onClick={() => chayPhanTich("doi_ngu")}
                className="mt-4 w-full rounded-xl border border-gold/50 bg-gold/20 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {dangTai && cheDoDangGoi === "doi_ngu"
                  ? CHU_DOANH_CHU.buoc_nhap.dang_phan_tich
                  : `${CHU_DOANH_CHU.buoc_nhap.nut_phan_tich} (${dsMaTv.length}/8)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Xác nhận trừ Sao (khi quản trị bật công tắc thu Sao) */}
      {xacNhanSao && (
        <div className="hop-sao flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/45 bg-surface/90 p-4">
          <p className="text-sm text-fg">{xacNhanSao.thongBao}</p>
          <button
            type="button"
            onClick={() => chayPhanTich(xacNhanSao.cheDo, true)}
            className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-bg"
          >
            Đồng ý dùng {xacNhanSao.gia} Sao
          </button>
        </div>
      )}

      {loi && (
        <div className="rounded-2xl border border-[#ef8a6f]/45 bg-[#ef8a6f]/10 p-4 text-sm text-[#ef8a6f]">
          {loi}
        </div>
      )}

      {/* KẾT QUẢ: Radar 5 Hành Động + Ma Trận 2 Chiều + Quy Mô + Ranh Giới Pháp Lý */}
      {ketQua && (
        <div ref={refKetQua} className="scroll-mt-24 space-y-6">
          {ketQua.la_du_lieu_mau && (
            <div className="rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 text-xs text-gold">
              {CHU_DOANH_CHU.che_do.nhan_mau}
            </div>
          )}

          <RadarNguHanh
            canBang={ketQua.can_bang_ngu_hanh}
            ongChu={ketQua.ong_chu}
            thanhVien={ketQua.ma_tran_phoi_hop}
          />

          {/* Trọng tâm theo đúng cấp bậc quản lý của người xem */}
          {ketQua.cap_quan_ly && (
            <section className="glass rounded-3xl p-5 sm:p-6">
              <p className="eyebrow text-jade">{ketQua.cap_quan_ly.ten}</p>
              <h2 className="mt-1 font-serif text-xl text-fg">{ketQua.cap_quan_ly.trong_tam}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{ketQua.cap_quan_ly.hanh_dong}</p>
            </section>
          )}

          <MaTranHaiChieu danhSach={ketQua.ma_tran_phoi_hop} namXem={ketQua.nam_xem} />

          {/* Gợi ý ghép cặp cộng sự cùng chạy dự án */}
          {ketQua.goi_y_ghep_cap && ketQua.goi_y_ghep_cap.length > 0 && (
            <section className="glass rounded-3xl p-5 sm:p-6">
              <h2 className="font-serif text-xl text-fg">{CHU_DOANH_CHU.buoc_nhap.ghep_cap_tieu_de}</h2>
              <p className="mt-1 text-xs text-fg-muted">{CHU_DOANH_CHU.buoc_nhap.ghep_cap_mo_ta}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {ketQua.goi_y_ghep_cap.map((c, idx) => (
                  <div key={idx} className="rounded-2xl border border-jade/30 bg-jade/5 p-4">
                    <p className="text-sm font-semibold text-fg">
                      {c.ten_a} <span className="text-jade">({c.hanh_a})</span> + {c.ten_b}{" "}
                      <span className="text-gold">({c.hanh_b})</span>
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{c.ly_do}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gợi ý theo quy mô doanh nghiệp */}
          <section className="glass rounded-3xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-fg">{CHU_DOANH_CHU.quy_mo.tieu_de}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line/70 bg-bg/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-jade">{CHU_DOANH_CHU.quy_mo.nho}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{ketQua.goi_y_quy_mo.kinh_doanh_nho}</p>
              </div>
              <div className="rounded-2xl border border-line/70 bg-bg/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">{CHU_DOANH_CHU.quy_mo.lon}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{ketQua.goi_y_quy_mo.doanh_nghiep_lon}</p>
              </div>
            </div>
          </section>

          {/* Ranh giới pháp lý bắt buộc (Luật BVDLCN 91/2025/QH15 + BLLĐ 2019 Điều 8) */}
          <aside className="rounded-2xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-4 text-xs leading-relaxed text-[#f0b35c]">
            {ketQua.ranh_gioi_phap_ly}
          </aside>
        </div>
      )}
    </div>
  );
}
