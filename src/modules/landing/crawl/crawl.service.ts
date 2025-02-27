import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.nhaccuatui.com/bai-hat/bai-hat-moi.html', {
      waitUntil: 'domcontentloaded',
    });

    // Add this to see what's happening in the browser console
    page.on('console', (msg) => console.log('Browser console:', msg.text()));

    const links = await page.evaluate(() => {
      // Log something simpler that can be serialized
      const menuElement = document.querySelector('.detail_menu_browsing_dashboard');
      if (!menuElement) {
        return 'Menu container not found';
      }
      const liWithoutClass = Array.from(menuElement.querySelectorAll('li')).filter((li) => !li.hasAttribute('class'));

      const links = liWithoutClass.map((li, index) => {
        const aTag = li.querySelector('a');
        return {
          index: index + 1,
          href: aTag ? aTag.href : null,
          text: aTag ? aTag.textContent?.trim() : li.textContent?.trim(),
        };
      });
      return links;
    });

    console.log(links);
    await browser.close();
    return links;
  }

  private insertType(links) {
    console.log('Inserting types...', links);
  }
}
