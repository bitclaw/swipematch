import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Analytics')
@Controller({
  path: 'analytics',
  version: '1',
})
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOkResponse({ description: 'Top profiles by likes received' })
  @Get('popular-profiles')
  @HttpCode(HttpStatus.OK)
  popularProfiles(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPopularProfiles(query.days ?? 7);
  }

  @ApiOkResponse({ description: 'Daily engagement metrics' })
  @Get('engagement')
  @HttpCode(HttpStatus.OK)
  engagement(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getEngagementMetrics(query.days ?? 30);
  }

  @ApiOkResponse({ description: 'Match conversion funnel for current user' })
  @Get('match-rate')
  @HttpCode(HttpStatus.OK)
  matchRate(@Request() request) {
    return this.analyticsService.getMatchFunnel(request.user.id);
  }
}
