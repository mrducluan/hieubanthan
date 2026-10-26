-- SAO-ND (2026-10-26, chủ dự án duyệt cách tiếp cận A "thiết kế lần nạp đầu" — docs/DANH-GIA-VIRAL-V2-VA-KINH-DOANH.md §3, §9).
-- Vấn đề: gói nhỏ nhất 29.000 ₫ / 30 Sao gấp 3 lần nhu cầu mở 1 Luận giải toàn bộ (10 Sao) → người muốn trả bị chặn bởi
-- "phải nạp dư". Sao vẫn là credit nội bộ: KHÔNG đổi ra tiền, KHÔNG chuyển nhượng.
--
--   (1) Gói khởi đầu 'khoi_dau' (12.000 ₫ / 12 Sao, "Vừa 1 báo cáo", đứng đầu). Dòng goi_sao để bat = false; gói được BÁN
--       khi cột bat = true HOẶC công tắc cau_hinh 'sao.goi_khoi_dau.bat' bật (mặc định TẮT, bật ở /quan-tri/cai-dat).
--       Một nguồn sự thật "gói đang bán": goi_sao_dang_ban() — web đọc danh sách gói VÀ tao_don_nap kiểm gói đều qua nó,
--       nên trang nạp không bao giờ hiện gói mà máy chủ từ chối tạo đơn (và ngược lại).
--   (2) Tặng Sao lần nạp đầu: đơn 'da_tra' ĐẦU TIÊN của tài khoản (trước nó không có đơn 'da_tra' / 'hoan' nào) khi công
--       tắc 'sao.nap_dau.bat' bật (mặc định TẮT) → cộng thêm floor(Sao của gói × 'sao.nap_dau.phan_tram' / 100) Sao TẶNG
--       (kẹp 0–100, mặc định 20), loại 'nap_dau', hạn 365 ngày, khoá 'nap_dau:<uid>' duy nhất → một lần mỗi tài khoản,
--       webhook gửi lại / đối soát chạy trùng không cộng hai lần. Số Sao tặng ghi vào don_nap.sao_tang_dau của đúng đơn.
--       Hoàn tiền đơn đó → thu hồi đúng lô bằng bút toán 'thu_hoi:nap_dau:<uid>' (sao_so_du_cua 0025 trừ đúng lô đích).
--       Hoa hồng (0025/0026) vẫn tính trên Sao của GÓI (don_nap.sao), không tính Sao tặng lần đầu.
--   (3) nap_dau_thong_tin(): web biết công tắc + tỉ lệ + "đã từng nạp chưa" (chỉ của chính mình; khách → null) để hiện một
--       dòng trung tính "Lần nạp đầu tặng thêm X% Sao". Không đếm ngược, không giới hạn suất.
-- Chạy SAU 0026. Rollback: 0027_nap_dau.down.sql

-- ---------------------------------------------------------------- sổ cái: loại mới
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu', 'hoa_hong', 'chuoi', 'nap_dau'));

-- Đơn nào nhận Sao tặng lần nạp đầu (để hoàn tiền thu hồi đúng lô, và quản trị đối soát).
alter table don_nap add column if not exists sao_tang_dau integer check (sao_tang_dau is null or sao_tang_dau > 0);

-- ---------------------------------------------------------------- (1) gói khởi đầu
insert into goi_sao (ma, ten, gia_vnd, sao, nhan, mo_ta, bat, thu_tu) values
    ('khoi_dau', 'Khởi đầu', 12000, 12, 'Vừa 1 báo cáo', 'Đủ mở 1 Luận giải toàn bộ', false, 0)
on conflict (ma) do nothing;

create or replace function goi_sao_dang_ban() returns setof public.goi_sao
    language sql stable security definer set search_path = '' as $$
    select * from public.goi_sao g
    where g.bat or (g.ma = 'khoi_dau' and public.qt_bat_cau_hinh('sao.goi_khoi_dau.bat'))
    order by g.thu_tu, g.ma
$$;

