import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AuthGuard } from '@nestjs/passport';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';

@Controller('wishlist')
@UseGuards(AuthGuard('jwt'))
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() req: any) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post('toggle')
  toggleWishlist(@Req() req: any, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggleWishlist(req.user.id, dto.productId);
  }

  @Get('check/:productId')
  checkWishlist(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlistService.checkWishlist(req.user.id, productId);
  }
}
