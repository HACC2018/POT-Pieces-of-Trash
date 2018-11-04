import {Injectable} from '@angular/core';
import {PIE_TRASH_DATA} from './mocks/pie.mock';

import * as _ from 'lodash';
// Mock data imports
import {LOCATIONS_MOCK} from './mocks/lists.mock';
import {Observable, of} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
@Injectable()
export class TrashCollectionService {
  // Base Url of the server
  baseUrl = 'https://waste-audit.herokuapp.com';

  constructor(private http: HttpClient) {}

  getLocations(): Observable<string[]> {
    return of(LOCATIONS_MOCK.locations);
  }

  getTrashTypes(): Observable<any> {
    // relative url of the waste types endpoint
    const url = '/waste-types';
    return this.http.get(this.baseUrl + url)
      .pipe(
        // return just the array of strings from the result
        map(res => res['waste-types:'] ),
       catchError(this.handleError<string[]>('waste types')),
        );
    // Mock data return, commented out
    // return of(TRASH_TYPES_MOCK.trashTypes);
  }

  getTrashByLocation(location: string): any {
    // TODO use endpoints
    return _.find(PIE_TRASH_DATA, (point) => point.location === location);
  }

  // Error handler taken from angular.io
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
