import {Component, OnInit, ViewChild, AfterViewChecked, Input} from '@angular/core';
import * as _ from 'lodash';
import { TrashQueryService } from '../../../@core/data/trash-query.service';
import { UIUtilService } from '../../../@core/data/ui-uti.servicel';

@Component({
  selector: 'ngx-line-chart',
  templateUrl: './line-chart.component.html',
})
export class LineChartComponent implements OnInit {

  @Input() trashTypes: string[];

  dates = [];
  compareOptions = ['location', 'type'];

  prevValues = {
    start: null,
    end: null,
  };

  currSeriesData: any;
  formattedSeriesData: any;
  timeData: any[];

  @ViewChild('selectedStartDate') selectedStartDate;
  @ViewChild('selectedEndDate') selectedEndDate;
  @ViewChild('compareBy') compareBy;

  constructor(private trashSvc: TrashQueryService,
              private uiutil: UIUtilService) {
  }

  ngOnInit() {
    this.trashSvc.getTimeOptions()
      .subscribe(times => {
        this.dates = times;
      })

  }

  getData() {
    this.trashSvc.getTimeseriesData(this.selectedStartDate.nativeElement.value,
      this.selectedEndDate.nativeElement.value)
      .subscribe(data => {
        console.log(data);
        this.timeData = data.x;
        this.currSeriesData = data.y;
        this.formatData();
      });
  }


  changeCompare() {
    const start = this.selectedStartDate.nativeElement.value;
    const end = this.selectedEndDate.nativeElement.value;
    if (start && end) {
      // If any of the time values have been changed, make a new request
      if (start !== this.prevValues.start ||
        end !== this.prevValues.end) {
        this.getData();

        // Set previous values to current values
        this.prevValues.start = start;
        this.prevValues.end = end;
      } else {
        this.formatData();

      }
    }
  }

  formatData() {
    const seriesData = [];
    switch (this.compareBy.value) {
      case 'location':
        break;
      case 'type':
        break;
    }
    _.forEach(this.currSeriesData, (dataPoint) => {
      seriesData.push(this.formatChartData(dataPoint));
    });
    this.formattedSeriesData = seriesData;
  }

  setBound(isUpper: boolean): void {
    if (isUpper) {

    } else {

    }
  }

  epochTimeToDate(epoch): string {
    const date = new Date(epoch * 1000);
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }

  formatChartData(dataPoint) {
    return {
      name: dataPoint.waste,
      type: 'line',
      data: dataPoint.data,
    }
  }

}
