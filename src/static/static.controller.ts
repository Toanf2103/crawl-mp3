import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { createReadStream, existsSync } from 'fs';
import { lookup } from 'mime-types';
import { join } from 'path';

@Controller('static')
export class StaticController {
  @Get('*')
  getStatic(@Param('*') param: string, @Res() res: FastifyReply) {
    const staticPath = join(process.cwd(), 'static', param);
    const exist = existsSync(staticPath);
    if (!exist) {
      throw new NotFoundException();
    }

    const mimeType = lookup(staticPath);
    const file = createReadStream(staticPath);
    res.type(mimeType.toString()).send(file);
    return;
  }
}
