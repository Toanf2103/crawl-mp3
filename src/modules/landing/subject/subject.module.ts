import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';

@Module({
  imports: [],
  controllers: [SubjectController],
  providers: [SubjectService],
})
export class SubjectModule {}
