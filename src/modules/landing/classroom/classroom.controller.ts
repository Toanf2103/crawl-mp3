import { Public } from '@/modules/guards/public.guard';
import { Controller, Get, Param } from '@nestjs/common';
import { ClassroomService } from './classroom.service';

@Public()
@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get(':slug')
  async getArticleDetail(@Param('slug') slug: string) {
    return await this.classroomService.getClassroomDetail(slug);
  }
}
