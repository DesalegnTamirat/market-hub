import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays, format } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const [userCount, productCount, categoryCount, orderStats, revenueStats] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.category.count(),
        this.prisma.order.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.order.aggregate({
          where: { status: 'PAID' },
          _sum: { totalAmount: true },
        }),
      ]);

    // Trend data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const salesTrend = await Promise.all(
      last7Days.map(async (date) => {
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);

        const dailyRevenue = await this.prisma.order.aggregate({
          where: {
            status: 'PAID',
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: { totalAmount: true },
        });

        return {
          date,
          revenue: dailyRevenue._sum.totalAmount || 0,
        };
      }),
    );

    return {
      totalUsers: userCount,
      totalProducts: productCount,
      totalCategories: categoryCount,
      totalRevenue: revenueStats._sum.totalAmount || 0,
      ordersByStatus: orderStats.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      salesTrend,
    };
  }

  async getVendorStats(vendorId: string) {
    // Get all stores for this vendor
    const stores = await this.prisma.store.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);

    const [productCount, orderItems] = await Promise.all([
      this.prisma.product.count({
        where: { storeId: { in: storeIds } },
      }),
      this.prisma.orderItem.findMany({
        where: { storeId: { in: storeIds } },
        include: { order: true },
      }),
    ]);

    // Total revenue and orders from PAID/SHIPPED/DELIVERED orders
    const validOrders = orderItems.filter((item) =>
      ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
        item.order.status,
      ),
    );

    const totalRevenue = validOrders.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const totalOrders = new Set(validOrders.map((item) => item.orderId)).size;
    const pendingOrders = orderItems.filter(
      (item) => item.order.status === 'PAID',
    ).length;

    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const salesTrend = last7Days.map((date) => {
      const dailyTotal = validOrders
        .filter((item) => format(item.createdAt, 'yyyy-MM-dd') === date)
        .reduce((sum, item) => sum + item.subtotal, 0);

      return { date, revenue: dailyTotal };
    });

    return {
      totalProducts: productCount,
      totalOrders,
      totalRevenue,
      pendingOrders,
      salesTrend,
    };
  }

  async getCustomerStats(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    const totalSpent = orders
      .filter((o) =>
        ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status),
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Last 30 days spending trend
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const spendingTrend = last30Days.map((date) => {
      const dailyTotal = orders
        .filter(
          (o) =>
            format(o.createdAt, 'yyyy-MM-dd') === date &&
            ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status),
        )
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return { date, amount: dailyTotal };
    });

    return {
      totalOrders: orders.length,
      totalSpent,
      spendingTrend,
    };
  }
}
