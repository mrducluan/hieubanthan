import * as migration_20261011_155556_khoi_tao from './20261011_155556_khoi_tao';
import * as migration_20261012_015320_cong_tac_vien_video from './20261012_015320_cong_tac_vien_video';
import * as migration_20261012_042950_loai_bai from './20261012_042950_loai_bai';

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
    name: '20261012_042950_loai_bai'
  },
];
