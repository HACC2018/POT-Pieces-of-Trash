import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';


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


}
