import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Headers,
  type RawBodyRequest,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { type RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Create payment intent for an order
  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  createPaymentIntent(
    @Req() req: RequestWithUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      req.user.sub,
      createPaymentDto,
    );
  }

  // Get payment details
  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  getPaymentByOrderId(
    @Req() req: RequestWithUser,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.getPaymentByOrderId(req.user.sub, orderId);
  }

  // Stripe webhook (no auth needed - Stripe calls this)
  @Post('webhook')
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleStripeWebhook(signature, req.body);
  }
}
