import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { type RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.createProduct(req.user, createProductDto);
  }

  @Get()
  getAll() {
    return this.productsService.getAllProducts();
  }
}