-- Thay bản 0012: gói hợp lệ = gói đang bán theo goi_sao_dang_ban(). Phần còn lại giữ nguyên.
create or replace function tao_don_nap(p_goi text, p_cong text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_goi public.goi_sao;
    v_don public.don_nap;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_cong is null or p_cong not in ('payos', 'gia') then return jsonb_build_object('ket_qua', 'cong_khong_hop_le'); end if;
    select * into v_goi from public.goi_sao_dang_ban() where ma = p_goi;
    if v_goi.ma is null then return jsonb_build_object('ket_qua', 'goi_khong_hop_le'); end if;
    perform pg_advisory_xact_lock(hashtext('don_nap:' || v_uid));
    if (select count(*) from public.don_nap
        where user_id = v_uid and trang_thai = 'cho' and het_han > now()) >= 5 then
        return jsonb_build_object('ket_qua', 'qua_nhieu_don');
    end if;
    insert into public.don_nap (user_id, goi, so_tien, sao, cong)
    values (v_uid, v_goi.ma, v_goi.gia_vnd, v_goi.sao, p_cong)
    returning * into v_don;
    return jsonb_build_object('ket_qua', 'da_tao', 'ma_don', v_don.ma_don, 'so_tien', v_don.so_tien, 'sao', v_don.sao,
                              'ten_goi', v_goi.ten, 'het_han', v_don.het_han);
end
$$;

-- ---------------------------------------------------------------- (2) tặng Sao lần nạp đầu
-- Gọi trong nap_sao_tu_cong sau khi đơn chuyển 'da_tra'. Trả số Sao đã tặng (0 = không tặng).
create or replace function nd_tang_cho_don(p_ma_don bigint) returns integer
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_pt integer := public.qt_so_cau_hinh('sao.nap_dau.phan_tram', 20, 0, 100);
    v_tang integer;
begin
    if not public.qt_bat_cau_hinh('sao.nap_dau.bat') or v_pt <= 0 then return 0; end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don;
    if v_don.ma_don is null or v_don.trang_thai <> 'da_tra' then return 0; end if;
    -- Khoá theo người mua: hai đơn đầu trả cùng lúc → đơn sau đợi đơn trước ghi xong rồi mới xét "đã từng nạp".
    perform pg_advisory_xact_lock(hashtext('nap_dau:' || v_don.user_id));
    if exists (select 1 from public.don_nap d where d.user_id = v_don.user_id and d.ma_don <> v_don.ma_don
               and d.trang_thai in ('da_tra', 'hoan')) then
        return 0;
    end if;
    v_tang := floor(v_don.sao * v_pt / 100.0)::integer;
    if v_tang <= 0 then return 0; end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_don.user_id, v_tang, 'nap_dau', left('Tặng lần nạp đầu · đơn ' || v_don.ma_don, 120),
            'nap_dau:' || v_don.user_id, current_date + 365)
    on conflict (khoa) do nothing;
    if not found then return 0; end if;
    update public.don_nap set sao_tang_dau = v_tang where ma_don = p_ma_don;
    return v_tang;
end
$$;

-- Thay bản 0025: thêm bước tặng lần nạp đầu (lỗi ở bước này KHÔNG chặn cộng Sao cho người mua, như bước hoa hồng).
-- Phần còn lại giữ nguyên (kể cả gọi hh_cho_don của 0026 trong khối exception).
create or replace function nap_sao_tu_cong(p_ma_don bigint, p_so_tien integer, p_cong text, p_ma_giao_dich text)
    returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_tang integer := 0;
begin
    select * into v_don from public.don_nap where ma_don = p_ma_don for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.cong <> p_cong then return jsonb_build_object('ket_qua', 'sai_cong'); end if;
    if v_don.trang_thai in ('da_tra', 'hoan') then return jsonb_build_object('ket_qua', 'da_xu_ly', 'sao', v_don.sao); end if;
    if p_so_tien is distinct from v_don.so_tien then
        update public.don_nap set trang_thai = 'sai_tien', ma_giao_dich = left(p_ma_giao_dich, 100),
            ghi_chu = left('Cổng báo ' || coalesce(p_so_tien::text, 'null') || ' ₫, đơn ' || v_don.so_tien || ' ₫', 200)
        where ma_don = p_ma_don;
        return jsonb_build_object('ket_qua', 'sai_tien');
    end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_don.user_id, v_don.sao, 'mua', left('Nạp gói ' || v_don.goi || ' · đơn ' || v_don.ma_don, 120),
            'mua:' || v_don.ma_don, null)
    on conflict (khoa) do nothing;
    update public.don_nap set trang_thai = 'da_tra', tra_luc = now(), ma_giao_dich = left(p_ma_giao_dich, 100)
    where ma_don = p_ma_don;
    begin
        v_tang := public.nd_tang_cho_don(p_ma_don);
    exception when others then
        v_tang := 0;
        raise warning 'nap_dau don % loi: %', p_ma_don, sqlerrm;
    end;
    begin
        perform public.hh_cho_don(p_ma_don);
    exception when others then
        raise warning 'hoa_hong don % loi: %', p_ma_don, sqlerrm;
    end;
    return jsonb_build_object('ket_qua', 'da_nap', 'sao', v_don.sao, 'sao_tang', v_tang);
