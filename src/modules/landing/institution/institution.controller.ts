import { Public } from '@/modules/guards/public.guard';
import { Controller, Get } from '@nestjs/common';
import { InstitutionService } from './institution.service';

@Public()
@Controller('institutions')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get('best-institutions')
  async getPopularCourses() {
    return await this.institutionService.getBestInstitutions();
  }
}
