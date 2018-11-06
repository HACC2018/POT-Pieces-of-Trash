import {Component, OnInit, ViewChild, AfterViewChecked} from '@angular/core';
import * as _ from 'lodash';
import { TrashQueryService } from '../../../@core/data/trash-query.service';
import { UIUtilService } from '../../../@core/data/ui-uti.servicel';

@Component({
  selector: 'ngx-echarts',
  styleUrls: ['./pie-chart.component.scss'],
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent implements OnInit {

  locations: string[];
  dates: number[] = [];
  locationsByDate = {};
  trashTypes: string[];
  formattedPieChartData: any[];

  @ViewChild('selectedDate') selectedDate;
  @ViewChild('selectedLocation') selectedLocation;

  constructor(private trashSvc: TrashQueryService,
              private uiutil: UIUtilService) {
  }

   ngOnInit() {
    this.dates = [];
    this.trashSvc.getPieChartParam().subscribe(timeGroups => {
      _.forEach(timeGroups, (group) => {
        const date = group['date'];
        // Collect all dates
        this.dates.push(date);
        // Set locations lookup with date as key
        if (!this.locationsByDate[date]) {
          this.locationsByDate[date] = group['locations'];
        }
      });
    });
   }

  setAvailLocations(dateKey: any) {
    this.locations = this.locationsByDate[dateKey] || [];
  }


  locationDisplay(location: string): string {
    return _.capitalize(location);
  }

  getLocationData() {
    this.trashSvc.getTrashByLocation(this.selectedLocation.value, this.selectedDate.value)
      .subscribe(data => {
        this.formattedPieChartData = this.formatData(data);
      });
  }

  formatData(trash): any[] {
    const records = [];
    _.forEach(this.trashTypes, (type) => {
      if (trash.wastes[type]) {
        const dataPoint = {
          value: trash.wastes[type],
          name: type,
        };
        records.push(dataPoint);
      }
    });
    return records;
  }

  epochTimeToDate(epoch): string {
    const date = new Date(epoch * 1000);
   // return moment(date.toISOString()).format('MM/DD/YYYY');
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }

}
