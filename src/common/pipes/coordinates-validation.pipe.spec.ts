import { BadRequestException } from '@nestjs/common';
import { CoordinatesValidationPipe } from './coordinates-validation.pipe';

describe('CoordinatesValidationPipe', () => {
  const pipe = new CoordinatesValidationPipe();

  it('should pass valid coordinates through', () => {
    const result = pipe.transform({ lat: 37.7749, lng: -122.4194 });

    expect(result.lat).toBe(37.7749);
    expect(result.lng).toBe(-122.4194);
  });

  it('should convert string coordinates to numbers', () => {
    const result = pipe.transform({
      lat: '40.7128' as unknown as number,
      lng: '-74.0060' as unknown as number,
    });

    expect(result.lat).toBe(40.7128);
    expect(result.lng).toBe(-74.006);
  });

  it('should reject latitude below -90', () => {
    expect(() => pipe.transform({ lat: -91, lng: 0 })).toThrow(
      BadRequestException,
    );
  });

  it('should reject latitude above 90', () => {
    expect(() => pipe.transform({ lat: 91, lng: 0 })).toThrow(
      BadRequestException,
    );
  });

  it('should reject longitude below -180', () => {
    expect(() => pipe.transform({ lat: 0, lng: -181 })).toThrow(
      BadRequestException,
    );
  });

  it('should reject longitude above 180', () => {
    expect(() => pipe.transform({ lat: 0, lng: 181 })).toThrow(
      BadRequestException,
    );
  });

  it('should reject NaN latitude', () => {
    expect(() =>
      pipe.transform({ lat: 'abc' as unknown as number, lng: 0 }),
    ).toThrow(BadRequestException);
  });

  it('should allow edge values (-90, 90, -180, 180)', () => {
    expect(() => pipe.transform({ lat: -90, lng: -180 })).not.toThrow();
    expect(() => pipe.transform({ lat: 90, lng: 180 })).not.toThrow();
  });
});
