import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { type RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard) // All cart routes require authentication
export class CartController {
  constructor(private cartService: CartService) {}

  // Get user's cart
  @Get()
  getCart(@Req() req: RequestWithUser) {
    return this.cartService.getCart(req.user.sub);
  }

  // Add item to cart
  @Post('items')
  addToCart(@Req() req: RequestWithUser, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.sub, addToCartDto);
  }

  // Update cart item quantity
  @Patch('items/:productId')
  updateCartItem(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      req.user.sub,
      productId,
      updateCartItemDto,
    );
  }

  // Remove item from cart
  @Delete('items/:productId')
  removeFromCart(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeFromCart(req.user.sub, productId);
  }

  // Clear entire cart
  @Delete()
  clearCart(@Req() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.sub);
  }
}
