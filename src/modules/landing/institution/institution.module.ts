import { Module } from '@nestjs/common';
import { InstitutionController } from './institution.controller';
import { InstitutionService } from './institution.service';

@Module({
  imports: [],
  controllers: [InstitutionController],
  providers: [InstitutionService],
})
export class InstitutionModule {}
