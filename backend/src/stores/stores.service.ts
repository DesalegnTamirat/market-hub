import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { JwtPayload } from '../auth/interfaces/request-with-user.interface';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async createStore(user: JwtPayload, createStoreDto: CreateStoreDto) {
    if (user.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can create stores');
    }

    return this.prisma.store.create({
      data: {
        name: createStoreDto.name,
        description: createStoreDto.description,
        vendorId: user.sub,
      },
    });
  }

  async getMyStores(user: JwtPayload) {
    return this.prisma.store.findMany({
      where: { vendorId: user.sub },
    });
  }

  async getAllStores() {
    return this.prisma.store.findMany({
      include: { vendor: true },
    });
  }

  async getStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  }
}
