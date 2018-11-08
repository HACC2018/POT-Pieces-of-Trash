import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { ResultsComponent } from './results.component';
import { NbListModule, NbLayoutModule } from '@nebular/theme';

@NgModule({
  imports: [
    ThemeModule,
    NbListModule,
    NbLayoutModule,
  ],
  declarations: [
    ResultsComponent
  ],
})
export class ResultsModule { }