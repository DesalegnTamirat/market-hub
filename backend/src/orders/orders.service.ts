import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtPayload } from 'src/auth/interfaces/request-with-user.interface';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // Get user's cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Check stock availability for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
        );
      }
    }

    // Calculate total
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // Create order with items
    // Total amount calculation and order creation logic remains...
    const order = await this.prisma.order.create({
      data: {
        customerId: userId,
        totalAmount,
        shippingAddress: { ...createOrderDto.shippingAddress },
        status: 'PENDING',
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Price snapshot
            subtotal: item.product.price * item.quantity,
            storeId: item.product.storeId,
            storeName: item.product.store.name, // Store name snapshot
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return order;
  }

  async getCustomerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderByNumber(user: JwtPayload, orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check authorization
    if (user.role === 'CUSTOMER' && order.customerId !== user.sub) {
      throw new ForbiddenException('You can only view your own orders');
    }

    // Vendors can only see orders containing their products
    if (user.role === 'VENDOR') {
      const vendorStores = await this.prisma.store.findMany({
        where: { vendorId: user.sub },
        select: { id: true },
      });

      const vendorStoreIds = vendorStores.map((store) => store.id);
      const hasVendorItems = order.items.some((item) =>
        vendorStoreIds.includes(item.storeId),
      );

      if (!hasVendorItems) {
        throw new ForbiddenException(
          'You can only view orders for your stores',
        );
      }
    }

    return order;
  }

  async getVendorOrders(vendorId: string) {
    // Get vendor's stores
    const stores = await this.prisma.store.findMany({
      where: { vendorId },
      select: { id: true },
    });

    const storeIds = stores.map((store) => store.id);

    // Get order items for these stores
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        storeId: { in: storeIds },
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orderItems;
  }

  async updateOrderStatus(
    vendorId: string,
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if vendor owns any items in this order
    const vendorStores = await this.prisma.store.findMany({
      where: { vendorId },
      select: { id: true },
    });

    const vendorStoreIds = vendorStores.map((store) => store.id);
    const hasVendorItems = order.items.some((item) =>
      vendorStoreIds.includes(item.storeId),
    );

    if (!hasVendorItems) {
      throw new ForbiddenException(
        'You can only update orders containing your products',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: updateOrderStatusDto.status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
