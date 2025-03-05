import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import * as puppeteer from 'puppeteer';

const prisma = new PrismaClient();

@Injectable()
export class CrawlService {
  constructor() {}

  async crwalType() {
    this.crawlSongs();
    return 1;
  }

  async crawlSongs() {
    console.log('Bắt đầu crawl...');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.goto('https://www.nhaccuatui.com/bai-hat/bai-hat-moi.html', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Định nghĩa kiểu dữ liệu cho links
      type LinkItem = {
        href: string | null;
        title: string | undefined;
        slug?: string;
        pageNumber?: number;
      };

      const links = await page.evaluate(() => {
        const menuElement = document.querySelector('.detail_menu_browsing_dashboard');
        if (!menuElement) {
          return [];
        }

        const liWithoutClass = Array.from(menuElement.querySelectorAll('li')).filter((li) => !li.hasAttribute('class'));

        return liWithoutClass.map((li, index) => {
          const aTag = li.querySelector('a');
          const href = aTag ? aTag.href : null;
          let slug = '';

          if (href) {
            // Trích xuất slug từ URL
            const urlParts = href.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            // Loại bỏ phần .html để lấy slug
            slug = lastPart.replace('.html', '');
          }

          return {
            href: href,
            title: aTag ? aTag.textContent?.trim() : li.textContent?.trim(),
            slug: slug,
          };
        });
      });

      if (!Array.isArray(links) || links.length === 0) {
        console.log('No links found');
        return [];
      }

      // Định nghĩa mảng kết quả
      const results: Array<LinkItem> = [];

      for (const link of links) {
        if (link?.href) {
          try {
            const infoUrl = await this.getInfoType(browser, link.href);
            let pageNumber = 0;
            if (infoUrl) {
              // Sử dụng regex để trích xuất số trang từ URL
              const match = /\.(\d+)\.html$/.exec(infoUrl);
              if (match && match[1]) {
                pageNumber = parseInt(match[1], 10);
              }
            }
            results.push({ ...link, pageNumber: pageNumber });
            console.log(`Đã xử lý: ${link.title}`);
          } catch (error) {
            console.error(`Lỗi khi xử lý ${link.title}: ${error.message}`);
          }
        }
      }
      // Lọc bỏ các mục có href là null trước khi chèn vào cơ sở dữ liệu
      const validResults = results.filter((item) => item.href !== null) as Array<{
        href: string;
        title?: string;
        slug: string;
        pageNumber: number;
      }>;

      if (validResults.length > 0) {
        await this.insertOrUpdatePages(validResults);
      }

      return results;
    } catch (error) {
      console.error('Lỗi trong crawlSongs:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async insertOrUpdatePages(
    pages: Array<{
      href: string;
      title?: string;
      slug: string;
      pageNumber: number;
    }>,
  ) {
    try {
      console.log('Bắt đầu quá trình chèn/cập nhật...');

      // Sử dụng Promise.all để xử lý đồng thời tất cả các thao tác upsert
      const results = await Promise.all(
        pages.map(async (page) => {
          const existingRecord = await prisma.pages.findUnique({
            where: { href: page.href },
          });

          // Sử dụng thao tác upsert của Prisma - nó sẽ cập nhật nếu tồn tại hoặc tạo mới nếu chưa có
          const result = await prisma.pages.upsert({
            where: {
              href: page.href, // Sử dụng href làm định danh duy nhất
            },
            update: {
              pageNumber: page.pageNumber, // Cập nhật pageNumber nếu bản ghi tồn tại
              title: page.title,
              slug: page.slug,
            },
            create: {
              href: page.href,
              title: page.title || '',
              slug: page.slug,
              pageNumber: page.pageNumber,
            },
          });
          return {
            ...result,
            oldPageNumber: existingRecord?.pageNumber || 0,
            newPageNumber: page.pageNumber,
          };
        }),
      );

      return this.insertTaskCrawl(results);
    } catch (error) {
      console.error('Lỗi khi chèn/cập nhật trang:', error);
      throw error;
    }
  }

  private async getInfoType(browser, link: string) {
    const page = await browser.newPage();

    try {
      // Thêm xử lý lỗi và tăng thời gian chờ
      await page.goto(link, {
        waitUntil: 'domcontentloaded',
        timeout: 60000, // Tăng thời gian chờ lên 60 giây
      });

      const info = await page.evaluate(() => {
        const menuElement = document.querySelector('.box_pageview');
        if (!menuElement) {
          return null;
        }

        const links = Array.from(menuElement.querySelectorAll('a'));
        return links.length > 0 ? links[links.length - 1].href : null;
      });

      return info || 'No info found';
    } catch (error) {
      console.error(`Lỗi điều hướng cho ${link}: ${error.message}`);
      throw error;
    } finally {
      // Đóng trang nhưng không đóng trình duyệt
      await page.close();
    }
  }

  private async insertTaskCrawl(pages) {
    const newData = pages.filter((page) => page.newPageNumber > page.oldPageNumber);

    // Nếu không có dữ liệu mới, không cần thực hiện thêm xử lý
    if (newData.length === 0) {
      console.log('Không có task crawl mới để tạo');
      return [];
    }

    // Thu thập tất cả các pageId cần kiểm tra
    const pageIds = newData.map((page) => page.id);

    // Lấy danh sách các link đã tồn tại trong cơ sở dữ liệu cho các pageId này
    const existingTasks = await prisma.taskCrawls.findMany({
      where: {
        pageId: {
          in: pageIds,
        },
      },
      select: {
        link: true,
      },
    });

    // Tạo Set các link đã tồn tại để tìm kiếm nhanh
    const existingLinks = new Set(existingTasks.map((task) => task.link));

    // Sử dụng kiểu dữ liệu từ Prisma
    const tasksToCreate: Prisma.taskCrawlsCreateManyInput[] = [];

    newData.forEach((page) => {
      for (let i = page.oldPageNumber + 1; i <= page.newPageNumber; i++) {
        const link =
          i === 1
            ? `https://www.nhaccuatui.com/bai-hat/${page.slug}.html`
            : `https://www.nhaccuatui.com/bai-hat/${page.slug}.${i}.html`;

        // Kiểm tra xem link đã tồn tại chưa
        if (!existingLinks.has(link)) {
          tasksToCreate.push({
            pageId: page.id,
            link: link,
            status: 'PENDING',
          });
        }
      }
    });

    if (tasksToCreate.length > 0) {
      await prisma.taskCrawls.createMany({
        data: tasksToCreate,
      });

      console.log(`Đã tạo ${tasksToCreate.length} task crawl mới`);
    } else {
      console.log('Tất cả các link đã tồn tại, không cần tạo thêm task mới');
    }

    return tasksToCreate;
  }
}
