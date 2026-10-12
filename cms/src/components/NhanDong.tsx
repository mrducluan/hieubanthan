"use client";
// Nhãn dòng trong mảng của trang "Điều hướng chân trang": hiện tên cột / chữ liên kết thay cho "Cột 01".
import { useRowLabel } from "@payloadcms/ui";

export function NhanCot() {
  const { data, rowNumber } = useRowLabel<{ ten?: string }>();
  return <span>{data?.ten || `Cột ${(rowNumber ?? 0) + 1}`}</span>;
}

export function NhanLienKet() {
  const { data, rowNumber } = useRowLabel<{ nhan?: string; duong_dan?: string; loai?: string }>();
  const dich = data?.loai === "bai" ? "bài viết" : data?.loai === "chuyen_muc" ? "chuyên mục" : data?.duong_dan;
  return <span>{data?.nhan || `Liên kết ${(rowNumber ?? 0) + 1}`}{dich ? ` → ${dich}` : ""}</span>;
}
