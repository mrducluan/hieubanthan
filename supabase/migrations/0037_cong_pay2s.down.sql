-- Rollback cho 0037_cong_pay2s.sql: ba hàm tạo đơn thôi nhận 'pay2s'; ràng buộc cổng về ('payos', 'gia').
-- Đơn Pay2S đã có vẫn giữ nguyên (không xoá dữ liệu tiền) → ràng buộc thêm lại dạng NOT VALID khi còn dòng 'pay2s'.
do $$
declare
    v_ten text;
    v_oid oid;
    v_def text;
    v_cu  constant text := $c$('payos', 'gia')$c$;
    v_moi constant text := $c$('payos', 'pay2s', 'gia')$c$;
begin
    foreach v_ten in array array['tao_don_nap', 'tao_don_hoi_vien', 'tao_cau_hoi_chuyen_gia'] loop
        select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = v_ten;
        if v_oid is null then continue; end if;
        v_def := pg_get_functiondef(v_oid);
        if position(v_moi in v_def) > 0 then execute replace(v_def, v_moi, v_cu); end if;
    end loop;
end $$;

alter table don_nap drop constraint if exists don_nap_cong_check;
do $$
begin
    if exists (select 1 from public.don_nap where cong = 'pay2s') then
        alter table public.don_nap add constraint don_nap_cong_check check (cong in ('payos', 'gia')) not valid;
    else
        alter table public.don_nap add constraint don_nap_cong_check check (cong in ('payos', 'gia'));
    end if;
end $$;
