import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CollectionService {
  constructor() {}
  getBestCollections() {
    const data = [
      {
        id: 1,
        image:
          'https://ccweb.imgix.net/https%3A%2F%2Fwww.classcentral.com%2Fimages%2Fcollections%2Fcollection-india-ugc-approved-online-degrees.png?auto=format&ixlib=php-4.1.0&w=450&s=7ec0bcf85171af841d78e1cedd02a076',
        href: '/report/india-online-degrees',
      },
      {
        id: 2,
        image:
          'https://ccweb.imgix.net/https%3A%2F%2Fwww.classcentral.com%2Fimages%2Fcollections%2Fcollection-india-ugc-approved-online-degrees.png?auto=format&ixlib=php-4.1.0&w=450&s=7ec0bcf85171af841d78e1cedd02a076',
        href: '/report/india-online-degrees',
      },
      {
        id: 3,
        image:
          'https://ccweb.imgix.net/https%3A%2F%2Fwww.classcentral.com%2Fimages%2Fcollections%2Fcollection-india-ugc-approved-online-degrees.png?auto=format&ixlib=php-4.1.0&w=450&s=7ec0bcf85171af841d78e1cedd02a076',
        href: '/report/india-online-degrees',
      },
    ];

    return data;
  }
}
