import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  isDrawing: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor() { }

  setPopUp(isDrawing: boolean): void {
    return this.isDrawing.emit(isDrawing);
  }

  getPopUp(): any {
    return this.isDrawing;
  }
}
