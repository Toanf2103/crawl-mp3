import { Controller, Get } from '@nestjs/common';
import { CrawlService } from './crawl.service';

@Controller('crawl')
export class CrwalController {
  constructor(private readonly service: CrawlService) {}

  @Get('type')
  async crwalType() {
    return await this.service.crwalType();
  }
}
