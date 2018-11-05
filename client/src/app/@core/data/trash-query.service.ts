import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {PIE_TRASH_DATA} from './mocks/pie.mock';
import * as _ from 'lodash';

@Injectable()
export class TrashQueryService {

  constructor(private httpClient: HttpClient) {}

  submitImage(formData: FormData) {
    const url = environment.serverURL + '/analyze';
    return this.httpClient.post(url, formData);
  }

  getLocations(): Observable<any> {
    const url = environment.serverURL + '/locations';
    return this.httpClient.get(url);

  }

  getTrashTypes(): Observable<any> {
    // relative url of the waste types endpoint
    const url = '/waste-types';
    return this.httpClient.get(environment.serverURL + url)
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
    }
    return this.httpClient.post(environment.serverURL + '/pie', jsonBody)
  }

  getPieChartParam() {
    return this.httpClient.get(environment.serverURL + '/pie')
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
