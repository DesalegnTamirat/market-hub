import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { type RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('admin')
  @Roles('ADMIN')
  getAdminStats() {
    return this.statsService.getAdminStats();
  }

  @Get('vendor')
  @Roles('VENDOR')
  getVendorStats(@Req() req: RequestWithUser) {
    return this.statsService.getVendorStats(req.user.sub);
  }

  @Get('customer')
  getCustomerStats(@Req() req: RequestWithUser) {
    return this.statsService.getCustomerStats(req.user.sub);
  }
}
