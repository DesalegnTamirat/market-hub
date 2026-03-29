import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtPayload } from '../auth/interfaces/request-with-user.interface';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(user: JwtPayload, createProductDto: CreateProductDto) {
    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can create products');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: createProductDto.storeId },
    });

    if (!store) throw new NotFoundException('Store not found');

    if (store.vendorId !== user.sub)
      throw new ForbiddenException('You do not own this store');

    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        storeId: createProductDto.storeId,
        categoryId: createProductDto.categoryId,
      },
    });
  }

  async getAllProducts(
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
    sortBy?: string,
  ) {
    const where = {
      ...(categoryId ? { categoryId } : {}),
      price: {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      },
    };

    let orderBy = {};
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else {
      orderBy = { createdAt: 'desc' }; // 'newest' or default
    }

    return this.prisma.product.findMany({
      where,
      include: {
        store: true,
      },
      orderBy,
    });
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(
    user: JwtPayload,
    productId: string,
    updateProductDto: UpdateProductDto,
  ) {
    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can update products');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (product.store.vendorId !== user.sub)
      throw new ForbiddenException('You do not own this product');

    return this.prisma.product.update({
      where: { id: productId },
      data: updateProductDto,
    });
  }

  async deleteProduct(user: JwtPayload, productId: string) {
    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can delete products');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('product not found');
    }

    if (product.store.vendorId !== user.sub) {
      throw new ForbiddenException('You do not own this product');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }
}
