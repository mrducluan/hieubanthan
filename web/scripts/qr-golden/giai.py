"""Giải mã ma trận QR (danh sách chuỗi 0/1) bằng OpenCV — ảnh có vùng yên tĩnh 4 ô, phóng 10 px/ô."""
import json, sys
import numpy as np
import cv2


def anh(hang, o=10, le=4):
    n = len(hang)
    a = np.full(((n + 2 * le) * o, (n + 2 * le) * o), 255, np.uint8)
    for y, h in enumerate(hang):
        for x, c in enumerate(h):
            if c == "1":
                a[(y + le) * o:(y + le + 1) * o, (x + le) * o:(x + le + 1) * o] = 0
    return a


def giai(hang):
    d = cv2.QRCodeDetector()
    for o in (10, 6, 4, 14):
        s, _, _ = d.detectAndDecode(anh(hang, o))
        if s:
            return s
    try:
        a = cv2.QRCodeDetectorAruco()
        s, _, _ = a.detectAndDecode(anh(hang, 8))
        return s
    except Exception:
        return ""


if __name__ == "__main__":
    print(giai(json.loads(sys.argv[1])))
