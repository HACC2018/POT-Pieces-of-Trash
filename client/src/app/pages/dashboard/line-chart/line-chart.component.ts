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
  availLocations = [];
  availTypes = [];

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
  @ViewChild('trashTypeFilter') trashTypeFilter;
  @ViewChild('locationFilter') locationFilter;

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
    const locations = [];
    const types = [];

    // Get locations from data
    _.forEach(this.currSeriesData, (dataPoint) => {
      if (!locations.includes(dataPoint.location)) {
        locations.push(dataPoint.location);
      }
      // Get types of Trash from data
      if (!types.includes(dataPoint.waste)) {
        types.push(dataPoint.waste);
      }
    });

    this.availTypes = types;
    this.availLocations = locations;

    this.formattedSeriesData = this.filterData(this.currSeriesData);

  }


  epochTimeToDate(epoch): string {
    const date = new Date(epoch * 1000);
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }

  formatChartData(name, data) {
    return {
      name: name,
      type: 'line',
      data: data,
    };
  }

  filterData(seriesData): any[] {
    let finalData = [];
    let chartData = seriesData;
    if (this.trashTypeFilter.nativeElement.value !== 'any') {
      chartData = _.filter(chartData, (d) => {
        return d.waste === this.trashTypeFilter.nativeElement.value;
      });
    }

    if (this.locationFilter.nativeElement.value !== 'any') {
      chartData = _.filter(chartData, (d) => {
        return d.location === this.locationFilter.nativeElement.value;
      });
    }

    chartData = _.groupBy(chartData, 'waste');
    _.forEach(chartData, (dataGroup) => {

      const result = dataGroup.reduce(function (res, data) {
        (data.data).forEach(function (b, i) {
          res[i] = (res[i] || 0) + b;
        });
        return res;
      }, []);

      finalData.push(this.formatChartData(dataGroup[0].waste, result));

      console.log(finalData);

    });

    return finalData;

  }

}
