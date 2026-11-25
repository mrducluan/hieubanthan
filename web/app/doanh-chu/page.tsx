// Chuyển hướng vĩnh viễn 1 bước từ URL cũ /doanh-chu sang /quan-ly-nhan-su (tránh chuỗi redirect 2 bước).
import { permanentRedirect } from "next/navigation";

export default function Page() {
  permanentRedirect("/quan-ly-nhan-su");
}
