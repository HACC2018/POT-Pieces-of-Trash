import {Injectable} from '@angular/core';
import {PIE_TRASH_DATA} from './mocks/pie.mock';

import * as _ from 'lodash';
// Mock data imports
import {LOCATIONS_MOCK, TRASH_TYPES_MOCK} from './mocks/lists.mock';
@Injectable()
export class TrashCollectionService {

  getLocations(): string[] {
    return LOCATIONS_MOCK.locations;
  }

  getTrashTypes(): string[] {
    return TRASH_TYPES_MOCK.trashTypes;
  }

  getTrashByLocation(location: string): any {
    // TODO use endpoints
    return _.find(PIE_TRASH_DATA, (point) => point.location === location);
  }
}
