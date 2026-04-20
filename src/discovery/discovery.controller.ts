import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DiscoveryService } from './discovery.service';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { CoordinatesValidationPipe } from '../common/pipes/coordinates-validation.pipe';
import { HttpCacheInterceptor } from '../common/interceptors/http-cache.interceptor';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Discovery')
@Controller({
  path: 'discovery',
  version: '1',
})
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @ApiOkResponse({
    description: 'Nearby users matching preferences (cached 5 min)',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(CoordinatesValidationPipe)
  @UseInterceptors(HttpCacheInterceptor)
  findNearby(@Request() request, @Query() query: DiscoveryQueryDto) {
    return this.discoveryService.findNearbyUsers(request.user.id, query);
  }
}
