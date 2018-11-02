import {Component, OnInit} from '@angular/core';

import { MENU_ITEMS } from './pages-menu';
import {NbThemeService} from '@nebular/theme';

@Component({
  selector: 'ngx-pages',
  template: `
    <ngx-sample-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-sample-layout>
  `,
})
export class PagesComponent implements OnInit {

  menu = MENU_ITEMS;

  constructor(private themeService: NbThemeService) {}

  ngOnInit(): void {
    this.themeService.changeTheme('default');
  }
}
