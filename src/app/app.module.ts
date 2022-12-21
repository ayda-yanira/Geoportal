import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from "./app.component";
import { EsriMapComponent } from "./public/esri-map/esri-map.component";
import { HeaderComponent } from "./public/header/header.component";

import { EsriMapService } from "./services/esri-map.service";
import { AppRoutingModule } from './app-routing.module';

// PrimeNg
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { LocationStrategy, HashLocationStrategy } from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    EsriMapComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    DialogModule,
    ButtonModule,
    MenubarModule,
    TieredMenuModule,
    SidebarModule,
    TooltipModule,
    AutoCompleteModule
  ],
  providers: [EsriMapService, { provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule { }
