import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ConnectionConfig {
  @IsString()
  @IsIn(['postgresql', 'mongodb'])
  connection!: 'postgresql' | 'mongodb';

  @IsString()
  host!: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  port!: number;

  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  database!: string;
}
