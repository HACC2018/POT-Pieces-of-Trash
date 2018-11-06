import {AfterViewInit, Component, OnDestroy, Input, OnChanges} from '@angular/core';
import { NbThemeService } from '@nebular/theme';

@Component({
  selector: 'ngx-echarts-pie',
  template: `
    <div echarts [options]="options" class="echart"></div>
  `,
})
export class TrashPieComponent implements AfterViewInit, OnChanges, OnDestroy {

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

      const echarts: any = config.variables.echarts;
      this.options = {
        backgroundColor: echarts.bg,
        color: ['#81d4fa', '#ef9a9a', '#ce93d8', '#9fa8da', '#81c784', '#fff176', '#ffd54f', '#ff8a65', ],
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