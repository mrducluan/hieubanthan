-- SAO-V (2026-10-25, chủ dự án duyệt — docs/DANH-GIA-VIRAL-NAP-SAO.md): sửa số dư + bốn cơ chế viral / nạp Sao.
-- Sao vẫn là credit nội bộ: KHÔNG đổi ra tiền, KHÔNG chuyển nhượng. Thưởng mời + hoa hồng chỉ MỘT tầng.
--
--   (1) Số dư theo LÔ (sao_so_du_cua): mỗi khoản tiêu trừ vào lô Sao còn hạn sắp hết hạn TRƯỚC, Sao MUA (không hạn)
--       trừ SAU CÙNG. Trước đây (0008) khoản tiêu trừ thẳng vào tổng → khi Sao tặng hết hạn, Sao đã mua hiển thị thiếu.
--       Khoản thu hồi có đích ('hoan:<đơn>' → lô 'mua:<đơn>', 'thu_hoi:<khoá lô>' → lô đó) trừ đúng lô của nó trước.
--       Số dư mới luôn ≥ số dư cũ (không ai mất Sao). Sao MUA không bao giờ hết hạn (0012, het_han null).
--   (2) Thưởng mời "hướng A": bỏ điều kiện tài khoản được mời tạo ≤ 7 ngày. Giữ: đã lưu hồ sơ, không tự mời, mỗi tài
--       khoản chỉ được tính "được mời" MỘT lần trong đời (khoá chính gioi_thieu), trần người mời / 30 ngày. Thêm: không
--       mời vòng (B đã mời A thì A không nhận lời mời của B).
--   (3) Hoa hồng nạp Sao (affiliate một tầng): bạn bè do mình mời nạp Sao bằng tiền thật → người mời nhận X% số Sao
--       của đơn, trả bằng SAO TẶNG (hạn 365 ngày), chỉ N đơn đầu, trong M tháng kể từ khi mời, trần / 30 ngày. Chỉ
--       người mời TRỰC TIẾP (không tầng 2). Đơn bị hoàn tiền → thu hồi đúng lô hoa hồng đó. Công tắc mặc định TẮT.
--   (4) Chuỗi ngày ghé: mỗi tài khoản một dòng trạng thái (ngày ghé cuối, độ dài chuỗi) — KHÔNG lưu lịch sử từng
--       ngày. Đủ mốc (mặc định 7 ngày liên tiếp) → thưởng Sao nhỏ, trần / 30 ngày. Mất chuỗi chỉ đếm lại, không phạt.
--   (5) Tặng một chương: người đã mở Luận giải toàn bộ (đã tiêu Sao) tạo link quà; người nhận (tài khoản + hồ sơ của
--       CHÍNH HỌ) được đọc thêm một chương trong báo cáo của chính họ ở mảng đó, trong 30 ngày. Quà là NỘI DUNG, không
--       phải Sao. Link hạn 7 ngày, dùng 1 lần, mỗi người nhận 1 quà / mảng, người gửi tối đa N quà / 30 ngày.
-- Mọi mức + công tắc đọc từ cau_hinh (khoá sao.*, kẹp trong khoảng an toàn). Chạy SAU 0024. Rollback: 0025_sao_viral.down.sql

-- ---------------------------------------------------------------- sổ cái: loại mới
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu', 'hoa_hong', 'chuoi'));

-- ---------------------------------------------------------------- (1) số dư theo lô
create or replace function sao_so_du_cua(p_uid uuid) returns integer
    language plpgsql stable security definer set search_path = '' as $$
declare
    r record;
    v_khoa text[] := '{}';
    v_con integer[] := '{}';
    v_han date[] := '{}';
    v_n integer := 0;
    v_can integer;
    v_ngay date;
    v_dich text;
    v_i integer;
    v_chon integer;
    v_lay integer;
    v_no integer := 0;
    v_tong integer := 0;
