import { Component, OnInit, ViewChild, Input } from '@angular/core';
import * as _ from 'lodash';
import { TrashQueryService } from '../../../@core/data/trash-query.service';
import { UIUtilService } from '../../../@core/data/ui-uti.servicel';

@Component({
  selector: 'ngx-line-chart',
  templateUrl: './line-chart.component.html',
})
export class LineChartComponent implements OnInit {

  dates: any = [];
  availLocations = [];
  availTypes = [];

  prevValues = {
    start: null,
    end: null,
  };

  currSeriesData: any;
  formattedSeriesData: any;
  timeData: any[];
  legends: string[];

  @ViewChild('selectedStartDate') selectedStartDate;
  @ViewChild('selectedEndDate') selectedEndDate;
  @ViewChild('trashTypeFilter') trashTypeFilter;
  @ViewChild('locationFilter') locationFilter;

  constructor(private trashSvc: TrashQueryService,
    private uiutil: UIUtilService) {
  }

  ngOnInit() {
    this.trashSvc.getTimeOptions()
      .subscribe(times => {
        this.dates = times;
      });
  }

  getData() {
    this.trashSvc.getTimeseriesData(this.selectedStartDate.nativeElement.value, this.selectedEndDate.nativeElement.value)
      .subscribe(data => {
        this.timeData = _.map(data.x, (x) => this.epochTimeToDate(x));
        this.currSeriesData = data.y;
        this.availLocations = data['avail-locations'];
        this.availTypes = data['avail-wastes'];
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
    console.log(this.currSeriesData);
    this.formattedSeriesData = this.filterData(this.currSeriesData);
    console.log(this.formattedSeriesData);
  }

  formatLabel(label) {
    return _.capitalize(label)
  }

  selectNewLocation() {
    const start = this.selectedStartDate.nativeElement.value;
    const end = this.selectedEndDate.nativeElement.value;
    const location = this.locationFilter.nativeElement.value;
    const waste = this.trashTypeFilter.nativeElement.value;

    this.trashSvc.filterTimeSeriesData(start, end, [location], [waste]).subscribe(
      data => {
        this.timeData = _.map(data.x, (x) => this.epochTimeToDate(x));
        this.currSeriesData = data.y;
        this.availTypes = data['avail-wastes'];
        this.formatData();
      }
    )

    this.prevValues.start = start;
    this.prevValues.end = end;
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
/*

[
  {
    "data": [
      393,
      340,
      335,
      204,
      21
    ],
    "location": "All",
    "waste": "all"
  }
]




 *[
  {
    "name": "all",
    "type": "line",
    "data": [
      393,
      340,
      335,
      204,
      21
    ]
  }
] 
 * 
 */
  filterData(seriesData): any[] {
    this.legends = [];
    const finalData = [];
    // let chartData = seriesData;
    // if (this.trashTypeFilter.nativeElement.value !== 'any') {
    //   chartData = _.filter(chartData, (d) => {
    //     return d.waste === this.trashTypeFilter.nativeElement.value;
    //   });
    // }

    // if (this.locationFilter.nativeElement.value !== 'any') {
    //   chartData = _.filter(chartData, (d) => {
    //     return d.location === this.locationFilter.nativeElement.value;
    //   });
    // }

    // chartData = _.groupBy(chartData, 'waste');
    // _.forEach(chartData, (dataGroup) => {

    //   const result = dataGroup.reduce(function (res, data) {
    //     (data.data).forEach(function (b, i) {
    //       res[i] = (res[i] || 0) + b;
    //     });
    //     return res;
    //   }, []);

    //   finalData.push(this.formatChartData(dataGroup[0].waste, result));

    // });
    _.forEach(seriesData, (series) => {
      let name = '';
      if (series.waste.toLowerCase() == 'all') {
        name += 'All wastes';
      } else {
        name += _.capitalize(series.waste);
      }

      if (series.location.toLowerCase() == 'all') {
        name += ' at every location';
      } else {
        name += ' at ' + _.capitalize(series.location);
      }
      this.legends.push(name);
      finalData.push(this.formatChartData(name, series.data));
    })    

    return finalData;

  }

}
