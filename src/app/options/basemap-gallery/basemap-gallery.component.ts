import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import { EsriMapService } from '../../services/esri-map.service';
import { Router } from '@angular/router';

import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';

@Component({
  selector: 'app-basemapgallery-panel',
  templateUrl: './basemap-gallery.component.html',
  styleUrls: ['./basemap-gallery.component.css'],
})
export class BasemapGalleryComponent implements OnInit, AfterViewInit {

  @ViewChild('mapGalleryNode', { static: true }) private mapGalleryNode: ElementRef;
  basemapGallery: any;
  updateViewSubscription: any;

  constructor(private mapService: EsriMapService, private router: Router) { }

  ngOnInit(): any {
    this.updateViewSubscription = this.mapService.updateViewRequest.subscribe(() => {
      this.addWidget();
    });
  }

  ngAfterViewInit(): void {
    this.addWidget();
  }

  addWidget(): void {
    const widgetContainer1 = this.mapGalleryNode.nativeElement;
    const view: any = this.mapService.getViewMap();
    if (this.basemapGallery) {
      this.basemapGallery.view = view;
    } else {
      this.basemapGallery = new BasemapGallery({
        view,
        container: widgetContainer1
      });
    }
  }
}
