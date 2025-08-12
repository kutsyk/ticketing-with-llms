// web/src/app/shared/directives/autofocus.directive.ts
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
} from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
  /**
   * If false, autofocus will be skipped. Defaults to true.
   */
  @Input() appAutofocus = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.appAutofocus) {
      // Delay focus slightly to ensure element is fully ready
      setTimeout(() => {
        try {
          this.el.nativeElement.focus();
        } catch (err) {
          console.warn('Autofocus failed:', err);
        }
      });
    }
  }
}
