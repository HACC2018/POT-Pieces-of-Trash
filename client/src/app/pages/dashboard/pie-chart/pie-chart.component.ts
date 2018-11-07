import {Component, OnInit, ViewChild, AfterViewChecked, Input} from '@angular/core';
import * as _ from 'lodash';
import { TrashQueryService } from '../../../@core/data/trash-query.service';

@Component({
  selector: 'ngx-echarts',
  styleUrls: ['./pie-chart.component.scss'],
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent implements OnInit {

  trashTypes: string[];

  locations: string[];
  dates: number[] = [];
  locationsByDate = {};
  formattedPieChartData: any[];

  @ViewChild('selectedLocation') selectedLocation;

  constructor(private trashSvc: TrashQueryService) {
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
    const currentLocation = this.selectedLocation.nativeElement.value;

    if (this.selectedLocation.nativeElement.value) {
      let newLocation = '';
      if (this.locations.includes(currentLocation)) {
        newLocation = currentLocation;
      } else {
        newLocation = this.locations[0];
      }
      
      if (newLocation) {
        this.getLocationData(newLocation, dateKey);
      }
    }
  }


  locationDisplay(location: string): string {
    return _.capitalize(location);
  }

  getLocationData(selectedLocation, selectedDate) {
    console.log(selectedLocation)
    this.trashSvc.getTrashByLocation(selectedLocation, selectedDate)
      .subscribe(data => {
        this.formattedPieChartData = this.formatData(data);
      });
  }

  formatData(trash): any[] {
    const records = [];
    this.trashTypes = [];
    _.forOwn(trash.wastes, (value, key) => {
      const dataPoint = {
        value: value,
        name: _.capitalize(key),
      };
      this.trashTypes.push(_.capitalize(key));
      records.push(dataPoint);
    });
    return records;
  }

  epochTimeToDate(epoch): string {
    const date = new Date(epoch * 1000);
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }

}
