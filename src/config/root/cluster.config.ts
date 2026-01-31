import { IsBoolean, IsNumber } from 'class-validator';

export class ClusterConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  workers!: number;
}
