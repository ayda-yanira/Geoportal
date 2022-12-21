import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { environment } from 'src/environments/environment';

import { EsriMapService } from './services/esri-map.service';
import { ModalService } from './services/modal.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  changeVisibilitySubscription: any;
  hideVisibilitySubscription: any;

  showModal: boolean;
  showMinModal: boolean;
  modalTitle = '';
  itemsMenu: MenuItem[];
  showMenu: boolean;
  is2D: boolean;
  showTable: boolean;

  constructor(
    private router: Router,
    private mapService: EsriMapService,
    private modalService: ModalService
  ) {
    this.is2D = false;
    this.itemsMenu = [
      {
        label: 'Leyenda',
        icon: 'pi pi-fw pi-list',
        routerLink: 'layer',
        command: (click) => { this.modalOpen('Leyenda'); },
      },
      {
        label: 'Mapas Base',
        icon: 'pi pi-fw pi-map',
        routerLink: 'basemapGallery',
        command: (click) => { this.modalOpen('Mapas Base'); },
      },
      {
        label: 'Impresión',
        icon: 'pi pi-fw pi-print',
        routerLink: 'print',
        command: (click) => { this.modalOpen('Impresión'); },
      }
    ];

    this.changeVisibilitySubscription = this.mapService.changeVisibilityRequest.subscribe(() => {
      this.changeVisibilityTable();
    });

    this.hideVisibilitySubscription = this.mapService.hideVisibilityRequest.subscribe(() => {
      this.hideVisibilityTable();
    });

    this.onUserDrawing();
  }

  onUserDrawing(): void {
    this.modalService.getPopUp().subscribe(
      res => {
        if (res) {
          this.modalClose();
          this.showMinModal = true;
        } else {
          this.showMinModal = false;
          this.openModal('Certificado de Uso del Suelo', 'landCertficate');
        }
      }
    );
  }

  modalOpen(title: string): void {
    this.showModal = true;
    this.modalTitle = title;
  }

  modalClose(): void {
    if (this.router.url !== '/landCertficate') {
      this.router.navigate(['']);
    }
    this.showModal = false;
  }

  onDeactivate(event): void {
    this.showModal = false;
  }

  switchTo(): void {
    if (!this.is2D) {
      this.mapService.setDimension('3D');
    } else {
      this.mapService.setDimension('2D');

    }
    this.is2D = !this.is2D;
  }

  onClickHelp(): void {
    //this.openModal('Trámites', 'certificates');
  }

  onClickCertificados(): void {
    this.openModal('Trámites', 'certificates');
  }

  openModal(title: string, route: string): void {
    this.showModal = true;
    this.modalTitle = title;
    this.router.navigate([route]);
  }

  changeVisibilityTable(): void {
    this.showTable = !this.showTable;
  }

  hideVisibilityTable(): void {
    this.showTable = false;
  }
}
