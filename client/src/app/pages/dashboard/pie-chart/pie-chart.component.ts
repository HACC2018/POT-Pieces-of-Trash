import {Component, OnInit, ViewChild, AfterViewChecked} from '@angular/core';
import * as _ from 'lodash';
import { TrashQueryService } from '../../../@core/data/trash-query.service';
import { UIUtilService } from '../../../@core/data/ui-uti.servicel';
import * as moment from 'moment'

@Component({
  selector: 'ngx-echarts',
  styleUrls: ['./pie-chart.component.scss'],
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent implements OnInit, AfterViewChecked {

  locations: string[];
  dates = []

  trashTypes: string[];
  formattedPieChartData: any[];

  dateSelectCorrected = false;
  locationSelectCorrected = false;

  locationsByDate = {}

  selectedLocation;
  selectedDate;
  
  @ViewChild('locationSelector') locationSelector;
  @ViewChild('dateSelector') dateSelector;

  constructor(private trashSvc: TrashQueryService,
              private uiutil: UIUtilService) {
  }

  async ngOnInit() {
    this.trashSvc.getPieChartParam().subscribe(
      infoList => {
        _.forEach(infoList, info => {
          _.forEach(info.locations, location => {
            if (!(location in this.locationsByDate)) {
              this.locationsByDate[location] = []
            }
            this.locationsByDate[location].push(info.date);
          })
        });
        console.log(this.locationsByDate)
        this.trashSvc.getLocations()
          .subscribe(async locations => {
            this.locations = locations.data.map(location => location.location);
            console.log(this.locations)
            if (this.locations.length > 0) {
              this.setLocation(this.locations[0]);
            }
        });
      }
    )
  }

  async setLocation(location: string) {
    console.log('setlocation:' + location)
    console.log(this.locationSelector);
    this.locationSelector.setSelection(location);
    this.dates = this.locationsByDate[location] || [];
    if (this.dates.length > 0) {
      this.setDate(this.dates[0]);
    }
    this.plotPieChart()
    
  }

  async setDate(time: number) {
    console.log('setting date')
    this.dateSelector.selectValue(time);
    this.plotPieChart()
  }

  async plotPieChart() {
    if (this.selectedLocation != undefined && this.selectedDate != undefined) {
      const trash = await this.trashSvc.getTrashByLocation(this.selectedLocation, this.selectedDate).toPromise()
      this.formattedPieChartData = this.formatData(trash);
    }
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

  ngAfterViewChecked() {
    if (!this.locationSelectCorrected && this.locationSelector != undefined && this.locationSelector.options != undefined) {
      if (this.uiutil.patchNbSelect(this.locationSelector)) {
        this.locationSelector.onChange = this.setLocation
        this.locationSelectCorrected = true;
      }
    }

    if (!this.dateSelectCorrected && this.dateSelector != undefined && this.dateSelector.options != undefined) {
      if (this.uiutil.patchNbSelect(this.dateSelector)) {
        this.dateSelector.onChange = this.setDate
        this.dateSelectCorrected = true;
      }
    }
  }

  epochTimeToDate(epoch) {
    const date = new Date(epoch *1000);
    return  moment(date.toISOString()).format("MM/DD/YYYY")
  }
}