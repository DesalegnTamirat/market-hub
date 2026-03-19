import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleWishlistDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
