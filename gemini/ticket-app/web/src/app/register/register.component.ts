import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `
    <div class="register-container">
      <h2>Registration</h2>
      <p>Registration form goes here.</p>
    </div>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {}