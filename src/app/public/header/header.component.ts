import { Component, OnInit } from "@angular/core";
import { MenuItem } from 'primeng/api';

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit {
  header = "Angular RxJS ArcGis";

  itemsMenu: MenuItem[];


  constructor() {}

  ngOnInit() {

    this.itemsMenu = [
      {
        label: `<div class="menu-item"><img  width="40" height="40" src="assets/images/docs-logo.png" alt="logo"><div class="menu-text" >Descargar Documentación</p></div>`,
        escape: false,
        url: 'https://documentos.siatac.co/monitoreo_ambiental/municipal/vista_hermosa/resultados/',
        target: '_blank'
      },
      {
        label: `<div class="menu-item"><img  width="40" height="40" src="assets/images/descargar-logo.png" alt="logo"><div class="menu-text" >Descargar App</p></div>`,
        escape: false,
        url: 'https://aplicaciones.siatac.co/monitoreo_ambiental/municipal/vistahermosa/aplicacionmovil/Vistahermosa_DLS.apk',
        target: '_blank'
      },
      {
        label: `<div class="menu-item"><img  width="40" height="40" src="assets/images/ayuda-logo.png" alt="logo"><div class="menu-text" >Ayuda</p></div>`,
        escape: false,
        url: 'https://siatac.co:447/resources/Manuales/Manual_Usuario.pdf',
        target: '_blank'
      }
    ];
  }
}
