-- Rollback 0027_nap_dau.sql: khôi phục tao_don_nap (bản 0012), nap_sao_tu_cong + hoan_don_nap (bản 0025 — 0026 không
-- thay hai hàm này; nap_sao_tu_cong vẫn gọi hh_cho_don bản 0026 trong khối exception), bỏ hàm / cột mới.
-- Sao tặng lần nạp đầu đã cộng KHÔNG bị thu hồi: bút toán 'nap_dau' chuyển thành 'dieu_chinh' (giữ số dư) rồi mới khôi
-- phục ràng buộc loại của 0025. Gói 'khoi_dau': xoá nếu chưa có đơn nào dùng; đã có đơn (khoá ngoại don_nap.goi) thì giữ
-- dòng và đặt bat = false. Khoá cau_hinh sao.nap_dau.*, sao.goi_khoi_dau.bat giữ lại (vô hại).
-- Trước khi rollback trên production: xuất cột don_nap.sao_tang_dau (ma_don, sao_tang_dau) ra CSV nếu cần đối soát.

create or replace function tao_don_nap(p_goi text, p_cong text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_goi public.goi_sao;
    v_don public.don_nap;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_cong is null or p_cong not in ('payos', 'gia') then return jsonb_build_object('ket_qua', 'cong_khong_hop_le'); end if;
    select * into v_goi from public.goi_sao where ma = p_goi and bat;
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

create or replace function nap_sao_tu_cong(p_ma_don bigint, p_so_tien integer, p_cong text, p_ma_giao_dich text)
    returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
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
        perform public.hh_cho_don(p_ma_don);
    exception when others then
        raise warning 'hoa_hong don % loi: %', p_ma_don, sqlerrm;
    end;
    return jsonb_build_object('ket_qua', 'da_nap', 'sao', v_don.sao);
end
$$;

create or replace function hoan_don_nap(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_hh public.hoa_hong;
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
        'ly_do', left(trim(p_ly_do), 120), 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0)));
    return jsonb_build_object('ket_qua', 'da_hoan', 'sao', v_don.sao, 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0));
end
$$;

revoke all on function tao_don_nap(text, text), nap_sao_tu_cong(bigint, integer, text, text), hoan_don_nap(bigint, text)
    from public, anon, authenticated;
grant execute on function tao_don_nap(text, text), hoan_don_nap(bigint, text) to authenticated;
grant execute on function nap_sao_tu_cong(bigint, integer, text, text) to service_role;

drop function if exists nap_dau_thong_tin();
drop function if exists nd_tang_cho_don(bigint);
drop function if exists goi_sao_dang_ban();

delete from goi_sao where ma = 'khoi_dau' and not exists (select 1 from don_nap where goi = 'khoi_dau');
update goi_sao set bat = false where ma = 'khoi_dau';

alter table don_nap drop column if exists sao_tang_dau;

update so_cai_sao set loai = 'dieu_chinh' where loai = 'nap_dau';
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu', 'hoa_hong', 'chuoi'));
