import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MatchesService } from './matches.service';
import { QueryMatchDto } from './dto/query-match.dto';
import { Match } from './domain/match';
import { HttpCacheInterceptor } from '../common/interceptors/http-cache.interceptor';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Matches')
@Controller({
  path: 'matches',
  version: '1',
})
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @ApiOkResponse({ type: [Match] })
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(HttpCacheInterceptor)
  findAll(@Request() request, @Query() query: QueryMatchDto): Promise<Match[]> {
    return this.matchesService.findByUserId(request.user.id, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 20, 50),
    });
  }

  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  unmatch(@Request() request, @Param('id') id: string): Promise<void> {
    return this.matchesService.unmatch(id, request.user.id);
  }
}
