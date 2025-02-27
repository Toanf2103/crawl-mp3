import { IListQuery } from '@/modules/base/dto';
import { BaseService } from '@/modules/base/service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ArticleService extends BaseService {
  constructor() {
    super();
  }
  async getLatestNews() {
    const lastestNews = (
      await prisma.articles.findMany({
        take: 9,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          title: true,
          image: true,
          slug: true,
          author: true,
          createdAt: true,
        },
      })
    ).map((article) => ({
      id: article.id,
      title: article.title,
      author: article.author.name,
      authorHref: article.author.slug,
      image: article.image,
      articleHref: article.slug,
      date: article.createdAt,
    }));

    return lastestNews;
  }

  async getBestCoursesGuides() {
    const bestCoursesGuides = (
      await prisma.articles.findMany({
        take: 9,
        orderBy: {
          id: 'asc',
        },
        where: {
          title: {
            contains: 'best',
            mode: 'insensitive',
          },
          author: {
            is: {
              name: {
                not: null,
              },
            },
          },
        },
        select: {
          id: true,
          title: true,
          image: true,
          slug: true,
          author: true,
          createdAt: true,
        },
      })
    ).map((article) => ({
      id: article.id,
      title: article.title,
      author: article.author.name,
      authorHref: article.author.slug,
      image: article.image,
      articleHref: article.slug,
      date: article.createdAt,
    }));

    return bestCoursesGuides;
  }

  async getArticlesByCategory(categorySlug: string, page: number, perPage: number) {
    const conditions = {};
    const skip = (page - 1) * perPage;
    const articles = await prisma.articles.findMany({
      where: conditions,
      select: {
        id: true,
        slug: true,
        subCategories: true,
        image: true,
        title: true,
        describe: true,
        author: {
          select: {
            avatar: true,
            slug: true,
            name: true,
            createdAt: true,
          },
        },
      },
      skip: skip,
      take: perPage * 1,
    });
    const totalArticle = await prisma.courses.count({
      where: conditions,
    });

    const query: IListQuery = {
      page,
      pageSize: perPage,
    };
    return this.withPagination(articles, query, totalArticle);
  }

  async getArticleDetail(slug: string) {
    const article = await prisma.articles.findFirst({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        image: true,
        content: true,
        describe: true,
        author: true,
        tags: true,
        subCategories: true,
      },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async getHomeSection() {
    const fieldSelect = {
      id: true,
      slug: true,
      title: true,
      image: true,
      describe: true,
      author: {
        select: {
          name: true,
          avatar: true,
          slug: true,
        },
      },
    };

    const newAnalysisArticles = await prisma.articles.findMany({
      take: 2,
      orderBy: {
        id: 'asc',
      },
      select: fieldSelect,
    });

    const mainArticles = await prisma.articles.findMany({
      take: 4,
      orderBy: {
        id: 'desc',
      },
      select: fieldSelect,
    });

    const bestCourseArticles = await prisma.articles.findMany({
      where: {
        id: {
          not: {
            in: [...newAnalysisArticles.map((article) => article.id), ...mainArticles.map((article) => article.id)],
          },
        },
      },
      select: fieldSelect,
      take: 4,
    });

    const data = [
      {
        title: 'News & Analysis',
        articles: newAnalysisArticles,
        categorySlug: 'news',
      },
      {
        title: '',
        articles: mainArticles,
      },
      {
        title: 'Best Courses',
        articles: bestCourseArticles,
        categorySlug: 'best-courses',
      },
    ];
    return data;
  }

  async getCourseReport() {
    const corurseReportArticles = await prisma.articles.findMany({
      take: 6,
      orderBy: {
        describe: 'desc',
      },
      select: {
        title: true,
        slug: true,
        image: true,
        describe: true,
        author: {
          select: {
            name: true,
            avatar: true,
            slug: true,
          },
        },
      },
    });

    const data = [
      {
        title: 'Course Report',
        articles: corurseReportArticles.slice(0, 3),
      },
      {
        title: '',
        articles: corurseReportArticles.slice(3),
        categorySlug: 'mooc-course-report',
      },
    ];
    return data;
  }

  async getCourseReview() {
    const courseReviewArticles = await prisma.articles.findMany({
      take: 6,
      orderBy: {
        slug: 'asc',
      },
      select: {
        id: true,
        slug: true,
        title: true,
        image: true,
        describe: true,
      },
    });
    const data = {
      title: '',
      articles: courseReviewArticles,
      categorySlug: 'course-review',
    };
    return data;
  }

  getNextCourse() {
    const data = [
      {
        title: 'Find Your Next Course',
        subjects: [
          {
            name: 'Computer Science',
            image: 'https://www.classcentral.com/report/wp-content/themes/wp-theme/dist/images/subjects/cs.svg',
            quantityCourse: 20778,
            slug: '/subjects/computer-science',
            relatedSubject: [
              {
                name: 'Artificial Intelligence',
                slug: '/subjects/artificial-intelligence',
              },
              {
                name: 'subject 2',
                slug: '/subjects/subject 3',
              },
            ],
          },
          {
            name: 'Business',
            image: 'https://www.classcentral.com/report/wp-content/themes/wp-theme/dist/images/subjects/business.svg',
            quantityCourse: 20778,
            slug: '/subjects/computer-science',
            relatedSubject: [
              {
                name: 'Artificial Intelligence',
                slug: '/subjects/artificial-intelligence',
              },
              {
                name: 'subject 2',
                slug: '/subjects/subject 3',
              },
            ],
          },
          {
            name: 'Humanities',
            image: 'https://www.classcentral.com/report/wp-content/themes/wp-theme/dist/images/subjects/humanities.svg',
            quantityCourse: 20778,
            slug: '/subjects/computer-science',
            relatedSubject: [
              {
                name: 'Artificial Intelligence',
                slug: '/subjects/artificial-intelligence',
              },
              {
                name: 'subject 2',
                slug: '/subjects/subject 3',
              },
            ],
          },
          {
            name: 'Data Science',
            image:
              'https://www.classcentral.com/report/wp-content/themes/wp-theme/dist/images/subjects/data-science.svg',
            quantityCourse: 20778,
            slug: '/subjects/computer-science',
            relatedSubject: [
              {
                name: 'Artificial Intelligence',
                slug: '/subjects/artificial-intelligence',
              },
              {
                name: 'subject 2',
                slug: '/subjects/subject 3',
              },
            ],
          },
          {
            name: 'Personal Development',
            image:
              'https://www.classcentral.com/report/wp-content/themes/wp-theme/dist/images/subjects/personal-development.svg',
            quantityCourse: 20778,
            slug: '/subjects/computer-science',
            relatedSubject: [
              {
                name: 'Artificial Intelligence',
                slug: '/subjects/artificial-intelligence',
              },
              {
                name: 'subject 2',
                slug: '/subjects/subject 3',
              },
            ],
          },
          {
            name: 'Art & Design',
            image:
              'https://www.classcentral.com/report/wp-content/themes/wp-theme/dist/images/subjects/art-and-design.svg',
            quantityCourse: 20778,
            slug: '/subjects/computer-science',
            relatedSubject: [
              {
                name: 'Artificial Intelligence',
                slug: '/subjects/artificial-intelligence',
              },
              {
                name: 'subject 2',
                slug: '/subjects/subject 3',
              },
            ],
          },
        ],
      },
    ];
    return data;
  }

  async getListRankCourses() {
    const quantityCourse = 7;
    const fieldSelect = {
      id: true,
      title: true,
      slug: true,
      original: {
        select: {
          name: true,
          logo: true,
        },
      },
      duration: true,
      ratings: true,
      review: true,
      via: {
        select: {
          name: true,
          slug: true,
        },
      },
    };
    const bestAllTimeCourses = await prisma.courses.findMany({
      take: quantityCourse,
      orderBy: [
        {
          other: {
            cc_source_id: 'desc',
          },
        },
        { ratings: 'desc' },
      ],
      select: fieldSelect,
    });

    const bestOnlineCourses = await prisma.courses.findMany({
      take: quantityCourse,
      orderBy: [{ review: 'desc' }, { ratings: 'desc' }],
      select: fieldSelect,
    });

    const popularCourses = await prisma.courses.findMany({
      take: quantityCourse,
      orderBy: [{ id: 'desc' }, { ratings: 'desc' }],
      select: fieldSelect,
    });

    const data = [
      {
        title: 'The Best Free Online Courses of All Time',
        slug: '/reports/the-best-free-online',
        courses: bestAllTimeCourses,
      },
      {
        title: "Class Central's Best Online Courses of the Year (2022 Edition)",
        slug: '/reports/the-best-free-year-2022',
        courses: bestOnlineCourses,
      },
      {
        title: 'The Most Popular Courses of the Year (2024 Edition)',
        slug: '/reports/most-best-free-year-2022',
        courses: popularCourses,
      },
    ];
    return data;
  }

  async getArticleReviews(slug: string, page: number, perPage: number) {
    const reviews = [
      {
        id: 1,
        user: {
          name: 'toanf',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvV-4PbsfOYy0Vt7TbrzblA8F9YbHXiRHE8w&s',
        },
        content: 'Content reviewed',
        createdAt: '2024-05-27T07:52:27+00:00',
      },
      {
        id: 2,
        user: {
          name: 'john_doe',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0Fgk5IvXtWykXhRtiA0GNHG2uJLsLuhLB9Q&s',
        },
        content: 'Great product!',
        createdAt: '2024-05-28T08:30:00+00:00',
      },
      {
        id: 3,
        user: {
          name: 'jane_smith',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXs2HJ-A03VZ2uHXlftV3ZH1uQWy6rMZdC5Q&s',
        },
        content: 'Not bad',
        createdAt: '2024-05-29T09:00:00+00:00',
      },
      {
        id: 4,
        user: {
          name: 'mike_jones',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3JrVZ9LF_vRAUsZc6X7fW58TZfbz7TTWjOQ&s',
        },
        content: 'Could be better',
        createdAt: '2024-05-30T10:15:00+00:00',
      },
      {
        id: 5,
        user: {
          name: 'lisa_white',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJfM9ffM4Bvc3ZHxsBZ8fVdQ3X7otItNLEmQ&s',
        },
        content: 'Amazing!',
        createdAt: '2024-05-31T11:20:00+00:00',
      },
      {
        id: 6,
        user: {
          name: 'peter_parker',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Dd9_rS2R80mLwXZgPOQzFr1m6L7mrVkdNw&s',
        },
        content: 'Pretty good',
        createdAt: '2024-06-01T12:45:00+00:00',
      },
      {
        id: 7,
        user: {
          name: 'bruce_wayne',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEUvMg-fg3TZ5Pn7wEb5UQyJ5kLxQHHiFf0A&s',
        },
        content: 'Okay',
        createdAt: '2024-06-02T14:00:00+00:00',
      },
      {
        id: 8,
        user: {
          name: 'clark_kent',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8MTjj6hL8ycbKP9NH60m-BywLgDdlEvfJKw&s',
        },
        content: 'Loved it!',
        createdAt: '2024-06-03T15:30:00+00:00',
      },
      {
        id: 9,
        user: {
          name: 'diana_prince',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHFyKz1HV5h0QbfCJ4v3JVRZh9yyISYxwPEA&s',
        },
        content: "It's alright",
        createdAt: '2024-06-04T16:45:00+00:00',
      },
      {
        id: 10,
        user: {
          name: 'barry_allen',
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5_dTDBdpHfD9AYRNRD48G93mpeMre9CM8nA&s',
        },
        content: 'Fast delivery!',
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
}
