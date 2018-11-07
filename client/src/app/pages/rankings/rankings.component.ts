import { Component, OnInit } from '@angular/core';
import { TrashQueryService } from '../../@core/data/trash-query.service';
import * as _ from 'lodash';

@Component({
  selector: 'ngx-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss']
})
export class RankingsComponent implements OnInit {

  rankings: any = [];

  constructor(private trashSvc: TrashQueryService) { }

  ngOnInit() {
    this.trashSvc.getRankings().subscribe(
      rankData => this.rankings =
        _.map(rankData, (rank) => {
          return { 'location': rank['location'], 'change': ((rank['change'] - 1.0) * 100)};
        })
    );
  }

  formatPercentage(percent) {
    percent = percent.toFixed(2);
    if (percent < 0) {
      return percent.toString() + '%';
    } else {
      return '+ ' + percent.toString() + '%';
    }
  }

  formatLabel(label) {
    return _.capitalize(label);
  }

}
