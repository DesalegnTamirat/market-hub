import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { type RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
  getAll(
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.productsService.getAllProducts(
      categoryId,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
    );
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(req.user, id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Delete(':id')
  delete(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.productsService.deleteProduct(req.user, id);
  }
}
