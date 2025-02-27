import { Module } from '@nestjs/common';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';

@Module({
  imports: [],
  controllers: [ClassroomController],
  providers: [ClassroomService],
})
export class ClassroomModule {}
