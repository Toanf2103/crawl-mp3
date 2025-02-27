import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCourses {
  @ApiPropertyOptional({ type: Boolean, description: 'Certificate' })
  certificate?: Boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Free' })
  free?: Boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'Free certificate' })
  'free-certificate'?: Boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'University' })
  'university'?: Boolean;

  @ApiPropertyOptional({ type: String, description: 'Level' })
  level?: String;

  @ApiPropertyOptional({ type: String, description: 'Duration' })
  duration?: String;

  @ApiPropertyOptional({ type: String, description: 'Language' })
  lang?: String;

  @ApiPropertyOptional({ type: Number, description: 'Page number', example: 1, default: 7 })
  page?: number;

  @ApiPropertyOptional({ type: Number, description: 'Number of items per page', example: 10, default: 7 })
  perPage?: number;
}
