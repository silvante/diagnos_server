import { IsArray, IsInt, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsString()
  surname: string;

  @IsInt()
  born_in: number;

  @IsString()
  origin: string;

  @IsInt()
  price: number;

  @IsArray()
  type_ids: [number];
}
