import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import Print from '@arcgis/core/widgets/Print';
import { EsriMapService } from 'src/app/services/esri-map.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css']
})
export class PrintComponent implements AfterViewInit {

  @ViewChild('layersNode', { static: true }) private mapGalleryNode: ElementRef;

  constructor(private mapService: EsriMapService, private router: Router) { }

  ngAfterViewInit() {
    this.addWidget();
  }

  addWidget(): void {
    const widget = new Print({
      view: this.mapService.getViewMap(),
      container: this.mapGalleryNode.nativeElement,
      printServiceUrl: environment.SERVICIO_IMPRESION
    });
  }

}
