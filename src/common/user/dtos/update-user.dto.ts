import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  contact: string;
}
