import { CanActivate, ExecutionContext, Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { PrismaClient } from '@prisma/client'
import { FastifyRequest } from 'fastify'
import { CurrentUser } from '../base/dto'
import { IS_PUBLIC_KEY } from './public.guard'

@Injectable()
export class CMSAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as FastifyRequest

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic || request.routerPath.includes('landing')) return true

    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.SECRET_TOKEN || 'SECRET_TOKEN'
      })
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload
    } catch {
      throw new UnauthorizedException()
    }
    return true
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}

interface IPermissions {
  key: string
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

@Injectable()
export class CMSRoleGuard implements CanActivate, OnModuleDestroy {
  private readonly _prisma: PrismaClient
  private readonly _rolePermissionsMap = new Map<string, IPermissions[]>()
  constructor() {
    this._prisma = new PrismaClient()
  }

  onModuleDestroy() {
    this._prisma?.$disconnect()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as FastifyRequest
    const { roles } = request['user'] as CurrentUser
    if (roles.length === 0) return false

    const isSuperAdmin = roles.includes('super-admin')

    if (isSuperAdmin) return true

    return false
  }
}
