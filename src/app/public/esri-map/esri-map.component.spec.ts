import { TestBed } from '@angular/core/testing';
import { EsriMapComponent } from './esri-map.component';

describe('EsriMapComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EsriMapComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(EsriMapComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(EsriMapComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('angular-arcgis-mapping app is running!');
  });
});
