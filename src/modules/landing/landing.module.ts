import { Module } from '@nestjs/common';
import { CrawlModule } from './crawl/crawl.module';

@Module({
  imports: [
    // CourseModule,
    // InstitutionModule,
    // ProviderModule,
    // UniversityModule,
    // ArticleModule,
    // SubjectModule,
    // HomeModule,
    // ClassroomModule,
    CrawlModule,
  ],
})
export class LandingModule {}