end
$$;

-- Thay bản 0025: hoàn tiền còn thu hồi lô Sao tặng lần nạp đầu nếu chính đơn này nhận lô đó. Phần còn lại giữ nguyên.
create or replace function hoan_don_nap(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_hh public.hoa_hong;
    v_nd integer := 0;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_ly_do is null or char_length(trim(p_ly_do)) not between 5 and 120 then
        return jsonb_build_object('ket_qua', 'thieu_ly_do');
    end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.trang_thai <> 'da_tra' then return jsonb_build_object('ket_qua', 'khong_hoan_duoc', 'trang_thai', v_don.trang_thai); end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
    values (v_don.user_id, -v_don.sao, 'dieu_chinh', left('Hoàn tiền đơn ' || v_don.ma_don || ': ' || trim(p_ly_do), 120),
            'hoan:' || v_don.ma_don)
    on conflict (khoa) do nothing;
    update public.don_nap set trang_thai = 'hoan', ghi_chu = left(trim(p_ly_do), 200) where ma_don = p_ma_don;
    if coalesce(v_don.sao_tang_dau, 0) > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
        values (v_don.user_id, -v_don.sao_tang_dau, 'dieu_chinh', left('Thu hồi Sao tặng lần nạp đầu — đơn ' || v_don.ma_don
                || ' đã hoàn tiền', 120), 'thu_hoi:nap_dau:' || v_don.user_id)
        on conflict (khoa) do nothing;
        if found then v_nd := v_don.sao_tang_dau; end if;
    end if;
    select * into v_hh from public.hoa_hong where ma_don = p_ma_don for update;
    if v_hh.ma_don is not null and v_hh.trang_thai <> 'thu_hoi' then
        if v_hh.sao > 0 then
            insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
            values (v_hh.nguoi_moi_id, -v_hh.sao, 'dieu_chinh', 'Thu hồi hoa hồng — đơn của bạn bè đã hoàn tiền',
                    'thu_hoi:hoa_hong:' || p_ma_don)
            on conflict (khoa) do nothing;
        end if;
        update public.hoa_hong set trang_thai = 'thu_hoi', thu_hoi_luc = now() where ma_don = p_ma_don;
    end if;
    perform public.qt_ghi('don_nap.hoan', p_ma_don::text, jsonb_build_object('sao', v_don.sao, 'so_tien', v_don.so_tien,
        'ly_do', left(trim(p_ly_do), 120), 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0), 'thu_hoi_nap_dau', v_nd));
    return jsonb_build_object('ket_qua', 'da_hoan', 'sao', v_don.sao, 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0),
                              'thu_hoi_nap_dau', v_nd);
end
$$;

-- ---------------------------------------------------------------- (3) thông tin cho trang nạp
-- Ai cũng gọi được. lan_dau: true = tài khoản này chưa từng có đơn 'da_tra' / 'hoan' và chưa nhận lô tặng; khách → null.
create or replace function nap_dau_thong_tin() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select jsonb_build_object(
        'bat', public.qt_bat_cau_hinh('sao.nap_dau.bat') and public.qt_so_cau_hinh('sao.nap_dau.phan_tram', 20, 0, 100) > 0,
        'phan_tram', public.qt_so_cau_hinh('sao.nap_dau.phan_tram', 20, 0, 100),
        'lan_dau', case when (select auth.uid()) is null then null
                        else not exists (select 1 from public.don_nap
                                         where user_id = (select auth.uid()) and trang_thai in ('da_tra', 'hoan'))
                             and not exists (select 1 from public.so_cai_sao
                                             where khoa = 'nap_dau:' || (select auth.uid())) end)
$$;

-- ---------------------------------------------------------------- quyền
revoke all on function goi_sao_dang_ban(), nap_dau_thong_tin(), nd_tang_cho_don(bigint) from public, anon, authenticated;
grant execute on function goi_sao_dang_ban(), nap_dau_thong_tin() to anon, authenticated;
-- Hàm thay thế giữ nguyên quyền cũ (create or replace không đổi quyền); ghi lại cho chắc.
revoke all on function tao_don_nap(text, text), nap_sao_tu_cong(bigint, integer, text, text), hoan_don_nap(bigint, text)
    from public, anon, authenticated;
grant execute on function tao_don_nap(text, text), hoan_don_nap(bigint, text) to authenticated;
grant execute on function nap_sao_tu_cong(bigint, integer, text, text) to service_role;