begin
    if p_uid is null then return 0; end if;
    for r in select so_luong, khoa, het_han, tao_luc from public.so_cai_sao where user_id = p_uid order by tao_luc, id loop
        if r.so_luong > 0 then
            v_n := v_n + 1;
            v_khoa[v_n] := r.khoa; v_con[v_n] := r.so_luong; v_han[v_n] := r.het_han;
            continue;
        end if;
        v_can := -r.so_luong;
        v_ngay := r.tao_luc::date;
        v_dich := case when r.khoa ~ '^hoan:[0-9]+$' then 'mua:' || substr(r.khoa, 6)
                       when r.khoa like 'thu_hoi:%' then substr(r.khoa, 9) end;
        if v_dich is not null then
            for v_i in 1 .. v_n loop
                if v_khoa[v_i] = v_dich and v_con[v_i] > 0 then
                    v_lay := least(v_can, v_con[v_i]);
                    v_con[v_i] := v_con[v_i] - v_lay; v_can := v_can - v_lay;
                end if;
            end loop;
        end if;
        -- Phần còn lại: lô còn hạn vào ngày tiêu, hạn sớm nhất trước, lô không hạn (Sao mua) sau cùng.
        while v_can > 0 loop
            v_chon := null;
            for v_i in 1 .. v_n loop
                if v_con[v_i] > 0 and (v_han[v_i] is null or v_han[v_i] >= v_ngay) and (v_chon is null
                    or (v_han[v_i] is not null and (v_han[v_chon] is null or v_han[v_i] < v_han[v_chon]))) then
                    v_chon := v_i;
                end if;
            end loop;
            exit when v_chon is null;
            v_lay := least(v_can, v_con[v_chon]);
            v_con[v_chon] := v_con[v_chon] - v_lay; v_can := v_can - v_lay;
        end loop;
        v_no := v_no + v_can;   -- tiêu / thu hồi vượt số đang có (vd hoàn tiền sau khi đã tiêu) → số dư âm
    end loop;
    for v_i in 1 .. v_n loop
        if v_han[v_i] is null or v_han[v_i] >= current_date then v_tong := v_tong + v_con[v_i]; end if;
    end loop;
    return v_tong - v_no;
end
$$;

create or replace function so_du_sao() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.sao_so_du_cua((select auth.uid()))
$$;

create or replace function qt_so_du(p_uid uuid) returns integer
    language sql stable security definer set search_path = '' as $$
    select public.sao_so_du_cua(p_uid)
$$;

-- Ví chi tiết của chính mình: số dư, phần Sao mua (không hạn) còn lại, lô tặng sắp hết hạn gần nhất (chỉ để hiển thị
-- thông tin, KHÔNG dùng để thúc giục). Cùng thuật toán với sao_so_du_cua.
create or replace function vi_sao_chi_tiet() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_du integer;
    v_mua integer;
    v_tong_mua integer;
    v_tieu_sau integer;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    v_du := public.sao_so_du_cua(v_uid);
    -- Sao mua còn lại = min(số dư, tổng Sao mua chưa hoàn) — vì lô mua bị trừ SAU CÙNG.
    select coalesce(sum(so_luong), 0) into v_tong_mua from public.so_cai_sao
        where user_id = v_uid and loai = 'mua';
    select coalesce(-sum(so_luong), 0) into v_tieu_sau from public.so_cai_sao
        where user_id = v_uid and so_luong < 0 and khoa ~ '^hoan:[0-9]+$';
    v_mua := greatest(0, least(v_du, v_tong_mua - v_tieu_sau));
    return jsonb_build_object('so_du', v_du, 'sao_mua', v_mua, 'sao_tang', greatest(0, v_du - v_mua));
end
$$;

