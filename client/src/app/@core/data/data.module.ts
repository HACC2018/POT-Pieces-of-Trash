import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StateService } from './state.service';
import { LayoutService } from './layout.service';
import {TrashQueryService} from './trash-query.service';
import { UIUtilService } from './ui-uti.servicel';

const SERVICES = [
  StateService,
  LayoutService,
  TrashQueryService,
  UIUtilService,
];

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    ...SERVICES,
  ],
})
export class DataModule {
  static forRoot(): ModuleWithProviders {
    return <ModuleWithProviders>{
      ngModule: DataModule,
      providers: [
        ...SERVICES,
      ],
    };
  }
}
