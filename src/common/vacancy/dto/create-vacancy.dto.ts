import { WorkerRoles } from '@prisma/client';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateVacancyDto {
  @IsString()
  name: string;

  @IsNumber()
  age: number;

  @IsString()
  about: string;

  @IsString()
  contact: string;

  @IsString()
  origin: string;

  @IsString()
  job: string;

  @IsString()
  role: WorkerRoles;

  @IsBoolean()
  is_private: boolean;
}
