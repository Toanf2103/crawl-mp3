import { Public } from '@/modules/guards/public.guard';
import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Public()
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('footer')
  async getFooter() {
    return await this.homeService.getFooter();
  }

  @Get('nav-header')
  async getNavHeader() {
    return await this.homeService.getNavHeader();
  }
}
