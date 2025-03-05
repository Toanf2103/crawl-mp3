import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Job } from 'bull';
import * as puppeteer from 'puppeteer';
import * as xml2js from 'xml2js';

const prisma = new PrismaClient();

@Processor('crawl-queue')
export class TaskCrawlProcessor {
  private readonly logger = new Logger(TaskCrawlProcessor.name);

  constructor() {}

  @Process('process-url')
  async processUrl(job: Job<{ taskId: string; link: string }>) {
    const { taskId, link } = job.data;
    this.logger.log(`Bắt đầu crawl: ${link}`);

    // Hàm cập nhật với retry
    const updateWithRetry = async (id: string, data: any, maxRetries = 5) => {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          return await prisma.taskCrawls.update({
            where: { id },
            data,
          });
        } catch (error) {
          if (error.message.includes('write conflict') || error.message.includes('deadlock')) {
            retries++;
            this.logger.warn(`Xung đột khi cập nhật task ${id}, thử lại lần ${retries}`);
            // Chờ một khoảng thời gian ngẫu nhiên trước khi thử lại
            await new Promise((resolve) => setTimeout(resolve, 100 * Math.random() * retries));
          } else {
            throw error; // Lỗi khác, ném ra ngoài
          }
        }
      }
      throw new Error(`Không thể cập nhật task ${id} sau ${maxRetries} lần thử`);
    };

    try {
      // Cập nhật trạng thái thành PROCESSING với retry
      await updateWithRetry(taskId, { status: 'PROCESSING' });

      // Thực hiện crawl trang
      const result = await this.crawlPage(link);

      // Cập nhật kết quả với retry
      await updateWithRetry(taskId, {
        status: 'COMPLETED',
        result: JSON.stringify(result),
      });

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Lỗi khi crawl ${link}: ${error.message}`);

      try {
        // Cập nhật lỗi với retry
        await updateWithRetry(taskId, {
          status: 'FAILED',
          error: error.message,
        });
      } catch (updateError) {
        this.logger.error(`Không thể cập nhật trạng thái lỗi cho task ${taskId}: ${updateError.message}`);
      }

      return { success: false, error: error.message };
    }
  }

  // Phương thức crawl thực tế (thay bằng code crawl của bạn)
  private async crawlPage(link: string) {
    return this.crawlSongInPage(link);
  }

  private async crawlSongInPage(link) {
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
      // const testSong = [songs[0], songs[1]];
      const songChunks = this.chunkArray(songs, chunkSize);

      for (const chunk of songChunks) {
        const promises = chunk.map((song) => this.getDetailSong(song.href));
        const chunkResults = await Promise.all(promises);
        const formattedSongs = chunkResults
          .filter((song) => song)
          .map((song) => ({
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

      console.log(`Đã xử lý ${dataInsert.length}/${songs.length} bài hát`);

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
