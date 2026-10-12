import * as migration_20261011_155556_khoi_tao from './20261011_155556_khoi_tao';
import * as migration_20261012_015320_cong_tac_vien_video from './20261012_015320_cong_tac_vien_video';
import * as migration_20261012_042950_loai_bai from './20261012_042950_loai_bai';
import * as migration_20261012_054903_giao_dien_website from './20261012_054903_giao_dien_website';
import * as migration_20261012_083118_xac_thuc_2_buoc from './20261012_083118_xac_thuc_2_buoc';
import * as migration_20261012_083453_trang_dich from './20261012_083453_trang_dich';
import * as migration_20261012_083859_bai_lien_quan_nghia from './20261012_083859_bai_lien_quan_nghia';
import * as migration_20261012_102241_menu_dau_trang from './20261012_102241_menu_dau_trang';

export const migrations = [
  {
    up: migration_20261011_155556_khoi_tao.up,
    down: migration_20261011_155556_khoi_tao.down,
    name: '20261011_155556_khoi_tao',
  },
  {
    up: migration_20261012_015320_cong_tac_vien_video.up,
    down: migration_20261012_015320_cong_tac_vien_video.down,
    name: '20261012_015320_cong_tac_vien_video',
  },
  {
    up: migration_20261012_042950_loai_bai.up,
    down: migration_20261012_042950_loai_bai.down,
    name: '20261012_042950_loai_bai',
  },
  {
    up: migration_20261012_054903_giao_dien_website.up,
    down: migration_20261012_054903_giao_dien_website.down,
    name: '20261012_054903_giao_dien_website',
  },
  {
    up: migration_20261012_083118_xac_thuc_2_buoc.up,
    down: migration_20261012_083118_xac_thuc_2_buoc.down,
    name: '20261012_083118_xac_thuc_2_buoc',
  },
  {
    up: migration_20261012_083453_trang_dich.up,
    down: migration_20261012_083453_trang_dich.down,
    name: '20261012_083453_trang_dich',
  },
  {
    up: migration_20261012_083859_bai_lien_quan_nghia.up,
    down: migration_20261012_083859_bai_lien_quan_nghia.down,
    name: '20261012_083859_bai_lien_quan_nghia',
  },
  {
    up: migration_20261012_102241_menu_dau_trang.up,
    down: migration_20261012_102241_menu_dau_trang.down,
    name: '20261012_102241_menu_dau_trang'
  },
];
