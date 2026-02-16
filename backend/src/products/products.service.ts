import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtPayload } from 'src/auth/interfaces/request-with-user.interface';

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
      },
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        store: true,
      },
    });
  }
}
