import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { type RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private storeService: StoresService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post()
  create(@Req() req: RequestWithUser, @Body() createStoreDto: CreateStoreDto) {
    return this.storeService.createStore(req.user, createStoreDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyStores(@Req() req: RequestWithUser) {
    return this.storeService.getMyStores(req.user);
  }

  @Get()
  getAll() {
    return this.storeService.getAllStores();
  }
}
