import { Component, OnInit } from '@angular/core';
import { TrashQueryService } from '../../@core/data/trash-query.service';
import * as _ from 'lodash';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'ngx-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {

    results: any = [];

    constructor(private trashSvc: TrashQueryService) { }

    ngOnInit() {
        this.trashSvc.getHistoricalResults().subscribe(
            data => {
                this.results = data;
                _.forEach(this.results, (result) => {
                    const waste_data = [];
                    _.forOwn(result.wastes, (value, key) => {
                        waste_data.push({ 'waste': key, 'count': value });
                    });
                    result.wastes = waste_data;
                });

                console.log(this.results)
            }
        );
    }

    formatLabel(label) {
        return _.capitalize(label);
    }

    epochTimeToDate(epoch): string {
        const date = new Date(epoch * 1000);
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
    }

    hasImageChips(result) {
        return 'image_chips' in result;
    }

    wrapImageURL(relative_image_url) {
        if (relative_image_url.startsWith('/')) {
            return environment.serverURL + relative_image_url;    
        } else {
            return environment.serverURL + '/' + relative_image_url;
        }
    }

}
