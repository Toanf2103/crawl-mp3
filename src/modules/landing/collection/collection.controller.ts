import { Public } from '@/modules/guards/public.guard';
import { Controller, Get } from '@nestjs/common';
import { CollectionService } from './collection.service';

@Public()
@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get('best-collections')
  async getBestCollections() {
    return await this.collectionService.getBestCollections();
  }
}
