// Chuyển hướng vĩnh viễn từ URL cũ /doanh-chu sang URL dễ hiểu /ban-do-doi-ngu (không gãy link đã chia sẻ).
import { permanentRedirect } from "next/navigation";

export default function Page() {
  permanentRedirect("/ban-do-doi-ngu");
}
