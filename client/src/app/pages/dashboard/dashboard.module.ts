import { NgModule } from '@angular/core';

import { NgxEchartsModule } from 'ngx-echarts';
import { AngularMultiSelectModule } from 'angular2-multiselect-checkbox-dropdown/angular2-multiselect-dropdown';

import { ThemeModule } from '../../@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { TrashPieComponent } from './pie-chart/trash-pie.component';
import { TrashLineComponent } from './line-chart/trash-line.component';
import {LineChartComponent} from './line-chart/line-chart.component';


@NgModule({
  imports: [
    ThemeModule,
    NgxEchartsModule,
    AngularMultiSelectModule,
  ],
  declarations: [
    DashboardComponent,
    PieChartComponent,
    TrashPieComponent,
    TrashLineComponent,
    LineChartComponent,
    TrashLineComponent,
  ],
})
export class DashboardModule { }
