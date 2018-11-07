import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {PIE_TRASH_DATA} from './mocks/pie.mock';
import * as _ from 'lodash';

@Injectable()
export class TrashQueryService {

  constructor(private http: HttpClient) {}

  submitImage(formData: FormData) {
    const url = environment.serverURL + '/analyze';
    return this.http.post(url, formData);
  }

  getLocations(): Observable<any> {
    const url = environment.serverURL + '/locations';
    return this.http.get(url);

  }

  addLocation(location) {
    return this.http.post(environment.serverURL + '/locations', {
      'location': location
    });
  }

  getTrashTypes(): Observable<any> {
    // relative url of the waste types endpoint
    const url = '/waste-types';
    return this.http.get(environment.serverURL + url)
      .pipe(
        // return just the array of strings from the result
        map(res => res['waste-types'] ),
       catchError(this.handleError<string[]>('waste types')),
        );
    // Mock data return, commented out
    // return of(TRASH_TYPES_MOCK.trashTypes);
  }

  getTrashByLocation(location: string, time: number): any {
    const jsonBody =  {
      'location': location,
      'timestamp': time,
    };
    return this.http.post(environment.serverURL + '/pie', jsonBody);
  }

  getPieChartParam() {
    return this.http.get(environment.serverURL + '/pie');
  }

  getTimeOptions() {
    // TODO have endpoint return list of avail times
    // return this.http.get(environment.serverURL + '');
    return of([1541032618, 1541072618]);
  }

  getTimeseriesData(startTime, endTime, location?: string[]) {
    // TODO substitude variables in this call
    const jsonBody = {
      'lowerbound': 1541032618,
      'upperbound': 1541072618,
      'location': ['keller', 'bilger'],
      'waste-types': 'all'
    };

    // return this.http.post(environment.serverURL + '/timeseries', jsonBody);
    return of({
      'x': [1540980000, 1541066400],
      'y': [
        { 'data': [73, 25],
        'location': 'keller',
        'waste': 'paper cups' },
        { 'data': [57, 7],
          'location': 'keller',
          'waste': 'straws' },
        {'data': [0, 26],
          'location': 'bilger',
          'waste': 'paper cups' },
        {'data': [0, 33],
          'location': 'bilger',
          'waste': 'straws' }
          ]});
  }

  // Error handler taken from angular.io
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getActionItems() {
    return this.http.get(environment.serverURL + '/actions');
  }

  postActionItems(location: string, action: string) {
    return this.http.post(environment.serverURL + '/actions', {
      'location': location,
      'action': action
    });
  }

  updateActionItemStatus(id: string) {
    return this.http.put(environment.serverURL + '/actions', {
      'id': id
    });
  }

}
