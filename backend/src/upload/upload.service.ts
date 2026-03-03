import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadProductImages(
    vendorId: string,
    productId: string,
    files: Express.Multer.File[],
  ) {
    // Verify product exists and vendor owns it
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You can only upload images to your own products',
      );
    }

    // Validate file types and sizes
    for (const file of files) {
      this.validateFile(file);
    }

    // Upload to Cloudinary
    const uploadPromises = files.map((file) => this.uploadToCloudinary(file));
    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs
    const imageUrls = uploadResults.map(
      (result) => result.secure_url as string,
    );

    // Update product with new images (append to existing)
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          push: imageUrls, // Append new URLs to existing array
        },
      },
    });

    return {
      message: `${imageUrls.length} image(s) uploaded successfully`,
      images: updatedProduct.images,
    };
  }

  async deleteProductImage(
    vendorId: string,
    productId: string,
    imageUrl: string,
  ) {
    // Verify product exists and vendor owns it
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You can only delete images from your own products',
      );
    }

    // Check if image exists in product
    if (!product.images.includes(imageUrl)) {
      throw new NotFoundException('Image not found in product');
    }

    // Extract public ID from Cloudinary URL
    const publicId = this.extractPublicId(imageUrl);

    if (publicId) {
      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
        // Continue anyway to remove from database
      }
    }

    // Remove from product images array
    const updatedImages = product.images.filter((url) => url !== imageUrl);

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        images: updatedImages,
      },
    });

    return {
      message: 'Image deleted successfully',
      images: updatedProduct.images,
    };
  }

  private validateFile(file: Express.Multer.File) {
    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`,
      );
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`,
      );
    }
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'marketplace/products', // Organize in Cloudinary
          resource_type: 'auto',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' }, // Max dimensions
            { quality: 'auto' }, // Auto quality optimization
            { fetch_format: 'auto' }, // Auto format (WebP if supported)
          ],
        },
        (error: UploadApiErrorResponse, result) => {
          if (error) return reject(new Error(error.message));
          resolve(result!);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  private extractPublicId(imageUrl: string): string | null {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const parts = imageUrl.split('/');
      const uploadIndex = parts.indexOf('upload');

      if (uploadIndex === -1) return null;

      // Get everything after 'upload/v{version}/'
      const publicIdWithFormat = parts.slice(uploadIndex + 2).join('/');

      // Remove file extension
      const publicId = publicIdWithFormat.replace(/\.[^/.]+$/, '');

      return publicId;
    } catch (error) {
      console.error('Failed to extract public ID:', error);
      return null;
    }
  }
}
