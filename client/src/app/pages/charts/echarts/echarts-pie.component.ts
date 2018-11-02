import {AfterViewInit, Component, OnDestroy, Input, OnChanges} from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import {TrashCollectionService} from '../../../@core/data/trash-collection.service';

import * as _ from 'lodash';

@Component({
  selector: 'ngx-echarts-pie',
  template: `
    <div echarts [options]="options" class="echart"></div>
  `,
})
export class EchartsPieComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() legendData: string[];
  @Input() chartData: any[];

  options: any = {};
  themeSubscription: any;

  // Pie chart data
  data: any;

  constructor(private theme: NbThemeService) {
  }

  ngOnChanges() {
    if (this.legendData && this.chartData) {
      this.render();
    }
  }


  ngAfterViewInit() {
    this.render();
  }

  render() {
    this.themeSubscription = this.theme.getJsTheme().subscribe(config => {

      const colors = config.variables;
      const echarts: any = config.variables.echarts;

      this.options = {
        backgroundColor: echarts.bg,
        color: [colors.warningLight, colors.infoLight, colors.dangerLight, colors.successLight, colors.primaryLight],
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: this.legendData,
          textStyle: {
            color: echarts.textColor,
          },
        },
        series: [
          {
            name: 'Trash Found',
            type: 'pie',
            radius: '80%',
            center: ['50%', '50%'],
            data: this.chartData,
            itemStyle: {
              emphasis: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: echarts.itemHoverShadowColor,
              },
            },
            label: {
              normal: {
                textStyle: {
                  color: echarts.textColor,
                },
              },
            },
            labelLine: {
              normal: {
                lineStyle: {
                  color: echarts.axisLineColor,
                },
              },
            },
          },
        ],
      };
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }


}
