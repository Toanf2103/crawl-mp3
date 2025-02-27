import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class InstitutionService {
  constructor() {}
  async getBestInstitutions() {
    const bestInstitutions = await prisma.institutions.findMany({
      take: 7,
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        slug: true,
        imageAlt: true,
      },
    });
    return bestInstitutions;
  }
}
