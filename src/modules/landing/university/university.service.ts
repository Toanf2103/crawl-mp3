import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UniversityService {
  constructor() {}
  async getBestUniversities() {
    const bestUniversities = await prisma.universities.findMany({
      take: 14,
      orderBy: {
        id: 'asc',
      },
    });
    return bestUniversities;
  }
}
