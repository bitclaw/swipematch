import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { Message } from './domain/message';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Messages')
@Controller({
  path: 'messages',
  version: '1',
})
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiCreatedResponse({ type: Message })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() request, @Body() dto: CreateMessageDto): Promise<Message> {
    return this.messagesService.create(request.user.id, dto);
  }

  @ApiOkResponse({ type: [Message] })
  @ApiParam({ name: 'matchId', type: String })
  @Get(':matchId')
  @HttpCode(HttpStatus.OK)
  findByMatch(
    @Request() request,
    @Param('matchId') matchId: string,
    @Query() query: QueryMessageDto,
  ): Promise<Message[]> {
    return this.messagesService.findByMatchId(matchId, request.user.id, {
      page: query.page ?? 1,
      limit: Math.min(query.limit ?? 50, 100),
    });
  }

  @ApiOkResponse({ type: Message })
  @ApiParam({ name: 'id', type: String })
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(@Request() request, @Param('id') id: string): Promise<Message> {
    return this.messagesService.markAsRead(id, request.user.id);
  }
}
