import { Component, OnInit } from '@angular/core';
import {TrashQueryService} from '../../@core/data/trash-query.service';

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  trashTypes: string[];

  constructor(private trashSvc: TrashQueryService) { }

  ngOnInit() {
    this.trashSvc.getTrashTypes()
      .subscribe(types => {
        this.trashTypes = types;
      });
  }

}
