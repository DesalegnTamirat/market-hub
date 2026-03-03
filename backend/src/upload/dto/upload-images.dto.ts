import { IsString } from 'class-validator';

export class UploadImagesDto {
  @IsString()
  productId: string;
}
export class DeleteImageDto {
  @IsString()
  productId: string;

  @IsString()
  imageUrl: string;
}
