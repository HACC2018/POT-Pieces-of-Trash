import { Component, OnInit, ViewChild } from '@angular/core';
import { TrashQueryService } from '../../@core/data/trash-query.service';

import * as _ from 'lodash';

@Component({
  selector: 'ngx-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss']
})
export class ActionsComponent implements OnInit {

  actions = [];

  @ViewChild('newLocationForm') newLocationForm;

  constructor(private trashSvc: TrashQueryService) { }

  ngOnInit() {
    this.getActions()
  }

  addNewLocation(newLocation: string) {
    if (newLocation.trim() != '') {
      this.trashSvc.addLocation(newLocation).subscribe(
        data => this.getActions()
      );
    }
  }

  updateCompletedStatus(id) {
    console.log(id);
    this.trashSvc.updateActionItemStatus(id).subscribe();
  }

  private getActions() {
    this.actions = [];
    this.trashSvc.getActionItems().subscribe(
      data => {
        _.forOwn(data, (value, key) => {
          this.actions.push({ 'location': key, 'actions': value });
        });
        console.log(this.actions)
      });
  }


  epochTimeToDate(epoch): string {
    const date = new Date(epoch * 1000);
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }

  addNewAction(location, action) {
    this.trashSvc.postActionItems(location, action).subscribe(
      data => _.some(this.actions, (newAction) => {
        if (newAction.location == location) {
          newAction.actions.unshift({
            'action': action, 'timestamp': data['data'].timestamp,
            'completed': data['data'].completed, 'id': data['data'].id
          });

          return true;
        }
        return false;
      })
    );
  }

}
