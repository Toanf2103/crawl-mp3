import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'

@Injectable()
export class JWTMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}
  async use(req: FastifyRequest, _: FastifyReply['raw'], next: () => any) {
    const token = this.extractTokenFromHeader(req)
    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.LANDING_SECRET_TOKEN || 'LANDING_SECRET_TOKEN'
      })
      req['user'] = payload
    } catch (err) {
      console.log(err)
      throw new UnauthorizedException()
    }
    next?.()
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
