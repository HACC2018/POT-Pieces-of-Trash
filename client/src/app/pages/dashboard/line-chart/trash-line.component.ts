import {AfterViewInit, Component, OnDestroy, Input, OnChanges} from '@angular/core';
import { NbThemeService } from '@nebular/theme';

@Component({
  selector: 'ngx-echarts-line',
  template: `
    <div echarts [options]="options" class="echart"></div>
  `,
})
export class TrashLineComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() timeData: any[];
  @Input() seriesData: any;
  @Input() legendData: any[];

 // @ViewChild()

  options: any = {};
  themeSubscription: any;

  config: any;

  constructor(private theme: NbThemeService) {
  }

  ngOnChanges() {
    if (this.config) {
      this.renderChart();
    }
  }

  ngAfterViewInit() {
    this.themeSubscription = this.theme.getJsTheme().subscribe(config => {

      this.config = config;
      this.renderChart();
    });
  }

  renderChart() {

    const colors: any = this.config.variables;
    const echarts: any = this.config.variables.echarts;

    this.options = {
      backgroundColor: echarts.bg,
      color: [colors.danger, colors.primary, colors.info],
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c}',
      },
      legend: {
        left: 'left',
        data: this.legendData,
        textStyle: {
          color: echarts.textColor,
        },
      },
      xAxis: [
        {
          type: 'category',
          data: this.timeData,
          axisTick: {
            alignWithLabel: true,
          },
          axisLine: {
            lineStyle: {
              color: echarts.axisLineColor,
            },
          },
          axisLabel: {
            textStyle: {
              color: echarts.textColor,
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'log',
          axisLine: {
            lineStyle: {
              color: echarts.axisLineColor,
            },
          },
          splitLine: {
            lineStyle: {
              color: echarts.splitLineColor,
            },
          },
          axisLabel: {
            textStyle: {
              color: echarts.textColor,
            },
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      series: this.seriesData,
    };
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }
}
