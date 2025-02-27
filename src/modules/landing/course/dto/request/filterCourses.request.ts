import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterCourses {
  @ApiPropertyOptional({ type: Number, description: 'Page number', example: 1, default: 7 })
  page?: number;

  @ApiPropertyOptional({ type: Number, description: 'Number of items per page', example: 10, default: 7 })
  perPage?: number;
}
