import { IListQuery } from '@/modules/base/dto';
import { BaseService } from '@/modules/base/service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FilterCourses } from './dto/request/filterCourses.request';

const prisma = new PrismaClient();

@Injectable()
export class CourseService extends BaseService {
  constructor() {
    super();
  }
  async getCourses() {
    const allCourses = await prisma.courses.findMany({
      select: {
        id: true,
        category: true,
        duration: true,
        original: true,
        other: true,
        ratings: true,
        review: true,
        slug: true,
        subCategories: true,
        subCategory: true,
        subTitles: true,
        tags: true,
        taughtBy: true,
        title: true,
        trailer: true,
        via: true,
      },
    });
    return allCourses;
  }

  async getPopularCourses() {
    const popularCourses = (
      await prisma.subjects.findMany({
        take: 12,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          slug: true,
        },
      })
    ).map((course) => ({
      id: course.id,
      title: course.title,
      imageUrl: course.imageUrl,
      href: course.slug,
    }));

    return popularCourses;
  }

  async getBestCourseRanking() {
    const data = [
      {
        imageUrl:
          'https://ccweb.imgix.net/https%3A%2F%2Fwww.classcentral.com%2Fimages%2Fbest-courses%2Fmini-banner-most-popular-2024.png?auto=format&ixlib=php-4.1.0&s=9c1fa952313a4e54e13de2ae94322600',
        slug: '/report/most-popular-courses-2024',
        imageAlt: 'image demo',
      },
      {
        imageUrl:
          'https://ccweb.imgix.net/https%3A%2F%2Fwww.classcentral.com%2Fimages%2Fbest-courses%2Fmini-banner-most-popular-2024.png?auto=format&ixlib=php-4.1.0&s=9c1fa952313a4e54e13de2ae94322600',
        slug: '/collection/most-popular-courses-2024',
        imageAlt: 'image demo',
      },
    ];

    return data;
  }

  async getCourseDetail(slug: string) {
    const course = await prisma.courses.findFirst({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        ratings: true,
        review: true,
        duration: true,
        taughtBy: true,
        overview: true,
        tags: true,
        via: true,
        trailer: true,
        subCategories: true,
        original: true,
        subCategory: true,
        subTitles: true,
        other: {
          select: {
            course_level: true,
            course_provider: true,
            course_language: true,
            course_is_free: true,
            course_is_university: true,
            course_num_rating: true,
            course_avg_rating: true,
            course_institution: true,
            course_is_classroom: true,
            course_subject: true,
            course_slug: true,
          },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const coursesRelated = await prisma.courses.findMany({
      take: 8,
      where: {
        other: {
          is: {
            course_subject: course.other.course_subject,
          },
        },
      },
      select: {
        title: true,
        slug: true,
        ratings: true,
        original: {
          select: {
            logo: true,
            name: true,
          },
        },
      },
    });

    const data = {
      ...course,
      other: {
        level: course.other.course_level,
        provider: course.other.course_provider,
        language: course.other.course_language,
        isFree: course.other.course_is_free,
        isUniversity: course.other.course_is_university,
        numRating: course.other.course_num_rating,
        avgRating: course.other.course_avg_rating,
        institution: course.other.course_institution,
        isClassroom: course.other.course_is_classroom,
        subject: course.other.course_subject,
        slug: course.other.course_slug,
      },
      coursesRelated: coursesRelated,
    };

    return data;
  }

  getCourseReviews(courseId: string, page: number, perPage: number) {
    const reviews = [
      {
        id: 1,
        user: {
          name: 'toanf',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvV-4PbsfOYy0Vt7TbrzblA8F9YbHXiRHE8w&s',
        },
        content: 'Content reviewed',
        rate: 3,
        createdAt: '2024-05-27T07:52:27+00:00',
      },
      {
        id: 2,
        user: {
          name: 'john_doe',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Fgk5IvXtWykXhRtiA0GNHG2uJLsLuhLB9Q&s',
        },
        content: 'Great product!',
        rate: 5,
        createdAt: '2024-05-28T08:30:00+00:00',
      },
      {
        id: 3,
        user: {
          name: 'jane_smith',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXs2HJ-A03VZ2uHXlftV3ZH1uQWy6rMZdC5Q&s',
        },
        content: 'Not bad',
        rate: 4,
        createdAt: '2024-05-29T09:00:00+00:00',
      },
      {
        id: 4,
        user: {
          name: 'mike_jones',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3JrVZ9LF_vRAUsZc6X7fW58TZfbz7TTWjOQ&s',
        },
        content: 'Could be better',
        rate: 2,
        createdAt: '2024-05-30T10:15:00+00:00',
      },
      {
        id: 5,
        user: {
          name: 'lisa_white',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJfM9ffM4Bvc3ZHxsBZ8fVdQ3X7otItNLEmQ&s',
        },
        content: 'Amazing!',
        rate: 5,
        createdAt: '2024-05-31T11:20:00+00:00',
      },
      {
        id: 6,
        user: {
          name: 'peter_parker',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Dd9_rS2R80mLwXZgPOQzFr1m6L7mrVkdNw&s',
        },
        content: 'Pretty good',
        rate: 4,
        createdAt: '2024-06-01T12:45:00+00:00',
      },
      {
        id: 7,
        user: {
          name: 'bruce_wayne',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEUvMg-fg3TZ5Pn7wEb5UQyJ5kLxQHHiFf0A&s',
        },
        content: 'Okay',
        rate: 3,
        createdAt: '2024-06-02T14:00:00+00:00',
      },
      {
        id: 8,
        user: {
          name: 'clark_kent',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8MTjj6hL8ycbKP9NH60m-BywLgDdlEvfJKw&s',
        },
        content: 'Loved it!',
        rate: 5,
        createdAt: '2024-06-03T15:30:00+00:00',
      },
      {
        id: 9,
        user: {
          name: 'diana_prince',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHFyKz1HV5h0QbfCJ4v3JVRZh9yyISYxwPEA&s',
        },
        content: "It's alright",
        rate: 3,
        createdAt: '2024-06-04T16:45:00+00:00',
      },
      {
        id: 10,
        user: {
          name: 'barry_allen',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5_dTDBdpHfD9AYRNRD48G93mpeMre9CM8nA&s',
        },
        content: 'Fast delivery!',
        rate: 5,
        createdAt: '2024-06-05T18:00:00+00:00',
      },
    ];
    const data = reviews.slice((page - 1) * perPage, page * perPage);
    const query: IListQuery = {
      page,
      pageSize: perPage,
    };
    return this.withPagination(data, query, reviews.length);
  }

  getSearchRecommend(searchKey: string) {
    const data = {
      mostCommon: ['html', 'css', 'js'],
      recent: ['recent1', 'recent2'],
      popularSubjects: [
        {
          name: 'Programming',
          quantityCourses: 1002,
          slug: '/subjects/programming',
        },
        {
          name: 'gamming',
          quantityCourses: 1002,
          slug: '/subjects/programming',
        },
        {
          name: 'Programming',
          quantityCourses: 1002,
          slug: '/subjects/programming',
        },
      ],
      popularCourses: [
        {
          title: 'Marching learning',
          slug: '/courses/marching',
          university: 'SPKT',
        },
        {
          title: 'Course Management',
          slug: '/courses/management',
          university: 'SPKT',
        },
      ],
      articles: [
        {
          title: 'Programming',
          slug: '/article/programming',
        },
        {
          title: 'article 2',
          slug: '/article/article-2',
        },
      ],
    };
    return data;
  }

  async findCourse(rq: FilterCourses) {
    const { page = 1, perPage = 6 } = rq;
    const dataFilter = Array.from({ length: 15 }, (_, index) => ({
      id: index + 1,
      slug: `courses/${index + 1}`,
      title: `Course Detail ${index + 1}`,
      ratings: Math.floor(Math.random() * 5) + 1,
      review: Math.floor(Math.random() * 200),
      duration: '12 weeks, 6-18 hours a week',
      taughtBy: `Instructor ${index + 1}`,
      via: {
        name: 'edX',
        slug: '/provider/edx',
      },
      original: {
        name: 'The Hong Kong University of Science and Technology',
        logo: 'https://ccweb.imgix.net/https%3A%2F%2Fwww.classcentral.com%2Fimages%2Flogos%2Finstitutions%2Fhkust-hz.png?auto=format&blur=200&h=60&ixlib=php-4.1.0&px=16&s=a7f6077fde792aa891e0439ceb7bb674',
      },
      subTitles: ['Chinese', 'English', 'Arabic', 'German', 'Spanish'],
      other: {
        level: 'beginner',
        provider: 'edX',
        language: 'English',
        isFree: true,
        isUniversity: true,
        numRating: Math.floor(Math.random() * 200),
        avgRating: (Math.random() * 5).toFixed(5),
        institution: 'Harvard University',
        isClassroom: false,
        subject: 'Computer Science',
        slug: `computer-science-harvard-university-cs50-s-introd-${index + 1}`,
      },
    }));
    const data = dataFilter.slice((page - 1) * perPage, page * perPage);
    const query: IListQuery = {
      page,
      pageSize: perPage,
    };
    return this.withPagination(data, query, dataFilter.length);
  }
}
