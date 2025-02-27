import { Module } from '@nestjs/common';
import { CrwalController } from './crawl.controller';
import { CrawlService } from './crawl.service';

@Module({
  imports: [],
  controllers: [CrwalController],
  providers: [CrawlService],
})
export class CrawlModule {}
