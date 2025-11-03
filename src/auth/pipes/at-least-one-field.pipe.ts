import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AtLeastOneFieldPipe implements PipeTransform {
  transform(value: any) {
    if (!value.phone && !value.email) {
      throw new BadRequestException('Either phone or email must be provided');
    }
    return value;
  }
}