-- ---------------------------------------------------------------- (2) thưởng mời — hướng A
create or replace function nhan_thuong_gioi_thieu(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_moi uuid;
    v_dem integer;
    v_thuong_moi boolean;
    v_muc_duoc integer := public.sao_muc('duoc_moi');
    v_muc_moi integer := public.sao_muc('moi_ban');
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_ma is null or p_ma !~ '^[a-z0-9]{8}$' then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    select user_id into v_moi from public.ma_gioi_thieu where ma = p_ma;
    if v_moi is null then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    if v_moi = v_uid then return jsonb_build_object('ket_qua', 'tu_moi'); end if;
    if exists (select 1 from public.gioi_thieu where duoc_moi_id = v_uid) then
        return jsonb_build_object('ket_qua', 'da_nhan');
    end if;
    if exists (select 1 from public.gioi_thieu where duoc_moi_id = v_moi and nguoi_moi_id = v_uid) then
        return jsonb_build_object('ket_qua', 'moi_vong');
    end if;
    if not exists (select 1 from public.ho_so where user_id = v_uid) then
        return jsonb_build_object('ket_qua', 'chua_luu_ho_so');
    end if;

    perform pg_advisory_xact_lock(hashtext('gioi_thieu:' || v_moi));
    select count(*) into v_dem from public.gioi_thieu
        where nguoi_moi_id = v_moi and thuong_nguoi_moi and tao_luc > now() - interval '30 days';
    v_thuong_moi := v_dem < public.sao_tran_moi() and v_muc_moi > 0;

    insert into public.gioi_thieu (duoc_moi_id, nguoi_moi_id, ma, thuong_nguoi_moi)
    values (v_uid, v_moi, p_ma, v_thuong_moi)
    on conflict (duoc_moi_id) do nothing;
    if not found then return jsonb_build_object('ket_qua', 'da_nhan'); end if;

    if v_muc_duoc > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_uid, v_muc_duoc, 'duoc_moi', 'Nhận lời mời của bạn bè', 'duoc_moi:' || v_uid, current_date + 365);
    end if;
    if v_thuong_moi then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_moi, v_muc_moi, 'moi_ban', 'Bạn bè nhận lời mời', 'moi_ban:' || v_uid, current_date + 365);
    end if;
    return jsonb_build_object('ket_qua', 'da_thuong', 'sao', v_muc_duoc, 'thuong_nguoi_moi', v_thuong_moi);
end;
$$;

