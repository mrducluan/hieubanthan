-- Rollback cho 0036_push_tuan_cua_toi.sql: bỏ mốc 'tuan_cua_toi' khỏi mọi dòng rồi trả ràng buộc 0035.
update push_tuy_chon set moc_lich = array_remove(moc_lich, 'tuan_cua_toi') where 'tuan_cua_toi' = any (moc_lich);
alter table push_tuy_chon drop constraint if exists push_tuy_chon_moc_lich_check;
alter table push_tuy_chon add constraint push_tuy_chon_moc_lich_check
    check (moc_lich <@ array['thang_ca_nhan', 'giao_tiet', 'lap_xuan_tet', 'thang_hai_la_so']::text[]);
comment on column push_tuy_chon.moc_lich is
    'Mốc lịch người dùng tự tích: thang_ca_nhan · giao_tiet · lap_xuan_tet · thang_hai_la_so (0035: đầu tháng, cron đọc lá số trong ho_so của chính người đó).';
