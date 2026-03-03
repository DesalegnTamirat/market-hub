import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { type RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { DeleteImageDto } from './dto/upload-images.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('product-images')
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images at once
  async uploadProductImages(
    @Req() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('productId') productId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }

    return this.uploadService.uploadProductImages(
      req.user.sub,
      productId,
      files,
    );
  }

  @Delete('product-image')
  async deleteProductImage(
    @Req() req: RequestWithUser,
    @Body() deleteImageDto: DeleteImageDto,
  ) {
    return this.uploadService.deleteProductImage(
      req.user.sub,
      deleteImageDto.productId,
      deleteImageDto.imageUrl,
    );
  }
}
