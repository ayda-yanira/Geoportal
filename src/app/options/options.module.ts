import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// Componentes
import { FilterComponent } from './filter/filter.component';
import { OptionsRoutingModule } from './options-routing.module';
import { LayersComponent } from './layers/layers.component';
import { PrintComponent } from './print/print.component';
import { BasemapGalleryComponent } from './basemap-gallery/basemap-gallery.component';
import { MeasurementComponent } from './measurement/measurement.component';
import { CertificatesComponent } from './certificates/certificates.component';
// Modulos
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// PrimeNg
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ChartModule } from 'primeng/chart';
import { FieldsetModule } from 'primeng/fieldset';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { NumberDirective } from '../directives/number.directive';
import { DialogModule } from 'primeng/dialog';

@NgModule({
  declarations:
    [
      NumberDirective,
      FilterComponent,
      LayersComponent,
      PrintComponent,
      MeasurementComponent,
      BasemapGalleryComponent,
      CertificatesComponent
    ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    OptionsRoutingModule,
    DropdownModule,
    CheckboxModule,
    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    TableModule,
    ProgressSpinnerModule,
    TabViewModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    FileUploadModule,
    ChartModule,
    FieldsetModule,
    AutoCompleteModule,
    DialogModule
  ]
})
export class OptionsModule { }
