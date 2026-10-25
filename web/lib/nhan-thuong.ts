"use client";
// SAO-V — nhận thưởng NGAY sau khi hồ sơ được lưu vào tài khoản (không đợi người dùng mở /tai-khoan): Sao chào mừng
// rồi, nếu máy còn nhớ mã mời (?gt=), thưởng lời mời hai phía. Điều kiện + chống nhận hai lần do hàm SQL kiểm
// (idempotent); ở đây gộp các lần gọi ĐANG chạy cùng lúc thành MỘT lượt. Gọi lại sau đó chỉ nhận "đã nhận" (0 Sao,
// mã mời đã quên) → không báo trùng.
// Lỗi (chưa chạy migration, mạng) → im lặng, trả kết quả rỗng.
import { ghi } from "@/lib/do-luong";
import { maGioiThieuDaNho, nhanChaoMung, nhanThuongGioiThieu, quenMaGioiThieu, type KetQuaThuong } from "@/lib/sao";

export interface KetQuaNhan {
  chao_mung: number;            // Sao chào mừng vừa cộng (0 = đã nhận trước / chưa bật)
  duoc_moi: number;             // Sao lời mời vừa cộng
  ket_qua_moi: KetQuaThuong | null;   // kết quả thưởng lời mời (null = không có mã mời trên máy / lỗi)
}

/** Lời giải thích khi mã mời không được tính (không có gì để người dùng sửa thì vẫn nói rõ vì sao). */
export const LOI_THUONG_MOI: Partial<Record<KetQuaThuong, string>> = {
  tu_moi: "Mã mời là của chính bạn nên không tính thưởng.",
  khong_hop_le: "Mã mời không còn hợp lệ.",
  da_nhan: "Tài khoản này đã nhận lời mời trước đó — mỗi tài khoản chỉ được tính một lần.",
  moi_vong: "Bạn đã mời người này trước đó nên lời mời ngược lại không được tính thưởng.",
  tai_khoan_cu: "Lời mời này không được tính thưởng.",
};

let dangNhan: Promise<KetQuaNhan> | null = null;

export function nhanThuongSauLuu(nguon: string): Promise<KetQuaNhan> {
  dangNhan ??= (async () => {
    const kq: KetQuaNhan = { chao_mung: 0, duoc_moi: 0, ket_qua_moi: null };
    try {
      const cm = await nhanChaoMung();
      if (cm.ket_qua === "da_thuong" && cm.sao) {
        kq.chao_mung = cm.sao;
        ghi("credit_earned", { kind: "chao_mung", so_sao: cm.sao, nguon });
      }
    } catch { /* chưa chạy 0008 / mạng: bỏ qua lặng lẽ */ }
    const gt = maGioiThieuDaNho();
    if (gt) {
      try {
        const r = await nhanThuongGioiThieu(gt);
        kq.ket_qua_moi = r.ket_qua;
        if (r.ket_qua === "da_thuong" && r.sao) {
          kq.duoc_moi = r.sao;
          ghi("credit_earned", { kind: "duoc_moi", so_sao: r.sao, nguon });
        }
        if (r.ket_qua !== "chua_luu_ho_so") quenMaGioiThieu();
      } catch { /* bỏ qua */ }
    }
    return kq;
  })().finally(() => { dangNhan = null; });
  return dangNhan;
}

/** Câu báo nhẹ sau khi nhận ("" nếu không có gì mới). */
export function baoNhanThuong(kq: KetQuaNhan): string {
  const ds: string[] = [];
  if (kq.chao_mung) ds.push(`+${kq.chao_mung} Sao chào mừng`);
  if (kq.duoc_moi) ds.push(`+${kq.duoc_moi} Sao vì nhận lời mời của bạn bè`);
  else if (kq.ket_qua_moi && LOI_THUONG_MOI[kq.ket_qua_moi]) ds.push(LOI_THUONG_MOI[kq.ket_qua_moi]!);
  return ds.join(" · ");
}
