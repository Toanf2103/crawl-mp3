import { Public } from '@/modules/guards/public.guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { ArticleService } from './article.service';

@Public()
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get('latest-news')
  async getLatestNews() {
    return await this.articleService.getLatestNews();
  }

  @Get('best-courses-guides')
  async getBestCoursesGuides() {
    return await this.articleService.getBestCoursesGuides();
  }

  @Get('get-by-category')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, type: Number, example: 6 })
  async getArticlesByCategory(
    @Query('category_slug') categorySlug: string,
    @Query('page') page: number = 1,
    @Query('per_page') perPage: number = 6,
  ) {
    return await this.articleService.getArticlesByCategory(categorySlug, page, perPage);
  }

  @Get(':slug')
  async getArticleDetail(@Param('slug') slug: string) {
    return await this.articleService.getArticleDetail(slug);
  }

  @Get(':slug/reviews')
  async getArticleReviews(
    @Param('slug') slug: string,
    @Query('page') page: number = 1,
    @Query('per_page') perPage: number = 6,
  ) {
    return await this.articleService.getArticleReviews(slug, page, perPage);
  }

  @Get('home-section')
  async getHomeSection() {
    return await this.articleService.getHomeSection();
  }

  @Get('course-report')
  async getCourseReport() {
    return await this.articleService.getCourseReport();
  }

  @Get('course-review')
  async getCourseReview() {
    return await this.articleService.getCourseReview();
  }

  @Get('next-course')
  async getNextCourse() {
    return await this.articleService.getNextCourse();
  }

  @Get('list-rank-courses')
  async getListRankCourses() {
    return await this.articleService.getListRankCourses();
  }
}
