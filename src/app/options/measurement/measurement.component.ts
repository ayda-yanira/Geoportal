import { OnDestroy } from '@angular/core';
import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';

import Measurement from '@arcgis/core/widgets/Measurement';
import { EsriMapService } from 'src/app/services/esri-map.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-measurement',
  templateUrl: './measurement.component.html',
  styleUrls: ['./measurement.component.css']
})
export class MeasurementComponent implements AfterViewInit, OnDestroy {

  @ViewChild('layersNode', { static: true }) private mapGalleryNode: ElementRef;
  measurement: any;
  state: string;
  units: any;
  unitForm = new FormControl('');

  constructor(private mapService: EsriMapService, private router: Router) {

  }

  ngAfterViewInit() {
    this.addWidget();
  }

  addWidget(): void {
    this.measurement = new Measurement({
      view: this.mapService.getViewMap()
    });

    this.measurement.watch('viewModel.state', (state) => {
      this.actionsMeasurement(state);
    });
  }

  actionsMeasurement(state): void {
    this.state = state;
    if (state === 'measured') {
      if (this.measurement.viewModel.activeViewModel.declaredClass.includes('Area')) {
        this.units = this.mapService.areaUnits;
      } else {
        this.units = this.mapService.lengthUnits;
      }
    }
  }

  onDistanceClick(): void {
    const type = this.mapService.getViewMap().type;
    this.measurement.activeTool = type.toUpperCase() === '2D' ? 'distance' : 'direct-line';
  }

  onAreaClick(): void {
    this.measurement.activeTool = 'area';
  }

  onClearClick(): void {
    this.measurement.clear();
  }

  lengthUnitsChange({ value: item }) {
    this.measurement.viewModel.activeViewModel.unit = item.id;
  }

  ngOnDestroy() {
    this.onClearClick();
  }

}
