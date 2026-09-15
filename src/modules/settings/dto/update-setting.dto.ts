import { IsDefined } from 'class-validator';

export class UpdateSettingDto {
  @IsDefined({ message: 'Giá trị cấu hình không được để trống' })
  value!: unknown;
}
