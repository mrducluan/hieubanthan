# references/ — chỗ trống lớn nhất của skill này

Lớp 2 trong `SKILL.md` yêu cầu sáu tệp tri thức luận. **Chúng chưa tồn tại.**
Tôi cố ý không tự viết ra, vì bảng an sao và bảng miếu vượng đắc hãm là dữ liệu
tra cứu — viết theo trí nhớ sẽ tạo ra bảng nhìn rất chuẩn mà sai, đúng cái lỗi
mà toàn bộ Lớp 1 đang cố chặn.

## Cần có

| Tệp | Nội dung | Nguồn nên lấy |
|---|---|---|
| `an-sao-viet.md` | Bảng an sao phái Việt | Xuất từ engine `lasotuvi`, đối chiếu sách |
| `chinh-tinh.md` | 14 chính tinh, miếu/vượng/đắc/hãm theo 12 cung | Sách trường phái đã chốt |
| `phu-tinh.md` | Lục cát, lục sát, quý tinh, sao lẻ | Sách trường phái đã chốt |
| `tuan-triet.md` | Quy tắc Tuần Triệt của phái đang dùng | Nguyễn Phát Lộc |
| `cach-cuc.md` | Cách nổi tiếng, điều kiện thành cách / phá cách | Sách trường phái đã chốt |
| `12-cung.md` | Ngữ nghĩa từng cung **và ranh giới cung không nói được gì** | Tự viết theo Mục 9 |

## Cách sinh an-sao-viet.md mà không phải chép tay

```bash
pip install lasotuvi
# lập một lá số đã biết, xuất JSON, đối chiếu với sách của trường phái đã chốt,
# ghi lại các chỗ engine và sách khác nhau — chính danh sách khác biệt đó là
# tài liệu có giá trị nhất, vì nó chỉ ra engine thuộc phái nào.
```

Trước khi có đủ các tệp này, mọi bản luận phải ghi:
*"Tri thức luận chưa nạp, độ tin cậy phần cách cục bị hạ."*
