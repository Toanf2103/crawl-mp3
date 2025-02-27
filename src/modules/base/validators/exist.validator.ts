import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

const prisma = new PrismaClient();

@Injectable()
@ValidatorConstraint({ async: true })
export class ExistsConstraint implements ValidatorConstraintInterface {
  constructor() {}

  async validate(value: any, args: ValidationArguments) {
    const [modelName, fieldName] = args.constraints;
    const model: any = prisma[modelName];

    if (!model) {
      throw new Error(`Model ${modelName} not found in Prisma schema.`);
    }

    const record = await model.findFirst({
      where: {
        [fieldName]: value,
      },
    });

    return !!record;
  }

  defaultMessage(args: ValidationArguments) {
    const [modelName, fieldName] = args.constraints;
    return `${fieldName} not exists ${modelName}`;
  }
}

export function Exists(modelName: string, fieldName: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [modelName, fieldName],
      validator: ExistsConstraint,
    });
  };
}
