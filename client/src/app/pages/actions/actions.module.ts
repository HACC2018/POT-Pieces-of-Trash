import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { ActionsComponent } from './actions.component';
import { NbListModule } from '@nebular/theme';


@NgModule({
  imports: [
    ThemeModule,
    NbListModule,
  ],
  declarations: [
    ActionsComponent
  ],
})
export class ActionsModule { }