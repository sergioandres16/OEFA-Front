import { Component } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [],
  template: `
    <ng-content></ng-content>
  `
})
export class LayoutComponent {}