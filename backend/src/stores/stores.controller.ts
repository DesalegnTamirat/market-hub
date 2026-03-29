import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { type RequestWithUser } from '../auth/interfaces/request-with-user.interface';
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
  @Get('my-stores')
  getMyStores(@Req() req: RequestWithUser) {
    return this.storeService.getMyStores(req.user);
  }

  @Get()
  getAll() {
    return this.storeService.getAllStores();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }
}
