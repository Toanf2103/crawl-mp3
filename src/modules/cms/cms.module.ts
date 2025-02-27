import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { CMSAuthGuard } from '../guards/cms.guard'

@Module({
  imports: [],
  providers: [{ provide: APP_GUARD, useClass: CMSAuthGuard }]
})
export class CmsModule {}
