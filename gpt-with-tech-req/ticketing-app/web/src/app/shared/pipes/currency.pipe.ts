// web/src/app/shared/pipes/currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'currencyFormat',
})
export class CurrencyFormatPipe implements PipeTransform {
  constructor(private currencyPipe: CurrencyPipe) {}

  /**
   * Formats a number into currency string.
   * @param value The number to format
   * @param currency ISO currency code (default: 'USD')
   * @param symbolDisplay Whether to display the currency symbol (default: true)
   * @param digitsInfo Number formatting info (default: '1.2-2')
   * @param locale Locale for formatting (default: 'en-US')
   */
  transform(
    value: number | string,
    currency: string = 'USD',
    symbolDisplay: boolean = true,
    digitsInfo: string = '1.2-2',
    locale: string = 'en-US'
  ): string | null {
    if (value === null || value === undefined || value === '') return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return this.currencyPipe.transform(
      numericValue,
      currency,
      symbolDisplay ? 'symbol' : 'code',
      digitsInfo,
      locale
    );
  }
}
