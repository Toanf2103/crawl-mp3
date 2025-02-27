import { BadRequestException, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { strToDate } from './util'

import type { IListDto, IListQuery } from './dto'

export class BaseService implements OnModuleDestroy {
  protected readonly _prisma: PrismaClient
  protected readonly _transactionTimeOut = 30000
  protected readonly _tzOffset = new Date().getTimezoneOffset()

  constructor() {
    this._prisma = new PrismaClient({
      log: [{ emit: 'event', level: 'query' }]
    })
  }

  onModuleDestroy() {
    this._prisma.$disconnect()
  }

  protected withFilter(query: IListQuery, filterable: Array<any>): { AND?: Array<any> } {
    const where = {}

    if (filterable) {
      const AND: any[] = []

      filterable.forEach((k) => {
        if (query[k.name]) {
          if (k.type === 'string') {
            AND.push({ [k.name]: { contains: query[k.name] as string, mode: 'insensitive' } })
          } else if (k.type === 'boolean') {
            AND.push({ [k.name]: query[k.name] === 'true' })
          } else if (k.type === 'date') {
            const range = query[k.name] as [string, string]
            AND.push({
              [k.name]: {
                gte: strToDate(range[0], this._tzOffset, 'start', query.tz),
                lte: strToDate(range[1], this._tzOffset, 'end', query.tz)
              }
            })
          } else if (k.type === 'enumeration' && !k.ignoreBase) {
            AND.push({ [k.name]: query[k.name] })
          }
        }
      })

      where['AND'] = AND
    }
    return where
  }

  protected withLimitOffset(query: IListQuery): { take: number; skip: number } {
    const skip = (query.page - 1) * query.pageSize

    return { take: query.pageSize, skip }
  }

  protected withPagination(dataSource: Array<any>, query: IListQuery, total?: number): IListDto {
    return { dataSource, pagination: { page: query.page, pageSize: query.pageSize, total: total || dataSource.length } }
  }

  protected withBadRequest(message: any) {
    throw new BadRequestException({ message, error: 'Bad Request', statusCode: 400 })
  }
}
