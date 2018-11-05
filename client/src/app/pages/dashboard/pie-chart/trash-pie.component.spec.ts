import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrashPieComponent } from './trash-pie.component';

describe('TrashPieComponent', () => {
  let component: TrashPieComponent;
  let fixture: ComponentFixture<TrashPieComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrashPieComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrashPieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
