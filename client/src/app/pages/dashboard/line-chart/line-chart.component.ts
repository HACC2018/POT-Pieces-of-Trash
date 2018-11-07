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

  wasteDropdownList = [];
  selectedWastes = [];
  dropdownSettings = {};

  locationDropdownList = [];
  selectedLocations = [];

  constructor(private trashSvc: TrashQueryService,
    private uiutil: UIUtilService) {
  }

  ngOnInit() {
    this.trashSvc.getTimeOptions()
      .subscribe(times => {
        this.dates = times;
      });

    this.wasteDropdownList = [];
    this.selectedWastes = [];
    
    this.locationDropdownList = [];
    this.selectedLocations = [];

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
  }
  
  getSelectedLocations() {
    let locations = [];
    if (this.selectedLocations.length == this.locationDropdownList.length) {
      locations.push('all');
    } else {
      locations = _.map(this.selectedLocations, (locationItem) => locationItem['item_text']);
    }
    return locations;
  }

  getSelectedWastes() {
    let wastes = [];
    if (this.selectedWastes.length == this.wasteDropdownList.length) {
      wastes.push('all');
    } else {
      wastes = _.map(this.selectedWastes, (wasteItem) => wasteItem['item_text']);
    }

    return wastes;
  }

  onFilterChanged() {
    this.updateGraph(this.getSelectedLocations(), this.getSelectedWastes());
  }

  onWasteSelectAll() {
    const location = this.getSelectedLocations();
    const waste = 'all';
    
    this.updateGraph(location, waste);
  }

  onWasteDeSelectAll() {
    const location = this.getSelectedLocations();
    const waste = [];

    this.updateGraph(location, waste);
  }

  onLocationSelectAll() {
    const location = 'all';
    const waste = this.getSelectedWastes();
    
    this.updateGraph(location, waste);
  }

  onLocationDeSelectAll() {
    const location = [];
    const waste = this.getSelectedWastes();

    this.updateGraph(location, waste);
  }

  updateGraph(locations, wastes) {
    const start = this.selectedStartDate.nativeElement.value;
    const end = this.selectedEndDate.nativeElement.value;
    
    this.trashSvc.filterTimeSeriesData(start, end, locations, wastes).subscribe(
      data => {
        this.timeData = _.map(data.x, (x) => this.epochTimeToDate(x));
        this.currSeriesData = data.y;
        this.formatData();
      }
    )

    this.prevValues.start = start;
    this.prevValues.end = end;
  }

  getData() {
    this.trashSvc.getTimeseriesData(this.selectedStartDate.nativeElement.value, this.selectedEndDate.nativeElement.value)
      .subscribe(data => {
        this.timeData = _.map(data.x, (x) => this.epochTimeToDate(x));
        this.currSeriesData = data.y;
        this.wasteDropdownList = [];
        _.forEach(data['avail-wastes'], (waste, index) => {
          this.wasteDropdownList.push({
            item_id: index, item_text: waste
          });
        });

        this.locationDropdownList = [];
        _.forEach(data['avail-locations'], (location, index) => {
          this.locationDropdownList.push({
            item_id: index, item_text: location
          });
        });

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
    this.formattedSeriesData = this.filterData(this.currSeriesData);
  }

  formatLabel(label) {
    return _.capitalize(label)
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
