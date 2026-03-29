import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { type RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Customer: Create order from cart
  @Post()
  createOrder(
    @Req() req: RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.sub, createOrderDto);
  }

  // Customer: Get my orders
  @Get('my-orders')
  getMyOrders(@Req() req: RequestWithUser) {
    return this.ordersService.getCustomerOrders(req.user.sub);
  }

  // Customer: Get single order
  @Get(':orderNumber')
  getOrderByNumber(
    @Req() req: RequestWithUser,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.ordersService.getOrderByNumber(req.user, orderNumber);
  }

  // Vendor: Get orders for my stores
  @UseGuards(RolesGuard)
  @Roles('VENDOR')
  @Get('vendor/my-orders')
  getVendorOrders(@Req() req: RequestWithUser) {
    return this.ordersService.getVendorOrders(req.user.sub);
  }

  // Vendor: Update order status
  @UseGuards(RolesGuard)
  @Roles('VENDOR')
  @Patch(':id/status')
  updateOrderStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      req.user.sub,
      id,
      updateOrderStatusDto,
    );
  }

  // Admin: Get all orders
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}
