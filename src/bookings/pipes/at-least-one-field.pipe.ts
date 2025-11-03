import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AtLeastOneFieldPipe implements PipeTransform {
  transform(value: any) {
    if (value.start_date === undefined && value.end_date === undefined) {
      throw new BadRequestException('Either start_date or end_date must be provided');
    }
    return value;
  }
}
