import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { PagesRoutingModule } from './pages-routing.module';
import { ThemeModule } from '../@theme/theme.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActionsModule } from './actions/actions.module';
import { RankingsModule } from './rankings/rankings.module';
import { ResultsModule } from './results/results.module';

const PAGES_COMPONENTS = [
  PagesComponent,
];

@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    MiscellaneousModule,
    DashboardModule,
    ActionsModule,
    RankingsModule,
    ResultsModule,
  ],
  declarations: [
    ...PAGES_COMPONENTS,
  ],
})
export class PagesModule {
}
