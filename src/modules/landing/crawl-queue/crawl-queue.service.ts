import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Queue } from 'bull';
import Redis from 'ioredis';
import * as puppeteer from 'puppeteer';
import * as xml2js from 'xml2js';

const prisma = new PrismaClient();

@Injectable()
export class CrawlQueueService implements OnModuleInit {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(CrawlQueueService.name);

  constructor(@InjectQueue('crawl-queue') private crawlQueue: Queue) {
    // Get Redis auth config
    const password = process.env.REDIS_PASSWORD || '';
    const username = process.env.REDIS_USERNAME || (password ? 'default' : undefined);

    // Create Redis client with authentication
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: username,
      password: password || undefined,
    });
  }

  async onModuleInit() {
    // Sử dụng khóa Redis để đảm bảo chỉ một replica thực hiện khôi phục
    const lockKey = 'crawl-queue:initialization-lock';
    const lockValue = Date.now().toString();
    const lockAcquired = await this.redisClient.set(lockKey, lockValue, 'EX', 30, 'NX');

    if (lockAcquired) {
      try {
        this.logger.log('Replica này sẽ thực hiện khôi phục tác vụ');
        await this.recoverStuckTasks();
      } finally {
        // Chỉ xóa khóa nếu giá trị khớp (đảm bảo chúng ta không xóa khóa của replica khác)
        const script = `
          if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
          else
            return 0
          end
        `;
        await this.redisClient.eval(script, 1, lockKey, lockValue);
      }
    } else {
      this.logger.log('Replica khác đang thực hiện khôi phục tác vụ');
    }
  }

  // Khôi phục các tác vụ bị "treo"
  async recoverStuckTasks() {
    // Tìm các tác vụ đang PROCESSING (có thể bị treo khi server bị dừng)
    const stuckTasks = await prisma.taskCrawls.findMany({
      where: {
        status: 'PROCESSING',
      },
    });

    this.logger.log(`Khôi phục ${stuckTasks.length} tác vụ đang bị treo`);

    for (const task of stuckTasks) {
      // Đặt lại trạng thái về PENDING
      await prisma.taskCrawls.update({
        where: { id: task.id },
        data: { status: 'PENDING' },
      });

      this.logger.log(`Đã đặt lại trạng thái của tác vụ ${task.id} về PENDING`);
    }

    // Tìm các tác vụ đang QUEUED (chưa bắt đầu xử lý khi server bị dừng)
    const queuedTasks = await prisma.taskCrawls.findMany({
      where: {
        status: 'QUEUED',
      },
    });

    this.logger.log(`Khôi phục ${queuedTasks.length} tác vụ đang trong queue`);

    for (const task of queuedTasks) {
      // Đặt lại trạng thái về PENDING
      await prisma.taskCrawls.update({
        where: { id: task.id },
        data: { status: 'PENDING' },
      });

      this.logger.log(`Đã đặt lại trạng thái của tác vụ ${task.id} về PENDING`);
    }

    return stuckTasks.length + queuedTasks.length;
  }

  // Thêm một công việc vào queue
  async addTaskToQueue(taskId: string, link: string) {
    return this.crawlQueue.add('process-url', { taskId, link });
  }

  // Lấy các tác vụ PENDING và thêm vào queue
  async processPendingTasks() {
    const lockKey = 'crawl-queue:process-pending-lock';
    const lockValue = Date.now().toString();
    const lockAcquired = await this.redisClient.set(lockKey, lockValue, 'EX', 30, 'NX');

    if (!lockAcquired) {
      this.logger.log('Có replica khác đang xử lý các tác vụ đang chờ');
      return 0;
    }

    try {
      // Tìm và cập nhật trạng thái thành QUEUED trong một giao dịch
      const pendingTasks = await prisma.$transaction(async (tx) => {
        // Tìm các tác vụ PENDING
        const tasks = await tx.taskCrawls.findMany({
          where: { status: 'PENDING' },
          // take: 1,
        });

        if (tasks.length > 0) {
          await tx.taskCrawls.updateMany({
            where: {
              id: { in: tasks.map((t) => t.id) },
            },
            data: { status: 'QUEUED' },
          });
        }

        return tasks;
      });

      this.logger.log(`Tìm thấy ${pendingTasks.length} tác vụ đang chờ xử lý`);

      // Thêm vào queue
      for (const task of pendingTasks) {
        await this.addTaskToQueue(task.id, task.link);
        this.logger.log(`Đã thêm tác vụ ${task.id} vào queue`);
      }

      return pendingTasks.length;
    } finally {
      // Giải phóng khóa
      const script = `
        if redis.call('get', KEYS[1]) == ARGV[1] then
          return redis.call('del', KEYS[1])
        else
          return 0
        end
      `;
      await this.redisClient.eval(script, 1, lockKey, lockValue);
    }
  }

  // Chức năng để chạy lại các tác vụ bị lỗi
  async retryFailedTasks() {
    const lockKey = 'crawl-queue:retry-failed-lock';
    const lockValue = Date.now().toString();
    const lockAcquired = await this.redisClient.set(lockKey, lockValue, 'EX', 30, 'NX');

    if (!lockAcquired) {
      this.logger.log('Có replica khác đang xử lý các tác vụ bị lỗi');
      return 0;
    }

    try {
      // Tìm và cập nhật trạng thái thành QUEUED trong một giao dịch
      const failedTasks = await prisma.$transaction(async (tx) => {
        // Tìm các tác vụ FAILED
        const tasks = await tx.taskCrawls.findMany({
          where: { status: 'FAILED' },
          // take: 100,
        });

        if (tasks.length > 0) {
          await tx.taskCrawls.updateMany({
            where: {
              id: { in: tasks.map((t) => t.id) },
            },
            data: { status: 'QUEUED' },
          });
        }

        return tasks;
      });

      this.logger.log(`Tìm thấy ${failedTasks.length} tác vụ bị lỗi`);

      // Thêm vào queue
      for (const task of failedTasks) {
        await this.addTaskToQueue(task.id, task.link);
        this.logger.log(`Đã thêm lại tác vụ ${task.id} vào queue`);
      }

      return failedTasks.length;
    } finally {
      // Giải phóng khóa
      const script = `
        if redis.call('get', KEYS[1]) == ARGV[1] then
          return redis.call('del', KEYS[1])
        else
          return 0
        end
      `;
      await this.redisClient.eval(script, 1, lockKey, lockValue);
    }
  }

  // Lấy thông tin về trạng thái của queue
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.crawlQueue.getWaitingCount(),
      this.crawlQueue.getActiveCount(),
      this.crawlQueue.getCompletedCount(),
      this.crawlQueue.getFailedCount(),
    ]);

    // Lấy thông tin từ cơ sở dữ liệu
    const [pendingCount, queuedCount, processingCount, completedCount, failedCount] = await Promise.all([
      prisma.taskCrawls.count({ where: { status: 'PENDING' } }),
      prisma.taskCrawls.count({ where: { status: 'QUEUED' } }),
      prisma.taskCrawls.count({ where: { status: 'PROCESSING' } }),
      prisma.taskCrawls.count({ where: { status: 'COMPLETED' } }),
      prisma.taskCrawls.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      queue: {
        waiting,
        active,
        completed,
        failed,
      },
      database: {
        pending: pendingCount,
        queued: queuedCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
        total: pendingCount + queuedCount + processingCount + completedCount + failedCount,
      },
    };
  }

  async test() {
    this.test2();
    return 1;
  }

  private async test2() {
    const link = 'https://www.nhaccuatui.com/bai-hat/nhac-tre-moi.2.html';

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.goto(link, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const songs = await page.evaluate(() => {
        const ulElement = document.querySelector('.listGenre');
        if (!ulElement) {
          return [];
        }
        const avatarLinks = ulElement.querySelectorAll('a.avatar_song');

        // Chuyển đổi NodeList thành mảng và lấy href
        return Array.from(avatarLinks as NodeListOf<HTMLAnchorElement>).map((link) => ({
          href: link.href,
        }));
      });

      const dataInsert: any[] = [];

      const chunkSize = 5;
      const testSong = [songs[0], songs[1]];
      const songChunks = this.chunkArray(testSong, chunkSize);

      for (const chunk of songChunks) {
        const promises = chunk.map((song) => this.getDetailSong(song.href));
        const chunkResults = await Promise.all(promises);

        const formattedSongs = chunkResults.map((song) => ({
          singers: song.singers || [],
          xmlURL: song.xmlURL || null,
          lyricHTML: song.lyricHTML || null,
          title: song.title,
          time: song.time || null,
          creator: song.creator || null,
          location: song.location || null,
          locationHQ: song.locationHQ || null,
          hasHQ: song.hasHQ || null,
          info: song.info || null,
          lyric: song.lyric || null,
          bgimage: song.bgimage || null,
          avatar: song.avatar || null,
          coverimage: song.coverimage || null,
          newtab: song.newtab || null,
          kbit: song.kbit || null,
          key: song.key || null,
          seeking: song.seeking || null,
          isStream: song.isStream || null,
        }));

        dataInsert.push(...formattedSongs);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const rs = await prisma.songs.createMany({
        data: dataInsert,
      });

      console.log(`Đã xử lý ${dataInsert.length}/${songs.length} bài hát`, dataInsert);

      return dataInsert;

      return dataInsert;
    } catch (error) {
      console.error('Lỗi trong crawlSongs:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private chunkArray(array: any, chunkSize: any) {
    const chunks = <any>[];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async getDetailSong(link) {
    console.log('Start crawl song link:', link);
    // const link =
    //   'https://www.nhaccuatui.com/bai-hat/nhin-ve-phia-em-piano-version-dinh-dung-ft-minh-vuong-m4u.buc8SVMbGR0F.html';

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.goto(link, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      const data = await page.evaluate(() => {
        // Tìm tất cả thẻ script
        const info = <any>{};
        const scripts = document.querySelectorAll('script');

        // Lặp qua các script để tìm cái chứa thông tin cần thiết
        for (const script of scripts) {
          if (script.textContent && script.textContent.includes('player.peConfig.xmlURL')) {
            // Trích xuất URL bằng regex
            const match = script.textContent.match(/player\.peConfig\.xmlURL\s*=\s*"([^"]+)"/);
            if (match && match[1]) {
              info.xmlURL = match[1];
            }
          }
        }

        const topbreadCrumb = document.querySelector('.topbreadCrumb');
        const lastSpan = topbreadCrumb ? topbreadCrumb.querySelector('span:last-of-type') : null;
        const singers = lastSpan ? Array.from(lastSpan.querySelectorAll('a')).map((a) => a.href) : [];

        const divLyric = document.getElementById('divLyric');
        const lyricHTML = divLyric ? divLyric.innerHTML : '';

        info.singers = singers;
        info.lyricHTML = lyricHTML;
        return info;
      });
      if (!data) {
        throw new Error('Không tìm thấy XML URL trong trang');
      }
      const response = await axios.get(data.xmlURL, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Referer: 'https://www.nhaccuatui.com/',
        },
      });

      const parser = new xml2js.Parser({
        explicitArray: false,
        trim: true,
      });

      const result = await parser.parseStringPromise(response.data);

      return {
        ...data,
        ...result?.tracklist?.track,
      };
    } catch (error) {
      console.error('Lỗi trong crawl detail songs:', error);
      return null;
    } finally {
      await browser.close();
    }
  }
}
