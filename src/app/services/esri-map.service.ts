import { Injectable, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class EsriMapService {
  viewMap: any;
  wonderCoordinates: any;
  updateViewRequest = new Subject<void>();
  panRequest = new Subject<void>();
  panComplete = new Subject<void>();
  copyCodeRequest = new Subject<void>();
  changeVisibilityRequest = new Subject<void>();
  hideVisibilityRequest = new Subject<void>();
  modalRequest = new Subject<void>();
  dimension: EventEmitter<string> = new EventEmitter<string>();
  allServices: any[];
  allLayers: any[];
  code: string;

  areaUnits = [
    { id: 'square-meters', name: 'Metros Cuadrados' },
    { id: 'square-kilometers', name: 'Kilómetros Cuadrados' },
    { id: 'hectares', name: 'Hectáreas' },
    { id: 'square-yards', name: 'Yardas Cuadradas' },
    { id: 'square-feet', name: 'Pies Cuadrados' },
    { id: 'square-miles', name: 'Millas Cuadradas' }
  ];

  lengthUnits = [
    { id: 'meters', name: 'Metros' },
    { id: 'kilometers', name: 'Kilómetros' },
    { id: 'yards', name: 'Yardas' },
    { id: 'feet', name: 'Pies' },
    { id: 'miles', name: 'Millas' }
  ];

  landCertificateOptions = [
    {
      id: 0,
      name: 'Insertar coordenadas'
    },
    {
      id: 1,
      name: 'Dibujar sobre el mapa'
    },
    {
      id: 2, name: 'Cargar archivo shapefile (comprimido zip)'
    },
  ];

  constructor() { }

  panToWonder(wonderCoordinates: any): void {
    this.wonderCoordinates = wonderCoordinates;
    this.panRequest.next();
  }

  panToWonderComplete(): void {
    this.panComplete.next();
  }

  changeVisibilityTable(): void {
    this.changeVisibilityRequest.next();
  }

  hideVisibilityTable(): void {
    this.hideVisibilityRequest.next();
  }

  updateView(): void {
    this.updateViewRequest.next();
  }

  setViewMap(viewMap: any): void {
    this.viewMap = viewMap;
  }

  getViewMap(): any {
    return this.viewMap;
  }

  setDimension(dimension: string): void {
    return this.dimension.emit(dimension);
  }

  getDimension(): any {
    return this.dimension;
  }

  clearAllLayers() : void {
    this.allLayers = [];
  }
}
