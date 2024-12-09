import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowRulesComponent } from './flow-rules.component';

describe('FlowRulesComponent', () => {
  let component: FlowRulesComponent;
  let fixture: ComponentFixture<FlowRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowRulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
