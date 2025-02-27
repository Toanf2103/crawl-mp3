import { Public } from '@/modules/guards/public.guard';
import { Controller, Get } from '@nestjs/common';
import { ProviderService } from './provider.service';

@Public()
@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get('best-providers')
  async getBestProviders() {
    return await this.providerService.getBestProviders();
  }
}
