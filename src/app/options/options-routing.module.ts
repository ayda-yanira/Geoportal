import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
// Componentes
import { FilterComponent } from './filter/filter.component';
import { LayersComponent } from './layers/layers.component';
import { BasemapGalleryComponent } from './basemap-gallery/basemap-gallery.component';
import { PrintComponent } from './print/print.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { CertificatesComponent } from './certificates/certificates.component';

const routes: Routes = [
  { path: 'filter', component: FilterComponent },
  { path: 'layer', component: LayersComponent },
  { path: 'print', component: PrintComponent },
  { path: 'measurement', component: MeasurementComponent },
  { path: 'basemapGallery', component: BasemapGalleryComponent },
  { path: 'certificates', component: CertificatesComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OptionsRoutingModule { }


