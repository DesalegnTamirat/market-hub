import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            store: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingWishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingWishlistItem) {
      // Remove from wishlist
      await this.prisma.wishlist.delete({
        where: { id: existingWishlistItem.id },
      });
      return { added: false };
    } else {
      // Add to wishlist
      await this.prisma.wishlist.create({
        data: {
          userId,
          productId,
        },
      });
      return { added: true };
    }
  }

  async checkWishlist(userId: string, productId: string) {
    const item = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
    return { isWishlisted: !!item };
  }
}
