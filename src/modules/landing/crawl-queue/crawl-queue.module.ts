import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CrawlQueueService } from './crawl-queue.service';
import { CrawlQueueController } from './crawl.controller';
import { TaskCrawlProcessor } from './task-crawl.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'crawl-queue',
      limiter: {
        max: 5, // Giới hạn 5 công việc đồng thời
        duration: 1000, // trong khoảng 1 giây
      },
      defaultJobOptions: {
        attempts: 3, // Số lần thử lại nếu thất bại
        backoff: {
          type: 'exponential',
          delay: 5000, // Độ trễ ban đầu là 5 giây (tăng theo cấp số nhân)
        },
        removeOnComplete: true, // Xóa công việc khi hoàn thành
      },
    }),
  ],
  providers: [TaskCrawlProcessor, CrawlQueueService],
  controllers: [CrawlQueueController],
  exports: [CrawlQueueService],
})
export class CrawlQueueModule {}
