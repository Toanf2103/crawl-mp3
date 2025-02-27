import { DURATION_COURSE_LIST_OPTIONS, IListQuery, LevelCourse } from '@/modules/base/dto';
import { BaseService } from '@/modules/base/service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FilterCourses } from './dto/request/filterCourses.request';

const prisma = new PrismaClient();

@Injectable()
export class SubjectService extends BaseService {
  constructor() {
    super();
  }

  async getSubjectDetail(slug: string) {
    const subject = await prisma.subjects.findFirst({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        imageAlt: true,
        describe: true,
        follow: true ?? 1,
        quantityCourses: true,
      },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    const relatedSubject = (
      await prisma.subjects.findMany({
        where: {
          id: {
            not: subject?.id,
          },
        },
        take: 8,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      })
    ).map((subject) => ({
      id: subject.id,
      name: subject.title,
      slug: subject.slug,
    }));

    const data = {
      ...subject,
      name: subject?.title,
      relatedSubject: relatedSubject,
    };
    return data;
  }

  async getSubjectFilter(slug: string) {
    const fullUrl = `https://www.classcentral.com/subject/${slug}`;
    const [level, languages, duration, certificate] = await Promise.all([
      this.getCourseLevelQuantities(fullUrl),
      this.getCourseLanguageBySlug(fullUrl),
      this.getCourseCountByDuration(fullUrl),
      this.getCourseCertificateByDuration(fullUrl),
    ]);

    const data = {
      level: level,
      certificate: certificate,
      duration: duration,
      languages: languages,
    };
    return data;
  }

  async getCoursesBySubject(filters: FilterCourses, slug: string) {
    const fullUrl = `https://www.classcentral.com/subject/${slug}`;
    const { page = 1, perPage = 10 } = filters;
    const levels = filters.level?.split(',') ?? [];
    const langs = filters.lang?.split(',') ?? [];
    const skip = (page - 1) * perPage;
    const conditions = {
      subCategories: {
        some: {
          slug: {
            equals: fullUrl,
          },
        },
      },
      other: {
        is: {
          ...(filters.certificate && { course_certificate: true }),
          ...(filters.free && { course_is_free: true }),
          ...(filters.university && { course_is_university: true }),
          ...(levels.length > 0 && { course_level: { in: levels } }),
          ...(langs.length > 0 && { course_language: { in: langs } }),
        },
      },
    };
    const courses = (
      await prisma.courses.findMany({
        where: conditions,
        select: {
          id: true,
          slug: true,
          title: true,
          ratings: true,
          review: true,
          duration: true,
          via: {
            select: {
              name: true,
              slug: true,
            },
          },
          describe: true,
          original: {
            select: {
              name: true,
              logo: true,
            },
          },
          trailer: {
            select: {
              img: true,
            },
          },
          other: {
            select: {
              course_level: true,
              course_provider: true,
              course_language: true,
              course_is_free: true,
              course_is_university: true,
              course_is_classroom: true,
            },
          },
        },
        skip: skip,
        take: perPage * 1,
      })
    ).map((course) => ({
      ...course,
      other: {
        level: course.other.course_level,
        provider: course.other.course_provider,
        language: course.other.course_language,
        isFree: course.other.course_is_free,
        isUniversity: course.other.course_is_university,
        isClassroom: course.other.course_is_classroom,
      },
    }));
    const totalCourses = await prisma.courses.count({
      where: conditions,
    });

    const query: IListQuery = {
      page,
      pageSize: perPage,
    };
    return this.withPagination(courses, query, totalCourses);
  }

  private async getCourseLevelQuantities(slugSubject: string) {
    const levelEntries = Object.entries(LevelCourse);
    const levelPromises = levelEntries.map(async ([key, value]) => {
      const count = await prisma.courses.count({
        where: {
          other: {
            is: {
              course_level: value,
            },
          },
          subCategories: {
            some: {
              slug: {
                equals: slugSubject,
              },
            },
          },
        },
      });

      return {
        name: key,
        value: value,
        quantity: count,
      };
    });
    const levelDetails = await Promise.all(levelPromises);
    return levelDetails;
  }

  private async getCourseLanguageBySlug(slugSubject: string) {
    const courses = await prisma.courses.findMany({
      where: {
        subCategories: {
          some: {
            slug: {
              equals: slugSubject,
            },
          },
        },
      },
      select: {
        other: {
          select: {
            course_language: true,
          },
        },
      },
    });

    const languageCount = {};

    courses.forEach((course) => {
      const language = course.other.course_language;
      languageCount[language] = (languageCount[language] || 0) + 1;
    });

    const uniqueLanguages = Object.entries(languageCount).map(([language, count]) => ({
      name: language,
      quantity: count,
      value: language,
    }));
    return uniqueLanguages;
  }

  private async getCourseCountByDuration(slugSubject: string) {
    const durationDetail = DURATION_COURSE_LIST_OPTIONS.map((duration) => ({
      name: duration.name,
      value: duration.value,
      quantity: 30,
    }));
    return durationDetail;
  }

  private async getCourseCertificateByDuration(slugSubject: string) {
    const quantityFreeCourses = await prisma.courses.count({
      where: {
        subCategories: {
          some: {
            slug: {
              equals: slugSubject,
            },
          },
        },
        other: {
          is: {
            course_is_free: true,
          },
        },
      },
    });
    const quantityCertificateCourses = await prisma.courses.count({
      where: {
        subCategories: {
          some: {
            slug: {
              equals: slugSubject,
            },
          },
        },
        other: {
          is: {
            course_certificate: true,
          },
        },
      },
    });

    const quantitUnivercityCourses = await prisma.courses.count({
      where: {
        subCategories: {
          some: {
            slug: {
              equals: slugSubject,
            },
          },
        },
        other: {
          is: {
            course_is_university: true,
          },
        },
      },
    });

    return [
      {
        name: 'With certificate',
        quantity: quantityCertificateCourses,
        value: 'certificate=true',
      },
      {
        name: 'Free course',
        quantity: quantityFreeCourses,
        value: 'free=true',
      },
      {
        name: 'University course only',
        quantity: quantitUnivercityCourses,
        value: 'university=true',
      },
    ];
  }
}
