import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Input
} from '@angular/core';

import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Home from '@arcgis/core/widgets/Home';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import Locate from '@arcgis/core/widgets/Locate';
import Search from '@arcgis/core/widgets/Search';
import CoordinateConversion from '@arcgis/core/widgets/CoordinateConversion';

import { EsriMapService } from '../../services/esri-map.service';
import { Subscription } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css'],
})
export class EsriMapComponent implements OnInit, OnDestroy {
  public view: any = null;
  panRequestSubscription: any;
  subscription: Subscription;

  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  @Input() showTable: boolean;

  tableFeatures: any;

  constructor(private mapService: EsriMapService, private http: HttpClient) {
    this.mapService.allLayers = [];
  }

  initializeMap(is2D: boolean = true): Promise<any> {
    const container = this.mapViewEl.nativeElement;

    const webmap = new WebMap({
      portalItem: {
        id: environment.WEBMAP_ITEM
      }
    });

    const view = new MapView({
      container,
      map: webmap
    });

    // en caso de que el mapa ya haya sido dibujado anteriormente, se almacena la posición donde se encuentra el usuario
    if (this.view) {
      view.viewpoint = this.view.viewpoint;
    }
    // Se agregan widgets
    view.ui.add(new Home({ id: 'homeWidget', view }), 'top-left');
    view.ui.add(new ScaleBar({ id: 'scaleBarWidget', view, style: 'ruler' }), 'bottom-left');
    view.ui.add(new Locate({ view }), 'top-left');
    const coordinateConversion = new CoordinateConversion({ view });
    coordinateConversion.visibleElements = {
      settingsButton: false,
      captureButton: false
    };
    view.ui.add([{ component: coordinateConversion, position: 'bottom-trailing', index: 1 }, { component: new Search({ view }), position: 'bottom-trailing', index: 0 }]);

    this.view = view;
    this.mapService.setViewMap(this.view);
    return this.view.when();
  }

  filterSublayer(url, idSubLayer): any {
    const layer: any = this.mapService.allServices.filter(item => item.url === url)[0];
    return (layer.sublayers.filter(item => item.id === idSubLayer))[0];
  }

  ngOnInit(): any {
    this.panRequestSubscription = this.mapService.panRequest.subscribe(() => {
      this.panMap(this.mapService.wonderCoordinates);
    });
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.view) {
      this.view.destroy();
      this.subscription.unsubscribe();
    }
  }

  panMap(coordinates: string): void {
    this.view.goTo(coordinates).then(() => {
      this.view.zoom = 18;
      setTimeout(() => {
        this.mapService.panToWonderComplete();
      }, 2000);
    });
  }

  updateView(): void {
    setTimeout(() => {
      this.mapService.updateView();
    }, 2000);
  }

  getMapStyle(): Object {
    let height = window.innerHeight;
    if (window.innerWidth <= 894 && window.innerWidth > 361) {
      height -= 50;
    } else if (window.innerWidth <= 361) {
      height -= 50;
    } else {
      height -= 52;
    }
    return { height: this.showTable ? height * 0.7 + 'px' : height + 'px', width: window.screen.availWidth + 'px' };
  }
}