-- ---------------------------------------------------------------- hàm phụ: công tắc trong cau_hinh
create or replace function qt_bat_cau_hinh(p_khoa text) returns boolean
    language sql stable security definer set search_path = '' as $$
    select coalesce((select (gia_tri #>> '{}')::boolean from public.cau_hinh
                     where khoa = p_khoa and jsonb_typeof(gia_tri) = 'boolean'), false)
$$;

-- ---------------------------------------------------------------- (3) hoa hồng nạp Sao
create table if not exists hoa_hong (
    ma_don        bigint primary key references don_nap (ma_don) on delete cascade,
    nguoi_moi_id  uuid not null references auth.users (id) on delete cascade,
    duoc_moi_id   uuid not null references auth.users (id) on delete cascade,
    sao_don       integer not null check (sao_don > 0),
    phan_tram     integer not null check (phan_tram between 1 and 50),
    sao_tinh      integer not null check (sao_tinh > 0),
    sao           integer not null check (sao >= 0 and sao <= sao_tinh),
    trang_thai    text not null check (trang_thai in ('da_cong', 'qua_tran', 'thu_hoi')),
    tao_luc       timestamptz not null default now(),
    thu_hoi_luc   timestamptz,
    check (nguoi_moi_id <> duoc_moi_id)
);
create index if not exists hoa_hong_nguoi_moi_idx on hoa_hong (nguoi_moi_id, tao_luc desc);
alter table hoa_hong enable row level security;   -- không policy: đọc qua hàm (người mời không thấy mã đơn / bạn nào)
revoke all on hoa_hong from anon, authenticated;

-- Gọi trong nap_sao_tu_cong sau khi đơn chuyển 'da_tra'. Idempotent (khoá chính ma_don + khoá sổ cái).
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

-- Thay bản 0012: thêm bước hoa hồng (lỗi ở bước hoa hồng KHÔNG chặn cộng Sao cho người mua). Phần còn lại giữ nguyên.
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

-- Thay bản 0012: hoàn tiền thì thu hồi luôn hoa hồng của đơn đó (bút toán trừ đúng lô hoa hồng, không sửa dòng cũ).
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

-- Người mời xem hoa hồng của mình: chỉ ngày + số Sao + trạng thái (không mã đơn, không biết bạn nào, không số tiền).
create or replace function hoa_hong_cua_toi() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    return jsonb_build_object(
        'bat', public.qt_bat_cau_hinh('sao.hoa_hong.bat'),
        'phan_tram', public.qt_so_cau_hinh('sao.hoa_hong.phan_tram', 20, 0, 50),
        'so_don', public.qt_so_cau_hinh('sao.hoa_hong.so_don', 1, 1, 12),
        'thang', public.qt_so_cau_hinh('sao.hoa_hong.thang', 12, 1, 36),
        'ban_da_moi', (select count(*) from public.gioi_thieu where nguoi_moi_id = v_uid),
        'tong_sao', (select coalesce(sum(sao), 0) from public.hoa_hong where nguoi_moi_id = v_uid and trang_thai = 'da_cong'),
        'lan', coalesce((select jsonb_agg(jsonb_build_object('ngay', (h.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date,
                    'sao', h.sao, 'trang_thai', h.trang_thai) order by h.tao_luc desc)
                 from (select * from public.hoa_hong where nguoi_moi_id = v_uid order by tao_luc desc limit 20) h), '[]'::jsonb));
end
$$;

-- Quản trị (chủ sở hữu, MFA): tổng hoa hồng + người mời nhận nhiều nhất. Mỗi lần xem ghi nhật ký.
create or replace function thong_ke_hoa_hong(p_ngay integer default 30) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_tu timestamptz;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    p_ngay := least(greatest(coalesce(p_ngay, 30), 1), 365);
    v_tu := now() - make_interval(days => p_ngay);
    perform public.qt_ghi('hoa_hong.xem', p_ngay::text, null);
    return jsonb_build_object(
        'ngay', p_ngay,
        'tong', (select jsonb_build_object(
                    'don', count(*),
                    'sao_da_cong', coalesce(sum(h.sao) filter (where h.trang_thai = 'da_cong'), 0),
                    'sao_thu_hoi', coalesce(sum(h.sao) filter (where h.trang_thai = 'thu_hoi'), 0),
                    'qua_tran', count(*) filter (where h.trang_thai = 'qua_tran'),
                    'doanh_thu_don', coalesce(sum(d.so_tien) filter (where h.trang_thai <> 'thu_hoi'), 0),
                    'nguoi_moi', count(distinct h.nguoi_moi_id))
                 from public.hoa_hong h join public.don_nap d on d.ma_don = h.ma_don where h.tao_luc >= v_tu),
        'top', coalesce((select jsonb_agg(jsonb_build_object('email', u.email, 'don', t.don, 'sao', t.sao,
                                'doanh_thu', t.tien) order by t.sao desc)
                 from (select h.nguoi_moi_id, count(*) don, sum(h.sao) sao, sum(d.so_tien) tien
                       from public.hoa_hong h join public.don_nap d on d.ma_don = h.ma_don
                       where h.tao_luc >= v_tu and h.trang_thai = 'da_cong'
                       group by 1 order by 3 desc limit 20) t
                 join auth.users u on u.id = t.nguoi_moi_id), '[]'::jsonb));
end
$$;

-- ---------------------------------------------------------------- (4) chuỗi ngày ghé
create table if not exists chuoi_ngay (
    user_id     uuid primary key references auth.users (id) on delete cascade,
    ngay_cuoi   date not null,
    chuoi       integer not null default 1 check (chuoi >= 1),
    dai_nhat    integer not null default 1 check (dai_nhat >= 1)
);
alter table chuoi_ngay enable row level security;
drop policy if exists "chuoi_ngay chu doc" on chuoi_ngay;
create policy "chuoi_ngay chu doc" on chuoi_ngay for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on chuoi_ngay from anon, authenticated;
revoke all on chuoi_ngay from anon;

-- Ghé hôm nay (giờ VN). Gọi nhiều lần trong ngày không cộng thêm. Thưởng khi chuỗi chạm bội số của mốc.
create or replace function diem_danh() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    v_c public.chuoi_ngay;
    v_moi boolean := false;
    v_bat boolean := public.qt_bat_cau_hinh('sao.chuoi.bat');
    v_moc integer := public.qt_so_cau_hinh('sao.chuoi.moc', 7, 2, 30);
    v_muc integer := public.qt_so_cau_hinh('sao.chuoi.sao', 2, 0, 20);
    v_tran integer := public.qt_so_cau_hinh('sao.chuoi.tran_30_ngay', 6, 0, 60);
    v_da integer;
    v_sao integer := 0;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    perform pg_advisory_xact_lock(hashtext('chuoi:' || v_uid));
    select * into v_c from public.chuoi_ngay where user_id = v_uid;
    if v_c.user_id is null then
        insert into public.chuoi_ngay (user_id, ngay_cuoi, chuoi, dai_nhat) values (v_uid, v_ngay, 1, 1)
        returning * into v_c;
        v_moi := true;
    elsif v_c.ngay_cuoi < v_ngay then
        update public.chuoi_ngay set
            chuoi = case when v_c.ngay_cuoi = v_ngay - 1 then v_c.chuoi + 1 else 1 end,
            dai_nhat = greatest(v_c.dai_nhat, case when v_c.ngay_cuoi = v_ngay - 1 then v_c.chuoi + 1 else 1 end),
            ngay_cuoi = v_ngay
        where user_id = v_uid returning * into v_c;
        v_moi := true;
    end if;
    if v_moi and v_bat and v_muc > 0 and v_c.chuoi % v_moc = 0 then
        select coalesce(sum(so_luong), 0) into v_da from public.so_cai_sao
            where user_id = v_uid and loai = 'chuoi' and tao_luc > now() - interval '30 days';
        v_sao := least(v_muc, greatest(0, v_tran - v_da));
        if v_sao > 0 then
            insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
            values (v_uid, v_sao, 'chuoi', 'Ghé ' || v_c.chuoi || ' ngày liên tiếp', 'chuoi:' || v_uid || ':' || v_ngay,
                    current_date + 365)
            on conflict (khoa) do nothing;
            if not found then v_sao := 0; end if;
        end if;
    end if;
    return jsonb_build_object('ngay', v_ngay, 'chuoi', v_c.chuoi, 'dai_nhat', v_c.dai_nhat, 'moi', v_moi,
        'bat', v_bat and v_muc > 0, 'moc', v_moc, 'sao_moc', v_muc, 'con_ngay', v_moc - (v_c.chuoi % v_moc), 'sao', v_sao);
end
$$;

-- ---------------------------------------------------------------- (5) tặng một chương
create table if not exists qua_tang_chuong (
    ma          text primary key check (ma ~ '^[a-z0-9]{10}$'),
    nguoi_gui   uuid not null references auth.users (id) on delete cascade,
    mo_dun      text not null check (mo_dun in ('tuvi', 'battu', 'thanso')),
    tao_luc     timestamptz not null default now(),
    het_han     timestamptz not null default now() + interval '7 days',
    nguoi_nhan  uuid references auth.users (id) on delete cascade,
    nhan_luc    timestamptz,
    check (nguoi_nhan is null or nguoi_nhan <> nguoi_gui),
    check ((nguoi_nhan is null) = (nhan_luc is null))
);
create index if not exists qua_tang_chuong_gui_idx on qua_tang_chuong (nguoi_gui, tao_luc desc);
create unique index if not exists qua_tang_chuong_nhan_idx on qua_tang_chuong (nguoi_nhan, mo_dun) where nguoi_nhan is not null;
alter table qua_tang_chuong enable row level security;   -- không policy: chỉ qua hàm
revoke all on qua_tang_chuong from anon, authenticated;

create or replace function qua_tran() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.qt_so_cau_hinh('sao.qua.tran_30_ngay', 3, 0, 10)
$$;

create or replace function tao_qua_chuong(p_mo_dun text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_dem integer;
    v_ma text;
    v_han timestamptz;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_mo_dun is null or p_mo_dun not in ('tuvi', 'battu', 'thanso') then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    if not public.qt_bat_cau_hinh('sao.qua.bat') or public.qua_tran() = 0 then return jsonb_build_object('ket_qua', 'chua_mo'); end if;
    -- Đã từng mở Luận giải toàn bộ bằng Sao (khoá sổ cái 'dung:<uid>:lg:…' — lib/luan-giai-sao.ts).
    if not exists (select 1 from public.so_cai_sao where user_id = v_uid and loai = 'dung' and khoa like 'dung:' || v_uid || ':lg:%') then
        return jsonb_build_object('ket_qua', 'chua_mo_bao_cao');
    end if;
    perform pg_advisory_xact_lock(hashtext('qua:' || v_uid));
    select count(*) into v_dem from public.qua_tang_chuong where nguoi_gui = v_uid and tao_luc > now() - interval '30 days';
    if v_dem >= public.qua_tran() then return jsonb_build_object('ket_qua', 'het_luot', 'tran', public.qua_tran()); end if;
    loop
        v_ma := substr(translate(encode(public.sao_byte_ngau_nhien(), 'base64'), '+/=ABCDEFGHIJKLMNOPQRSTUVWXYZ', ''), 1, 10);
        exit when char_length(v_ma) = 10 and not exists (select 1 from public.qua_tang_chuong where ma = v_ma);
    end loop;
    insert into public.qua_tang_chuong (ma, nguoi_gui, mo_dun) values (v_ma, v_uid, p_mo_dun) returning het_han into v_han;
    return jsonb_build_object('ket_qua', 'da_tao', 'ma', v_ma, 'het_han', v_han, 'con_lai', public.qua_tran() - v_dem - 1);
end
$$;

-- Ai cũng xem được quà còn dùng được không (trang nhận quà) — chỉ trả mảng + hạn, không lộ người gửi.
create or replace function xem_qua_chuong(p_ma text) returns jsonb
    language sql stable security definer set search_path = '' as $$
    select coalesce((select jsonb_build_object('mo_dun', mo_dun, 'het_han', het_han,
            'con_dung', nguoi_nhan is null and het_han > now())
        from public.qua_tang_chuong where ma = p_ma), jsonb_build_object('ket_qua', 'khong_co'))
$$;

create or replace function nhan_qua_chuong(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_q public.qua_tang_chuong;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_ma is null or p_ma !~ '^[a-z0-9]{10}$' then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    select * into v_q from public.qua_tang_chuong where ma = p_ma for update;
    if v_q.ma is null then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    if v_q.nguoi_gui = v_uid then return jsonb_build_object('ket_qua', 'tu_tang'); end if;
    if v_q.nguoi_nhan = v_uid then return jsonb_build_object('ket_qua', 'da_nhan', 'mo_dun', v_q.mo_dun); end if;
    if v_q.nguoi_nhan is not null then return jsonb_build_object('ket_qua', 'da_dung'); end if;
    if v_q.het_han <= now() then return jsonb_build_object('ket_qua', 'het_han'); end if;
    if not exists (select 1 from public.ho_so where user_id = v_uid) then return jsonb_build_object('ket_qua', 'chua_luu_ho_so'); end if;
    if exists (select 1 from public.qua_tang_chuong where nguoi_nhan = v_uid and mo_dun = v_q.mo_dun) then
        return jsonb_build_object('ket_qua', 'da_co_qua', 'mo_dun', v_q.mo_dun);
    end if;
    update public.qua_tang_chuong set nguoi_nhan = v_uid, nhan_luc = now() where ma = p_ma;
    return jsonb_build_object('ket_qua', 'da_nhan', 'mo_dun', v_q.mo_dun);
end
$$;

-- Số chương được tặng thêm cho mảng này (0 hoặc 1): quà đã nhận trong 30 ngày.
create or replace function chuong_duoc_tang(p_mo_dun text) returns integer
    language sql stable security definer set search_path = '' as $$
    select case when exists (select 1 from public.qua_tang_chuong where nguoi_nhan = (select auth.uid())
                             and mo_dun = p_mo_dun and nhan_luc > now() - interval '30 days') then 1 else 0 end
$$;

-- Người gửi xem lượt tặng còn lại + quà đã gửi (đã nhận hay chưa — không lộ người nhận).
create or replace function qua_cua_toi() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    return jsonb_build_object(
        'bat', public.qt_bat_cau_hinh('sao.qua.bat'),
        'tran', public.qua_tran(),
        'da_gui_30_ngay', (select count(*) from public.qua_tang_chuong where nguoi_gui = v_uid and tao_luc > now() - interval '30 days'),
        'co_the_tang', exists (select 1 from public.so_cai_sao where user_id = v_uid and loai = 'dung' and khoa like 'dung:' || v_uid || ':lg:%'),
        'gui', coalesce((select jsonb_agg(jsonb_build_object('ma', q.ma, 'mo_dun', q.mo_dun, 'het_han', q.het_han,
                    'da_nhan', q.nguoi_nhan is not null) order by q.tao_luc desc)
                 from (select * from public.qua_tang_chuong where nguoi_gui = v_uid order by tao_luc desc limit 10) q), '[]'::jsonb),
        'nhan', coalesce((select jsonb_agg(jsonb_build_object('mo_dun', q.mo_dun, 'den', q.nhan_luc + interval '30 days'))
                 from public.qua_tang_chuong q where q.nguoi_nhan = v_uid and q.nhan_luc > now() - interval '30 days'), '[]'::jsonb));
end
$$;

-- ---------------------------------------------------------------- quyền
revoke all on function sao_so_du_cua(uuid), qt_bat_cau_hinh(text), hh_cho_don(bigint), qua_tran(),
    vi_sao_chi_tiet(), hoa_hong_cua_toi(), thong_ke_hoa_hong(integer), diem_danh(), tao_qua_chuong(text),
    xem_qua_chuong(text), nhan_qua_chuong(text), chuong_duoc_tang(text), qua_cua_toi() from public, anon, authenticated;
grant execute on function vi_sao_chi_tiet(), hoa_hong_cua_toi(), thong_ke_hoa_hong(integer), diem_danh(),
    tao_qua_chuong(text), nhan_qua_chuong(text), chuong_duoc_tang(text), qua_cua_toi() to authenticated;
grant execute on function xem_qua_chuong(text) to anon, authenticated;
-- Hàm thay thế giữ nguyên quyền cũ (create or replace không đổi quyền); ghi lại cho chắc.
revoke all on function so_du_sao(), nhan_thuong_gioi_thieu(text) from public, anon;
grant execute on function so_du_sao(), nhan_thuong_gioi_thieu(text) to authenticated;
revoke all on function nap_sao_tu_cong(bigint, integer, text, text), hoan_don_nap(bigint, text), qt_so_du(uuid)
    from public, anon, authenticated;
grant execute on function nap_sao_tu_cong(bigint, integer, text, text) to service_role;
grant execute on function hoan_don_nap(bigint, text) to authenticated;
