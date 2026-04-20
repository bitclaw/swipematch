import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('Profile Photos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'users/me/photos',
  version: '1',
})
export class ProfilePhotosController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Photo uploaded, returns updated photoUrls array',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Invalid file type. Allowed: ${ALLOWED_MIMES.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const currentPhotos = user.photoUrls ?? [];
    if (currentPhotos.length >= MAX_PHOTOS) {
      throw new BadRequestException(
        `Maximum ${MAX_PHOTOS} photos allowed. Remove one first.`,
      );
    }

    const photoPath = `/uploads/photos/${Date.now()}-${file.originalname}`;
    const updatedPhotos = [...currentPhotos, photoPath];

    await this.usersService.update(req.user.id, {
      photoUrls: updatedPhotos,
    } as never);

    return { photoUrls: updatedPhotos };
  }

  @Delete(':index')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'index',
    type: Number,
    description: 'Photo index (0-based)',
  })
  @ApiOkResponse({
    description: 'Photo removed, returns updated photoUrls array',
  })
  async removePhoto(
    @Request() req: { user: { id: string } },
    @Param('index') index: string,
  ) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const currentPhotos = user.photoUrls ?? [];
    const idx = parseInt(index, 10);

    if (isNaN(idx) || idx < 0 || idx >= currentPhotos.length) {
      throw new BadRequestException('Invalid photo index');
    }

    const updatedPhotos = currentPhotos.filter((_, i) => i !== idx);

    await this.usersService.update(req.user.id, {
      photoUrls: updatedPhotos,
    } as never);

    return { photoUrls: updatedPhotos };
  }
}
