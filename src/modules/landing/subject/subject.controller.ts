import { Public } from '@/modules/guards/public.guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { FilterCourses } from './dto/request/filterCourses.request';
import { SubjectService } from './subject.service';

@Public()
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get(':slug')
  async getSubjectDetail(@Param('slug') slug: string) {
    return await this.subjectService.getSubjectDetail(slug);
  }

  @Get(':slug/filters')
  async getSubjectFilter(@Param('slug') slug: string) {
    return await this.subjectService.getSubjectFilter(slug);
  }

  @Get(':slug/courses')
  async getCoursesBySubject(@Query() filters: FilterCourses, @Param('slug') slug: string) {
    return this.subjectService.getCoursesBySubject(filters, slug);
  }
}
