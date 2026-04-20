import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { QueryInteractionDto } from './dto/query-interaction.dto';
import { Interaction } from './domain/interaction';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Interactions')
@Controller({
  path: 'interactions',
  version: '1',
})
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @ApiCreatedResponse({ type: Interaction })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() dto: CreateInteractionDto,
  ): Promise<Interaction> {
    return this.interactionsService.create(request.user.id, dto);
  }

  @ApiOkResponse({ type: [Interaction] })
  @Get('likes-received')
  @HttpCode(HttpStatus.OK)
  likesReceived(
    @Request() request,
    @Query() query: QueryInteractionDto,
  ): Promise<Interaction[]> {
    return this.interactionsService.findLikesReceived(request.user.id, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 20, 50),
    });
  }
}
