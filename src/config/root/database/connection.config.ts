import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class ConnectionConfig {
  @IsString()
  @IsIn(['postgresql', 'mongodb'])
  connection!: 'postgresql' | 'mongodb';

  @IsOptional()
  @IsString()
  uri?: string;

  @ValidateIf((o: ConnectionConfig) => o.connection !== 'mongodb' || !o.uri)
  @IsString()
  host?: string;

  @ValidateIf((o: ConnectionConfig) => o.connection !== 'mongodb' || !o.uri)
  @IsNumber()
  @Min(0)
  @Max(65535)
  port?: number;

  @IsString()
  @IsOptional()
  user?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @ValidateIf((o: ConnectionConfig) => o.connection !== 'mongodb' || !o.uri)
  database?: string;

  @IsString()
  @IsOptional()
  schema?: string;
}
