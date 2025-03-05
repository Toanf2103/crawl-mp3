import { Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { CrawlQueueService } from './crawl-queue.service';

@Controller('crawl-queue')
export class CrawlQueueController {
  constructor(private crawlQueueService: CrawlQueueService) {}

  @Post('start')
  async startCrawling() {
    const count = await this.crawlQueueService.processPendingTasks();
    return { success: true, message: `Đã thêm ${count} tác vụ vào queue` };
  }

  @Post('retry-failed')
  async retryFailed() {
    const count = await this.crawlQueueService.retryFailedTasks();
    return { success: true, message: `Đã thêm lại ${count} tác vụ bị lỗi vào queue` };
  }

  @Get('stats')
  async getQueueStats() {
    const stats = await this.crawlQueueService.getQueueStats();
    return { success: true, data: stats };
  }

  @Post('recover')
  async recoverStuckTasks() {
    try {
      const count = await this.crawlQueueService.recoverStuckTasks();
      return { success: true, message: `Đã khôi phục ${count} tác vụ bị treo` };
    } catch (error) {
      throw new HttpException(`Lỗi khi khôi phục tác vụ: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('test')
  async test() {
    return this.crawlQueueService.test();
  }
}
