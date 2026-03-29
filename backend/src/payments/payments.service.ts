import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    // Initialize Stripe with secret key
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }

  async createPaymentIntent(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ) {
    const { orderId } = createPaymentDto;

    // Get order and verify ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException('You can only pay for your own orders');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        'Order must be in PENDING status to create payment',
      );
    }

    // Check if payment already exists
    if (order.payment) {
      if (order.payment.status === 'SUCCEEDED') {
        throw new BadRequestException('Order already paid');
      }

      // Return existing payment intent if still pending
      return {
        clientSecret: order.payment.stripeClientSecret,
        paymentIntentId: order.payment.stripePaymentIntentId,
      };
    }

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Save payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'usd',
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    return {
      clientSecret: payment.stripeClientSecret,
      paymentIntentId: payment.stripePaymentIntentId,
    };
  }

  async getPaymentByOrderId(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException('You can only view your own payments');
    }

    if (!order.payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    return order.payment;
  }

  async handleStripeWebhook(signature: string, rawBody: any) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as { message: string }).message}`,
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Find payment by Stripe payment intent ID
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { 
        order: {
          include: {
            items: true
          }
        } 
      },
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED' },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
    });

    // Clear user's cart
    await this.prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: payment.order.customerId,
        },
      },
    });

    // Reduce product stock
    for (const item of payment.order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    console.log(`✅ Payment succeeded for order: ${payment.order.orderNumber}`);

    // TODO: Send confirmation email to customer
    // TODO: Notify vendor about new order
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    console.log(`❌ Payment failed for order: ${payment.order.orderNumber}`);

    // TODO: Send payment failed email to customer
  }
}
