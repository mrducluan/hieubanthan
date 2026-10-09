// QT-1: chưa đặt token GitHub → hướng dẫn ngắn.
import { Card } from "@/components/ui/card";

export function ChuaCoToken() {
  return (
    <Card data-testid="qt-chua-token">
      <h2 className="text-lg">Chưa kết nối GitHub</h2>
      <p className="mt-2 text-sm text-fg-muted">
        Trang này đọc và đề xuất sửa kho tri thức trực tiếp trên GitHub. Đặt biến <code>QUAN_TRI_GITHUB_TOKEN</code> trên
        Vercel (hướng dẫn: docs/VIEC-CUA-ANH.md, mục Q5) rồi Redeploy.
      </p>
    </Card>
  );
}
