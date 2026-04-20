import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { DiscoveryQueryDto } from '../../discovery/dto/discovery-query.dto';

@Injectable()
export class CoordinatesValidationPipe implements PipeTransform<DiscoveryQueryDto> {
  transform(value: DiscoveryQueryDto): DiscoveryQueryDto {
    const lat = Number(value.lat);
    const lng = Number(value.lng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new BadRequestException({
        errors: { lat: 'must be between -90 and 90' },
      });
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new BadRequestException({
        errors: { lng: 'must be between -180 and 180' },
      });
    }

    return { ...value, lat, lng };
  }
}
