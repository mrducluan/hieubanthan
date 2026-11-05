"use client";
// NT-1: true = trang đang hiện lá số của NGƯỜI THÂN (lib/nguoi-than.ts), không phải của người xem. Các nút ghi về chính người
// xem đọc cờ này để ẩn: "Đúng với mình / Chưa đúng" (KiemChung), "Lưu" câu trả lời (CauTraLoi). File riêng, nhỏ — để
// những khối đó không phải nạp cả giao diện người thân.
import { createContext, useContext } from "react";

export const XemNguoiThanCtx = createContext(false);
export const useXemNguoiThan = () => useContext(XemNguoiThanCtx);
