import {Component, OnInit} from '@angular/core';
import {TrashCollectionService} from '../../../@core/data/trash-collection.service';
import {loadConfigurationFromPath} from 'tslint/lib/configuration';
import * as _ from 'lodash';

@Component({
  selector: 'ngx-echarts',
  styleUrls: ['./echarts.component.scss'],
  templateUrl: './echarts.component.html',
})
export class EchartsComponent implements OnInit {

  locations: string[];
  currLocation: string;
  trashTypes: string[];
  locationTrashData: any;
  formattedPieChartData: any[];

  constructor(private trashSvc: TrashCollectionService) {
  }

  ngOnInit() {
    // TODO make this observable
    this.locations = this.trashSvc.getLocations();
     this.setLocation(this.locations[0]);
    this.trashTypes = this.trashSvc.getTrashTypes();
    this.formattedPieChartData = this.formatData();
  }

  setLocation(location: string) {
    // Change location for pie chart
    this.currLocation = location;
    this.locationTrashData = this.trashSvc.getTrashByLocation(location);
    this.formattedPieChartData = this.formatData();
  }

  formatData(): any[] {
    const records = [];
    _.forEach(this.trashTypes, (type) => {
      if (this.locationTrashData.wastes[type]) {
        const dataPoint = {
          value: this.locationTrashData.wastes[type],
          name: type,
        };
        records.push(dataPoint);
      }
    });
    return records;
  }
}
