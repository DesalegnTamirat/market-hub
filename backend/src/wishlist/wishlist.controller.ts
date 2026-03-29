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
import { type RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('wishlist')
@UseGuards(AuthGuard('jwt'))
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() req: RequestWithUser) {
    return this.wishlistService.getWishlist(req.user.sub);
  }

  @Post('toggle')
  toggleWishlist(@Req() req: RequestWithUser, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggleWishlist(req.user.sub, dto.productId);
  }

  @Get('check/:productId')
  checkWishlist(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.checkWishlist(req.user.sub, productId);
  }
}
