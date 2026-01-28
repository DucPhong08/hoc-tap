import { IsString } from 'class-validator';

export class MigrationOrmConfig {
  @IsString()
  path!: string;

  @IsString()
  pathTs!: string;
}
