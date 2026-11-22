-- Hoàn tác 0040: trả goi_sao_dang_ban về bản 0027, bỏ hàm + công tắc. Gói 'lan_dau': xoá nếu chưa có đơn nào dùng; đã có
-- đơn (khoá ngoại don_nap.goi) thì giữ dòng và đặt bat = false (không còn nhánh bán nào).
create or replace function goi_sao_dang_ban() returns setof public.goi_sao
    language sql stable security definer set search_path = '' as $$
    select * from public.goi_sao g
    where g.bat or (g.ma = 'khoi_dau' and public.qt_bat_cau_hinh('sao.goi_khoi_dau.bat'))
    order by g.thu_tu, g.ma
$$;
drop function if exists goi_lan_dau_duoc_mua();
delete from cau_hinh where khoa = 'sao.goi_lan_dau.bat';
delete from goi_sao where ma = 'lan_dau' and not exists (select 1 from don_nap where goi = 'lan_dau');
update goi_sao set bat = false where ma = 'lan_dau';
