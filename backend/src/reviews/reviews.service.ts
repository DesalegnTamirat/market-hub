import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, userId: string) {
    const { rating, comment, productId } = createReviewDto;

    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: userId,
          status: {
            in: ['DELIVERED', 'SHIPPED', 'PAID', 'PROCESSING'],
          },
        },
      },
    });

    if (!hasPurchased) {
      throw new BadRequestException(
        'You can only review products you have purchased.',
      );
    }

    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product.');
    }

    const review = await this.prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        productId,
      },
    });

    await this.updateProductRating(productId);

    return review;
  }

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id } });
    await this.updateProductRating(review.productId);

    return { success: true };
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
    });

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviewCount
        : 0;

    await this.prisma.product.update({
      where: { id: productId },
      data: { reviewCount, averageRating },
    });
  }
}
