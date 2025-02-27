import { Public } from '@/modules/guards/public.guard';
import { Controller, Get } from '@nestjs/common';
import { UniversityService } from './university.service';

@Public()
@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  @Get('best-universities')
  async getBestUniversities() {
    return await this.universityService.getBestUniversities();
  }
}
