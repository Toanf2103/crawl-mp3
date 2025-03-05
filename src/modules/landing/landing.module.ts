import { Module } from '@nestjs/common';
import { CrawlQueueModule } from './crawl-queue/crawl-queue.module';
import { CrawlModule } from './crawl/crawl.module';

@Module({
  imports: [CrawlModule, CrawlQueueModule],
})
export class LandingModule {}
