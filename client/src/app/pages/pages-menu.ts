import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'nb-home',
    link: '/pages/dashboard',
    home: true,
  }, {
    title: 'Analysis',
    icon: 'fa fa-chart-bar',
    link: '/pages/results',
  }, {
    title: 'Locations',
    icon: 'nb-location',
    link: '/pages/actions',
  }, {
    title: 'Ranking',
    icon: 'nb-lightbulb',
    link: '/pages/ranking',
  }
];
