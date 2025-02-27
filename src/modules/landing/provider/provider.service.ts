import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProviderService {
  constructor() {}
  async getBestProviders() {
    const bestProviders = await prisma.providers.findMany({
      take: 7,
      orderBy: {
        id: 'asc',
      },
    });
    return bestProviders;
  }
}
