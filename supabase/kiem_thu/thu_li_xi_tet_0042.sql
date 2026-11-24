-- Kiểm thử migration 0042_li_xi_tet.sql (chạy trong transaction rồi rollback)
begin;
do $$
declare
    v_u1 uuid := gen_random_uuid();
    v_u2 uuid := gen_random_uuid();
    v_u3 uuid := gen_random_uuid();
    v_kq jsonb;
    v_don bigint;
    v_ma text;
begin
    insert into auth.users (id, email) values (v_u1, 'lx1@test.local'), (v_u2, 'lx2@test.local'), (v_u3, 'lx3@test.local');

    -- Mặc định tắt → không cho tạo đơn
    perform set_config('request.jwt.claim.sub', v_u1::text, true);
    perform set_config('role', 'authenticated', true);
    v_kq := public.tao_don_li_xi('pay2s', 3, 'do_son', 'Anh Minh', 'Chúc năm mới bình an');
    assert v_kq->>'ket_qua' = 'chua_mo', 'Mặc định phải tắt';

    -- Bật công tắc
    perform set_config('role', 'postgres', true);
    update public.cau_hinh set gia_tri = 'true' where khoa = 'sao.li_xi.bat';

    -- Chặn lời chúc chứa SĐT / link
    perform set_config('request.jwt.claim.sub', v_u1::text, true);
    perform set_config('role', 'authenticated', true);
    v_kq := public.tao_don_li_xi('pay2s', 1, 'do_son', 'Anh Minh', 'Gọi 0912345678 nhé');
    assert v_kq->>'ket_qua' = 'loi_chuc_khong_hop_le', 'Phải chặn SĐT trong lời chúc';

    -- Tạo đơn combo 3 bao thành công (249.000 đ)
    v_kq := public.tao_don_li_xi('pay2s', 3, 'mai_vang', 'Anh Minh', 'Chúc Đinh Mùi vạn sự hanh thông');
    assert v_kq->>'ket_qua' = 'da_tao', 'Phải tạo được đơn combo 3 bao';
    assert (v_kq->>'so_tien_vnd')::int = 249000, 'Giá combo 3 bao phải 249000';
    v_don := (v_kq->>'ma_don')::bigint;
    v_ma := v_kq->'ma_ds'->>0;

    -- Chưa thanh toán → xem_li_xi_tet trả co=false
    assert (public.xem_li_xi_tet(v_ma)->>'co')::boolean = false, 'Chưa trả tiền chưa được xem';

    -- Giả lập Pay2S xác nhận da_tra → trigger tự chuyển 3 bao sang san_sang
    perform set_config('role', 'postgres', true);
    update public.don_nap set trang_thai = 'da_tra' where ma_don = v_don;
    assert (select count(*) from public.li_xi_tet where ma_don = v_don and trang_thai = 'san_sang') = 3, '3 bao phải san_sang';

    -- Người nhận u2 mở bao
    perform set_config('request.jwt.claim.sub', v_u2::text, true);
    perform set_config('role', 'authenticated', true);
    assert (public.xem_li_xi_tet(v_ma)->>'co')::boolean = true, 'Bao san_sang phải xem được';
    v_kq := public.nhan_li_xi_tet(v_ma);
    assert v_kq->>'ket_qua' = 'da_nhan', 'u2 phải nhận được bao';
    assert public.li_xi_hieu_luc() = true, 'u2 phải có quyền mở báo cáo 2027';

    -- Người thứ 3 (u3) không nhận lại được mã đã dùng
    perform set_config('request.jwt.claim.sub', v_u3::text, true);
    v_kq := public.nhan_li_xi_tet(v_ma);
    assert v_kq->>'ket_qua' = 'da_co_nguoi_nhan', 'Mã đã dùng phải chặn người khác';
    assert public.li_xi_hieu_luc() = false, 'u3 chưa có quyền';
end $$;
rollback;
