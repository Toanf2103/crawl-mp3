import { Inject } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { BaseDto } from './dto'
export class BaseController {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger

  withUpdated(body: any, req: Request) {
    const input = body as BaseDto
    this.logger.verbose(`${req.method} ${req.url} ${JSON.stringify(body)}}`)

    const now = new Date()
    if (req.method === 'POST') {
      input.createdById = req['user'].id
      input.createdAt = now
    }
    input.updatedById = req['user'].id
    input.updatedAt = now
    return body
  }
}
