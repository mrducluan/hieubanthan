-- Rollback 0028_hoi_vien.sql: khôi phục nap_sao_tu_cong + hoan_don_nap (bản 0027, chép nguyên văn), bỏ hàm / bảng / cột mới.
-- Đơn hội viên (don_nap.loai <> 'sao') KHÔNG khớp ràng buộc cũ (goi not null, sao > 0) → bị XOÁ; Sao tháng đã cấp giữ
-- nguyên số dư (bút toán 'hoi_vien' chuyển thành 'dieu_chinh') rồi mới khôi phục ràng buộc loại của 0027. Khoá cau_hinh
-- sao.hoi_vien.*, sao.chuyen_gia.* giữ lại (vô hại).
-- Trước khi rollback trên production: xuất hoi_vien + don_nap (loai = 'hoi_vien') ra CSV để đối soát / hoàn tiền tay.

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

revoke all on function nap_sao_tu_cong(bigint, integer, text, text), hoan_don_nap(bigint, text) from public, anon, authenticated;
grant execute on function hoan_don_nap(bigint, text) to authenticated;
grant execute on function nap_sao_tu_cong(bigint, integer, text, text) to service_role;

-- Khôi phục nguyên văn nd_tang_cho_don + nap_dau_thong_tin (0027) và hh_cho_don (0026): bỏ điều kiện loai = 'sao'.
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

create or replace function hh_cho_don(p_ma_don bigint) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_g public.gioi_thieu;
    v_thu_tu integer;
    v_pt integer := public.qt_so_cau_hinh('sao.hoa_hong.phan_tram', 20, 0, 50);
    v_so_don integer := public.qt_so_cau_hinh('sao.hoa_hong.so_don', 1, 1, 12);
    v_thang integer := public.qt_so_cau_hinh('sao.hoa_hong.thang', 12, 1, 36);
    v_tran integer := public.qt_so_cau_hinh('sao.hoa_hong.tran_30_ngay', 1000, 0, 10000);
    v_tinh integer;
    v_da integer;
    v_cho integer;
begin
    if not public.qt_bat_cau_hinh('sao.hoa_hong.bat') or v_pt <= 0 then return jsonb_build_object('ket_qua', 'tat'); end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don;
    if v_don.ma_don is null or v_don.trang_thai <> 'da_tra' then return jsonb_build_object('ket_qua', 'khong_ap_dung'); end if;
    select * into v_g from public.gioi_thieu where duoc_moi_id = v_don.user_id;
    if v_g.duoc_moi_id is null then return jsonb_build_object('ket_qua', 'khong_duoc_moi'); end if;
    if v_g.tao_luc < now() - make_interval(months => v_thang) then return jsonb_build_object('ket_qua', 'het_thoi_han'); end if;
    select count(*) + 1 into v_thu_tu from public.don_nap d
        where d.user_id = v_don.user_id and d.trang_thai in ('da_tra', 'hoan') and d.ma_don <> v_don.ma_don
          and (d.tra_luc < v_don.tra_luc or (d.tra_luc = v_don.tra_luc and d.ma_don < v_don.ma_don));
    if v_thu_tu > v_so_don then return jsonb_build_object('ket_qua', 'ngoai_so_don'); end if;
    v_tinh := floor(v_don.sao * v_pt / 100.0)::integer;
    if v_tinh <= 0 then return jsonb_build_object('ket_qua', 'qua_nho'); end if;

    perform pg_advisory_xact_lock(hashtext('hoa_hong:' || v_g.nguoi_moi_id));
    if exists (select 1 from public.hoa_hong where ma_don = p_ma_don) then return jsonb_build_object('ket_qua', 'da_xu_ly'); end if;

    if v_g.co_gian_lan is not null and public.gl_bat() then
        insert into public.hoa_hong (ma_don, nguoi_moi_id, duoc_moi_id, sao_don, phan_tram, sao_tinh, sao, trang_thai)
        values (p_ma_don, v_g.nguoi_moi_id, v_don.user_id, v_don.sao, v_pt, v_tinh, 0, 'nghi_gian_lan');
        insert into public.gian_lan_co (loai, user_id, lien_quan, thiet_bi, chi_tiet)
        values ('hoa_hong_nghi', v_g.nguoi_moi_id, v_don.user_id, v_g.thiet_bi,
                jsonb_build_object('ma_don', p_ma_don, 'co_moi', v_g.co_gian_lan));
        return jsonb_build_object('ket_qua', 'nghi_gian_lan', 'sao', 0);
    end if;

    select coalesce(sum(sao), 0) into v_da from public.hoa_hong
        where nguoi_moi_id = v_g.nguoi_moi_id and trang_thai = 'da_cong' and tao_luc > now() - interval '30 days';
    v_cho := least(v_tinh, greatest(0, v_tran - v_da));
    insert into public.hoa_hong (ma_don, nguoi_moi_id, duoc_moi_id, sao_don, phan_tram, sao_tinh, sao, trang_thai)
    values (p_ma_don, v_g.nguoi_moi_id, v_don.user_id, v_don.sao, v_pt, v_tinh, v_cho,
            case when v_cho > 0 then 'da_cong' else 'qua_tran' end);
    if v_cho > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_g.nguoi_moi_id, v_cho, 'hoa_hong', 'Hoa hồng: bạn bè bạn mời đã nạp Sao', 'hoa_hong:' || p_ma_don,
                current_date + 365)
        on conflict (khoa) do nothing;
    end if;
    return jsonb_build_object('ket_qua', case when v_cho > 0 then 'da_cong' else 'qua_tran' end, 'sao', v_cho);
end
$$;

drop function if exists thong_ke_hoi_vien(integer);
drop function if exists hoi_vien_dung_cau_hoi();
drop function if exists hoi_vien_cua_toi();
drop function if exists hoi_vien_cap_sao_thang_tat_ca();
drop function if exists hoi_vien_cap_sao_thang();
drop function if exists hv_cap_sao_thang_cho(uuid);
drop function if exists hoi_vien_ghi_mo(text);
drop function if exists hoi_vien_hieu_luc(uuid);
drop function if exists hv_kich_hoat(bigint);
drop function if exists tao_don_hoi_vien(text);
drop function if exists hv_thang_tron(date, date);
drop function if exists hv_dong_hieu_luc(uuid);
drop function if exists hv_hom_nay();

drop table if exists hoi_vien_mo;
drop table if exists hoi_vien;

delete from don_nap where loai <> 'sao';
alter table don_nap drop constraint if exists don_nap_goi_theo_loai;
alter table don_nap drop constraint if exists don_nap_sao_check;
alter table don_nap add constraint don_nap_sao_check check (sao > 0);
alter table don_nap alter column goi set not null;
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap drop column if exists loai;

update so_cai_sao set loai = 'dieu_chinh' where loai = 'hoi_vien';
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu', 'hoa_hong', 'chuoi', 'nap_dau'));
