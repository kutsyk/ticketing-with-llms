// web/src/app/shared/pipes/date-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateFormat',
})
export class DateFormatPipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  /**
   * Formats a date into a readable format using Angular's DatePipe.
   * @param value The date to format (string, Date, or number)
   * @param format Format string, defaults to 'medium'
   * @param timezone Optional timezone (e.g., 'UTC', 'Europe/London')
   */
  transform(
    value: Date | string | number,
    format: string = 'medium',
    timezone?: string
  ): string | null {
    if (!value) return '';
    return this.datePipe.transform(value, format, timezone);
  }
}
