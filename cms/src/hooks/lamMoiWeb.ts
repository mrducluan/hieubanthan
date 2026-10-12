import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";
import { baoWebLamMoi } from "../lib/web";

type CoSlug = { slug?: string | null; _status?: string | null };

/** Bài đổi: chỉ báo web khi bản xuất bản đổi (xuất bản, sửa bài đang xuất bản, gỡ xuất bản) — lưu nháp không báo. */
export const lamMoiKhiDoiBai: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const moi = doc as CoSlug, cu = (previousDoc ?? {}) as CoSlug;
  if (req.context?.boQuaLamMoi) return doc;
  if (moi._status === "published" || cu._status === "published") await baoWebLamMoi("bai", moi.slug ?? cu.slug);
  return doc;
};
export const lamMoiKhiXoaBai: CollectionAfterDeleteHook = async ({ doc }) => {
  await baoWebLamMoi("xoa", (doc as CoSlug).slug);
  return doc;
};
export const lamMoiKhiDoi: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!req.context?.boQuaLamMoi) await baoWebLamMoi("lien_quan");
  return doc;
};
export const lamMoiGlobal: GlobalAfterChangeHook = async ({ doc }) => {
  await baoWebLamMoi("tinh_nang");
  return doc;
};
