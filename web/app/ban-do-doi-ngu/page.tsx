// Chuyển hướng vĩnh viễn 1 bước từ URL cũ /ban-do-doi-ngu sang /quan-ly-nhan-su (giữ trọn tín hiệu SEO & link đã chia sẻ).
import { permanentRedirect } from "next/navigation";

export default function Page() {
  permanentRedirect("/quan-ly-nhan-su");
}
