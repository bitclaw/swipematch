import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InteractionRepository } from './infrastructure/persistence/interaction.repository';
import { MatchesService } from '../matches/matches.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { Interaction, InteractionAction } from './domain/interaction';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class InteractionsService {
  constructor(
    private readonly interactionRepository: InteractionRepository,
    private readonly matchesService: MatchesService,
  ) {}

  async create(
    fromUserId: string,
    dto: CreateInteractionDto,
  ): Promise<Interaction> {
    if (fromUserId === dto.toUserId) {
      throw new UnprocessableEntityException({
        errors: { toUserId: 'cannotInteractWithSelf' },
      });
    }

    const existing = await this.interactionRepository.findByFromUserAndToUser(
      fromUserId,
      dto.toUserId,
    );
    if (existing) {
      throw new ConflictException({
        errors: { interaction: 'alreadyInteracted' },
      });
    }

    const interaction = await this.interactionRepository.create({
      fromUser: fromUserId,
      toUser: dto.toUserId,
      action: dto.action,
    });

    if (
      dto.action === InteractionAction.like ||
      dto.action === InteractionAction.superlike
    ) {
      const reverseInteraction =
        await this.interactionRepository.findByFromUserAndToUser(
          dto.toUserId,
          fromUserId,
        );

      if (
        reverseInteraction &&
        (reverseInteraction.action === InteractionAction.like ||
          reverseInteraction.action === InteractionAction.superlike)
      ) {
        await this.matchesService.createMatch(fromUserId, dto.toUserId);
      }
    }

    return interaction;
  }

  findLikesReceived(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Interaction[]> {
    return this.interactionRepository.findLikesReceived(
      userId,
      paginationOptions,
    );
  }

  findById(id: string): Promise<NullableType<Interaction>> {
    return this.interactionRepository.findById(id);
  }
}
