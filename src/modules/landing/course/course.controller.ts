import { Public } from '@/modules/guards/public.guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { FilterCourses } from './dto/request/filterCourses.request';

@Public()
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
  @Get()
  async getCourse() {
    return await this.courseService.getCourses();
  }

  @Get('filters-courses')
  async findCourse(@Query() filterCoursesDto: FilterCourses) {
    return await this.courseService.findCourse(filterCoursesDto);
  }

  @Get(':slug')
  async getCourseDetail(@Param('slug') slug: string) {
    return await this.courseService.getCourseDetail(slug);
  }

  @Get('popular-courses')
  async getPopularCourses() {
    return await this.courseService.getPopularCourses();
  }

  @Get('best-course-ranking')
  async getBestCourseRanking() {
    return await this.courseService.getBestCourseRanking();
  }

  @Get(':courseId/reviews')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, type: Number, example: 10 })
  async getCourseReviews(
    @Param('courseId') courseId: string,
    @Query('page') page: number = 1,
    @Query('per_page') perPage: number = 10,
  ) {
    return await this.courseService.getCourseReviews(courseId, page, perPage);
  }

  @Get('search-recommend')
  @ApiQuery({ name: 'q', required: false, type: String, example: 'search key' })
  async getSearchRecommend(@Query('q') searchKey: string) {
    return await this.courseService.getSearchRecommend(searchKey);
  }
}
