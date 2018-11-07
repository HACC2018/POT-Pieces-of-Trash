import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { NbListModule } from '@nebular/theme';
import { RankingsComponent } from './rankings.component';


@NgModule({
  imports: [
    ThemeModule,
  ],
  declarations: [
    RankingsComponent
  ],
})
export class RankingsModule { }