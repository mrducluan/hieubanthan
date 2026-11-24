-- Rollback 0042_li_xi_tet.sql
-- CẢNH BÁO: đã bán bao lì xì thì KHÔNG chạy — xoá bảng li_xi_tet là mất quyền người nhận đã trả tiền. Tệp này dừng lại
-- nếu còn đơn li_xi đã trả hoặc bao đã được nhận.
do $$
begin
    if exists (select 1 from public.don_nap where loai = 'li_xi' and trang_thai in ('da_tra', 'hoan', 'sai_tien'))
       or exists (select 1 from public.li_xi_tet where trang_thai = 'da_nhan') then
        raise exception 'Đã có đơn Lì xì trả tiền / bao đã nhận — không gỡ 0042 (chỉ tắt công tắc sao.li_xi.bat).';
    end if;
end $$;

drop trigger if exists lx_don_da_tra_trg on don_nap;
drop function if exists hoan_don_li_xi(bigint, text);
drop function if exists ds_li_xi_cua_toi();
drop function if exists li_xi_dung(text, integer);
drop function if exists li_xi_trang_thai(text, integer);
drop function if exists nhan_li_xi_tet(text);
drop function if exists xem_li_xi_tet(text);
drop function if exists tao_don_li_xi(text, integer, text, text, text);
drop function if exists li_xi_thong_tin();
drop function if exists lx_don_doi_trang_thai();
drop function if exists lx_chu_bi_chan(text);
drop function if exists lx_bat();
drop function if exists lx_gia_goi(integer);
drop table if exists li_xi_tet;
delete from public.don_nap where loai = 'li_xi';   -- chỉ còn đơn chờ / huỷ (khối trên đã chặn đơn đã trả)
delete from public.cau_hinh where khoa in ('sao.li_xi.bat', 'sao.li_xi.gia_1', 'sao.li_xi.gia_3', 'sao.li_xi.gia_5');
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap add constraint don_nap_loai_check check (loai in ('sao', 'hoi_vien', 'chuyen_gia'));
