import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { MessageService } from 'primeng/api';

import { EsriMapService } from 'src/app/services/esri-map.service';
import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { ConceptoAfectacionRuralRes } from '../certificados/ConceptoAfectacionRuralRes';
import { SueloUrbano } from './../certificados/SueloUrbano';
import { SueloRural } from './../certificados/SueloRural';
import { ConceptoNormaUrbanisticaUrbana } from '../certificados/ConceptoNormaUrbanisticaUrbana';
import { ConceptoNormaUrbanisticaRural } from '../certificados/ConceptoNormaUrbanisticaRural';
import { ConceptoNormaUrbanisticaRuralRes } from '../certificados/ConceptoNormaUrbanisticaRuralRes';
import { ConceptoAfectacionUrbana } from '../certificados/ConceptoAfectacionUrbana';
import { ConceptoAfectacionRural } from '../certificados/ConceptoAfectacionRural';
import JSZip from "jszip";
import { saveAs } from 'file-saver';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css'],
  providers: [MessageService],
})
export class CertificatesComponent implements AfterViewInit, OnDestroy {
  SUBSECREATRIO_NOMBRE = environment.SUBSECREATRIO_NOMBRE;

  isValidFormSubmitted = null;
  loading: boolean;

  code: string;
  printCode: string;

  consecutive: string;
  ciuu: string;
  graphicsLayer: any;
  currentFeatures: any = null;
  featureType: string;
  showCIIU: boolean;
  certificateLink: string;

  conceptoNormaUrbanisticaRuralRes: ConceptoNormaUrbanisticaRuralRes =
    new ConceptoNormaUrbanisticaRuralRes(this);
  conceptoAfectacionRuralRes: ConceptoAfectacionRuralRes =
    new ConceptoAfectacionRuralRes(this);
  conceptoNormaUrbanisticaUrbana: ConceptoNormaUrbanisticaUrbana =
    new ConceptoNormaUrbanisticaUrbana(this);
  conceptoNormaUrbanisticaRural: ConceptoNormaUrbanisticaRural =
    new ConceptoNormaUrbanisticaRural(this);
  sueloUrbano: SueloUrbano = new SueloUrbano(this);
  sueloRural: SueloRural = new SueloRural(this);
  conceptoAfectacionUrbana: ConceptoAfectacionUrbana = new ConceptoAfectacionUrbana(this);
  conceptoAfectacionRural: ConceptoAfectacionRural = new ConceptoAfectacionRural(this);

  maxQueries: number;
  countQueries: number;
  certificadosItems: any[];
  ciiuItems: any[];

  filteredCiiu: any[];

  conceptForm = new FormGroup({
    procedureType: new FormControl('', [Validators.required]),
    pre: new FormControl('52001', [Validators.required]),
    preCode: new FormControl('', [Validators.required, Validators.minLength(15), Validators.maxLength(30)]),
    codCiiu: new FormControl('')
  });

  constructor(
    private mapService: EsriMapService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.graphicsLayer = new GraphicsLayer();
    this.mapService.getViewMap().map.add(this.graphicsLayer);
    this.certificadosItems = [
      { name: 'Concepto Norma Urbanística', code: 'NU' },
      { name: 'Concepto de Uso de Suelo', code: 'US' },
      { name: 'Certificado de Riesgos y Restricciones', code: 'RR' },
    ];
    this.ciiuItems = [];

    this.queyCiiu();
  }

  queyCiiu() {
    console.log('queyCiiu');

    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['*'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = `id_ciiu is not null`;
    queryParamas.outSpatialReference =
      this.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.CIIU_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.ciiuItems = [];

          for (const feature of results.features) {
            this.ciiuItems.push({
              codigo: feature.attributes.ciiu_actividad,
              id_ciiu: feature.attributes.id_ciiu
            });
          }
        }

        this.loading = false;
      });
  }

  ngAfterViewInit() {
    const popup = this.mapService.getViewMap().popup;
    popup.watch('selectedFeature', (graphic) => {
      if (graphic && graphic.attributes && graphic.attributes.codigo_predial_anterior) {
        this.preCode.setValue(graphic.attributes.codigo_predial_anterior.substr(5));
      }
    });
  }

  clearTexts() { }

  onSearchClick() {
    this.isValidFormSubmitted = false;
    if (this.conceptForm.invalid) {
      if (this.showCIIU) {
        if (this.conceptForm.controls.codCiiu.value == null) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Código CIUU',
            detail: 'Digite los 4 números del código CIUU o elija de la lista de acuerdo a la actividad económica'
          });
        }
      }

      return;
    }

    this.isValidFormSubmitted = true;
    this.graphicsLayer.removeAll();
    this.printCode = this.conceptForm.value.pre + this.conceptForm.value.preCode;
    this.code = this.conceptForm.value.pre + this.conceptForm.value.preCode;
    const intCode = parseInt(this.code.substring(this.code.length - 3), 10);
    if (intCode >= 901 && intCode <= 906) {
      this.code = this.code.slice(0, -6) + intCode + intCode;
    }
    this.countQueries = 0;
    this.currentFeatures = null;
    this.clearTexts();
    this.checkCertificateLink();
    this.checkClasePredio();
  }

  get procedureType() {
    return this.conceptForm.get('procedureType');
  }

  get pre() {
    return this.conceptForm.get('pre');
  }

  get preCode() {
    return this.conceptForm.get('preCode');
  }

  get codCiiu() {
    return this.conceptForm.get('codCiiu');
  }

  changeProcedureType(event) {
    this.currentFeatures = null;
    this.graphicsLayer.removeAll();
    this.showCIIU = event.value.code === 'US';
    if (this.showCIIU) {
      this.conceptForm.controls.codCiiu.setValidators([Validators.required]);
    } else {
      this.conceptForm.controls.codCiiu.clearValidators();
    }
    this.conceptForm.controls.codCiiu.updateValueAndValidity();
  }

  checkCertificateLink() {
    switch (this.conceptForm.value.procedureType.code) {
      case 'NU':
        this.certificateLink = environment.LINK_NORMA_URBANISTICA;
        break;
      case 'US':
        this.certificateLink = environment.LINK_USO_SUELO;
        break;
      case 'RR':
        this.certificateLink = environment.LINK_RIEGOS_RESTRICCIONES;
        break;
    }
  }

  checkClasePredio() {
    this.loading = true;
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `codigo_predial_anterior = '${this.code}'`;
    queryParamas.outSpatialReference =
      this.mapService.getViewMap().spatialReference;

    Promise.all([
      query
        .executeQueryJSON(
          environment.TRATAMIENTO_URBANISTICA_SERVICE,
          queryParamas
        ),
      query
        .executeQueryJSON(
          environment.NORMAL_RURAL_SERVICE,
          queryParamas
        )
    ]).then(([resultUrbano, resultRural]) => {
      if ((resultUrbano.features.length > 0 && resultRural.features.length > 0) || resultRural.features.length > 0) {
        this.currentFeatures = resultRural.features;
        this.featureType = 'RURAL';

        this.sueloRural.normaRural = resultRural.features;
        this.getCompatibilidadActividadesRural(this.sueloRural.normaRural, this.featureType);
        this.setFeature();
      } else if (resultUrbano.features.length > 0) {
        this.currentFeatures = resultUrbano.features;
        this.featureType = 'URBANO';

        this.getCompatibilidadActividadesUrbano();
        //this.getCompatibilidadActividad(this.sueloUrbano.idsTiposActividades, this.featureType);
        this.setFeature();
      } else {
        this.loading = false;
        this.currentFeatures = null;
        this.messageService.clear();
        this.messageService.add({
          key: 'c',
          sticky: true,
          severity: 'warn',
          summary: 'Trámites',
          detail: 'Apreciado usuario, el predio no se encuentra registrado en la base principal de la Secretaría de Planeación. ' +
            'Es necesario que Usted solicite la ficha predial o carta catastral ante el Instituto Geográfico Agustín Codazzi - IGAC. ' +
            'Lo anterior con el fin de ubicar el predio en la cartografía del POT y así determinar las propiedades normativas que ' +
            'le aplican y debe registrar la solicitud,  adjuntando el documento en formato pdf en el siguiente enlace: ' +
            '<a href="' + this.certificateLink + '" target="_blank">Aquí</a>, recuadro PLANEACIÓN: Opción Solictud Concepto de norma urbanística, ' +
            'Solictud Concepto uso de suelo, Certificado de Riesgos y Restricciones... ',
        });
      }
    });
  }

  setFeature() {
    this.loading = false;

    const polygonSymbol = {
      type: 'simple-fill',
      color: [0, 255, 255, 32],
      outline: {
        color: [0, 255, 255, 255],
        width: 3,
      },
    };

    this.currentFeatures.forEach(feature => {
      const graphic = new Graphic({
        geometry: feature.geometry,
        symbol: polygonSymbol,
      });
      this.graphicsLayer.add(graphic);
    }
    );
    this.mapService.getViewMap().goTo(this.currentFeatures);

    this.checkConceptType();
  }

  checkConceptType() {
    switch (this.conceptForm.value.procedureType.code) {
      case 'NU':
        if (this.featureType === 'URBANO') {
          this.conceptoNormaUrbanisticaUrbana.query();
        } else {
          this.conceptoNormaUrbanisticaRural.query();
          this.conceptoNormaUrbanisticaRuralRes.query();
        }
        break;
      case 'US':
        if (this.featureType === 'URBANO') {
          this.sueloUrbano.query();
        } else {
          this.sueloRural.query();
        }
        break;
      case 'RR':
        if (this.featureType === 'URBANO') {
          this.conceptoAfectacionUrbana.query();
        } else {
          this.conceptoAfectacionRural.query();
          this.conceptoAfectacionRuralRes.query();
        }
        break;
    }
  }

  downloadFile(blob, fileName) {
    const url = window.URL || window.webkitURL;
    const link = url.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('download', fileName);
    a.setAttribute('href', link);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.loading = false;
  }

  onDownloadClick(): void {
    this.consecutive = Date.now().toString();
    this.loading = true;
    const zip = new JSZip();
    switch (this.conceptForm.value.procedureType.code) {
      case 'NU':
        if (this.featureType === 'URBANO') {
          const blobPDF = this.conceptoNormaUrbanisticaUrbana.download();
          this.downloadFile(blobPDF, `Concepto de Norma Urbanística Urbana ${this.printCode}.pdf`);
        } else {
          if (this.conceptoNormaUrbanisticaRuralRes.atributosNorma != null) {
            const allowDownload = this.conceptoNormaUrbanisticaRural.allowDownload;
            if (allowDownload) {
              zip.file(
                `Concepto de Norma Urbanística Rural ${this.printCode}.pdf`,
                this.conceptoNormaUrbanisticaRural.download()
              );
              zip.file(
                `Concepto de Norma Urbanística Rural Restringido ${this.printCode}.pdf`,
                this.conceptoNormaUrbanisticaRuralRes.download()
              );
              zip.generateAsync({ type: 'blob' }).then((content) => {
                this.loading = false;
                saveAs(content, `archivos_${this.printCode}.zip`);
              });
            } else {
              const blobPDF = this.conceptoNormaUrbanisticaRuralRes.download();
              this.downloadFile(blobPDF, `Concepto de Norma Urbanística Rural Restringido ${this.printCode}.pdf`);
            }
          } else {
            const blobPDF = this.conceptoNormaUrbanisticaRural.download();
            this.downloadFile(blobPDF, `Concepto de Norma Urbanística Rural ${this.printCode}.pdf`);
          }
        }
        break;
      case 'US':
        if (this.featureType === 'URBANO') {
          const blobPDF = this.sueloUrbano.download();
          this.downloadFile(blobPDF, `Concepto Uso de Suelo Urbano ${this.printCode}.pdf`);
        } else {
          const blobPDF = this.sueloRural.download();
          this.downloadFile(blobPDF, `Concepto Uso de Suelo Rural ${this.printCode}.pdf`);
        }
        this.currentFeatures = null;
        this.conceptForm.controls.codCiiu.reset();
        break;
      case 'RR':
        if (this.featureType === 'URBANO') {
          const blobPDF = this.conceptoAfectacionUrbana.download();
          this.downloadFile(blobPDF, `Certificado de Riesgos y Restricciones Urbano ${this.printCode}.pdf`);
        } else {
          if (this.conceptoAfectacionRuralRes.atributosNorma != null) {
            zip.file(
              `Certificado de Riesgos y Restricciones Rural ${this.printCode}.pdf`,
              this.conceptoAfectacionRural.download()
            );
            zip.file(
              `Certificado de Riesgos y Restricciones Rural Restringido ${this.printCode}.pdf`,
              this.conceptoAfectacionRuralRes.download()
            );
            zip.generateAsync({ type: 'blob' }).then((content) => {
              this.loading = false;
              saveAs(content, `archivos_${this.printCode}.zip`);
            });
          } else {
            const blobPDF = this.conceptoAfectacionRural.download();
            this.downloadFile(blobPDF, `Certificado de Riesgos y Restricciones Rural ${this.printCode}.pdf`);
          }
        }
    }
    this.messageService.clear();
    this.messageService.add({
      severity: 'info',
      summary: 'Trámites',
      detail: 'Su documento se ha descargado correctamente',
    });
  }

  addHeaders(doc: any, title: string): void {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setDrawColor(0);
      doc.setFillColor(255, 255, 255);
      doc.rect(5, 6, 40, 20, 'FD');
      doc.rect(40, 6, 165, 20, 'FD');
      const img = new Image();
      img.src = 'assets/images/logo_municipio.png';
      doc.addImage(img, 'png', 13, 7, 22, 18);
      doc.setFontSize(6);
      doc.setFont(undefined, 'bold');
      const col = doc.internal.pageSize.width / 2 + 18;
      doc.text('PROCESO GESTIÓN DE ORDENAMIENTO TERRITORIAL', col, 9, {
        align: 'center',
      });
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.text('NOMBRE DEL FORMATO', col, 13, {
        align: 'center',
      });
      doc.setFontSize(6);
      doc.setFont(undefined, 'bold');
      doc.text(title, col, 17, {
        align: 'center',
      });
      doc.setFontSize(6);
      doc.text('VIGENCIA', 42, 21, {
        align: 'left',
      });
      doc.text('VERSIÓN', 82, 21, {
        align: 'left',
      });
      doc.text('CODIGO', 132, 21, {
        align: 'left',
      });
      doc.text('CONSECUTIVO', 175, 21, {
        align: 'left',
      });
      doc.text('7-oct-16', 43, 24, {
        align: 'left',
      });
      doc.text('01', 85, 24, {
        align: 'left',
      });
      doc.text('GOT-F-009', 131, 24, {
        align: 'left',
      });
      doc.text(this.consecutive, 176, 24, {
        align: 'left',
      });
      doc.setFont(undefined, 'normal');
    }
  }

  addFooters(doc: any): void {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      const img = new Image();
      img.src = 'assets/images/logo_footer.png';
      doc.addImage(img, 'png', 120, 280);
    }
  }

  validatCount() {
    this.countQueries++;
    if (this.countQueries === this.maxQueries) {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.mapService.getViewMap().map.remove(this.graphicsLayer);
  }

  onFocusCIIU() {
    if (this.conceptForm.value.preCode === '') {
      this.messageService.clear();
      this.messageService.add({
        severity: 'warn',
        summary: 'Concepto',
        detail: 'Digite el código predial'
      });
      this.loading = false;
    } else {
      this.loading = true;
      const queryParamas = new Query();
      queryParamas.returnGeometry = true;
      queryParamas.outFields = ['*'];
      queryParamas.where = `codigo_predial_anterior = '${this.conceptForm.value.preCode}'`;
      queryParamas.outSpatialReference =
        this.mapService.getViewMap().spatialReference;

      query
        .executeQueryJSON(environment.AREA_ACTIVIDAD_SERVICE, queryParamas)
        .then((results) => {
          if (results.features.length > 0) {
            const idsTiposActividades = [];

            this.sueloUrbano.tiposActividades = [];
            this.sueloUrbano.idsTiposActividades = idsTiposActividades;

            this.sueloRural.tiposActividades = [];
            this.sueloRural.idsTiposActividades = idsTiposActividades;

            for (const result of results.features) {
              idsTiposActividades.push(`'${result.attributes.id_tipo_actividad}'`);

              if (result.attributes.clase_suelo === 'Urbano') {
                this.sueloUrbano.tiposActividades.push(`${result.attributes.tipo_actividad}`);
              } else {
                this.sueloRural.tiposActividades.push(`${result.attributes.tipo_actividad}`);
              }
            }

            this.getRestriccionesActividadRural(idsTiposActividades);
            this.getRestriccionesActividadUrbano(idsTiposActividades);
            this.getCompatibilidadActividad(idsTiposActividades, '');
            this.getActividadCiiu([]);
          } else {
            this.loading = false;
          }

          this.getActividadCiiu([]);
        });

    }
  }

  getRestriccionesActividadRural(listaIds: any) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['*'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = `id_tipo_actividad in (${listaIds})`;
    queryParamas.outSpatialReference =
      this.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.NOTA_USO_RURAL_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.sueloRural.restriccionesActividades = [];

          for (const feature of results.features) {
            this.sueloRural.restriccionesActividades.push({
              id_tipo_actividad: feature.attributes.id_tipo_actividad,
              tipo_actividad: feature.attributes.tipo_actividad,
              nota: feature.attributes.nota
            });
          }
        }
      });
  }

  getRestriccionesActividadUrbano(listaIds: any) {
    console.log(listaIds);
    
    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['*'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = `id_tipo_actividad in (${listaIds})`;
    queryParamas.outSpatialReference =
      this.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.NOTA_USO_URBANA_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.sueloUrbano.restriccionesActividades = [];

          for (const feature of results.features) {
            this.sueloUrbano.restriccionesActividades.push({
              id_tipo_actividad: feature.attributes.id_tipo_actividad,
              tipo_actividad: feature.attributes.tipo_actividad,
              nota: feature.attributes.nota
            });
          }
        }
      });
  }

  getCompatibilidadActividadesUrbano() {
    console.log('getCompatibilidadActividadesUrbano');

    let consulta = `codigo_predial_anterior = '${this.code}'`;

    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['area_actividad', 'clasificacion'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = consulta;
    queryParamas.outSpatialReference = this.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.AREA_ACTIVIDAD_URBANA_SERVICE, queryParamas)
      .then((results) => {
        console.log(results.features);
        if (results.features.length > 0) {
          console.log(results.features);

          const criterios = [];
          const criteriosPEMP = [];
          for (const feature of results.features) {
            criterios.push(`${feature.attributes.area_actividad}`);
            criteriosPEMP.push(`${feature.attributes.clasificacion}`);
          }

          const uniqueIds = [];
          const uniqueCriterios = criterios.filter(element => {
            const isDuplicate = uniqueIds.includes(element);

            if (!isDuplicate) {
              if (element != 'No aplica') {
                uniqueIds.push(element);
                return true;
              }
            }

            return false;
          });

          this.sueloUrbano.criterios = uniqueCriterios;

          const uniqueCriteriosPEMP = criteriosPEMP.filter(element => {
            const isDuplicate = uniqueIds.includes(element);

            if (!isDuplicate) {
              if (element != 'No aplica') {
                uniqueIds.push(element);
                return true;
              }
            }

            return false;
          });

          this.sueloUrbano.criteriosPEMP = uniqueCriteriosPEMP;

          let elementos = '';
          for (const criterio of uniqueCriterios) {
            elementos += `TIPO_ACTIVIDAD = '${criterio}' or `
          }

          if (this.currentFeatures[0].attributes.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico"){
            for (const criterio of uniqueCriteriosPEMP) {
              elementos += `TIPO_ACTIVIDAD = '${criterio}' or `
            }
          }

          elementos += `TIPO_ACTIVIDAD like '1-1'`

          let consulta = `id_ciiu = '${this.conceptForm.value.codCiiu.id_ciiu}' and (${elementos})`;

          const queryParamas = new Query();
          queryParamas.returnGeometry = false;
          queryParamas.outFields = ['id_ciiu, id_tipo_actividad, tipo_actividad, compatibilidad'];
          queryParamas.returnDistinctValues = true;
          queryParamas.where = consulta;
          queryParamas.outSpatialReference = this.mapService.getViewMap().spatialReference;
          console.log(consulta);
          console.log(this.conceptForm.value.codCiiu.id_ciiu);

          query
            .executeQueryJSON(environment.COMPATIBILIDAD_ACTIVIDAD_SERVICE, queryParamas)
            .then((results) => {
              console.log(results.features.length);
              let idTiposActividades = '';

              if (results.features.length > 0) {
                console.log(results.features);//this.main.conceptForm.value.codCiiu.id_ciiu

                this.sueloUrbano.compatibilidadCiiu = [];

                for (const feature of results.features) {
                  idTiposActividades += `id_tipo_actividad = '${feature.attributes.id_tipo_actividad}' or `

                  this.sueloUrbano.compatibilidadCiiu.push({
                    id_ciiu: feature.attributes.id_ciiu,
                    id_tipo_actividad: feature.attributes.id_tipo_actividad,
                    tipo_actividad: feature.attributes.tipo_actividad,
                    compatibilidad: feature.attributes.compatibilidad
                  });
                }

                idTiposActividades += `id_tipo_actividad like '1-1'`
              }

              let consultaNotas = `tipo_actividad = '${this.conceptForm.value.codCiiu.id_ciiu}' and (${idTiposActividades})`; 
              console.log(consultaNotas);

              const queryNotasParams = new Query();
              queryNotasParams.returnGeometry = false;
              queryNotasParams.outFields = ['*'];
              queryNotasParams.returnDistinctValues = true;
              queryNotasParams.where = consultaNotas;
              queryNotasParams.outSpatialReference = this.mapService.getViewMap().spatialReference;

              query
                .executeQueryJSON(environment.NOTA_USO_URBANA_SERVICE, queryNotasParams)
                .then((results) => {
                  console.log(results.features);

                  for (const feature of results.features) {  
                    this.sueloUrbano.notasUso.push({
                      nota: feature.attributes.nota
                    });
                  }
                });

              this.loading = false;
            });

        }

        this.loading = false;
      });

  }

  getCompatibilidadActividadesRural(listaItems: any, tipoFeature: string) {
    const criterios = [];
    const condiciones = [];
    for (const feature of listaItems) {
      criterios.push(`${feature.attributes.tipo_de_area_protegida}`);
      criterios.push(`${feature.attributes.nombre_del_area_protegida}`);
      criterios.push(`${feature.attributes.clasificacion_corredor_ecologic}`);
      criterios.push(`${feature.attributes.zonificacion_zfa_galeras_o_rams}`);
      criterios.push(`${feature.attributes.sistema_hidrico}`);
      criterios.push(`${feature.attributes.suelo_en_cota_superior_a_3000_m}`);
      criterios.push(`${feature.attributes.areas_publicas_y_privadas}`);
      criterios.push(`${feature.attributes.areas_para_la_produccion_agrico}`);
      criterios.push(`${feature.attributes.areas_inmuebles_consideradas_pa}`);
      criterios.push(`${feature.attributes.areas_del_sistema_de_servicios_}`);
      criterios.push(`${feature.attributes.subcategoria}`);

      condiciones.push(`${feature.attributes.condicion_de_riesgo_alto}`);
    }
    console.log(condiciones);

    let uniqueIds = [];
    const uniqueCondiciones = condiciones.filter(element => {
      const isDuplicate = uniqueIds.includes(element);

      if (!isDuplicate) {
        if (element != 'No aplica') {
          uniqueIds.push(element);
          return true;
        }
      }

      return false;
    });

    this.sueloRural.condiciones = uniqueCondiciones;

    uniqueIds = [];
    const uniqueCriterios = criterios.filter(element => {
      const isDuplicate = uniqueIds.includes(element);

      if (!isDuplicate) {
        if (element != 'No aplica') {
          uniqueIds.push(element);
          return true;
        }
      }

      return false;
    });

    this.sueloRural.criterios = uniqueCriterios;

    let elementos = '';
    for (const criterio of uniqueCriterios) {
      elementos += `'${criterio}',`
    }

    elementos += `'-1'`;

    let consulta = `TIPO_ACTIVIDAD in (${elementos}) and id_ciiu = '${this.conceptForm.value.codCiiu.id_ciiu}'`;

    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['id_ciiu, tipo_actividad, compatibilidad'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = consulta;
    queryParamas.outSpatialReference = this.mapService.getViewMap().spatialReference;
    console.log(consulta);
    console.log(this.conceptForm.value.codCiiu.id_ciiu);

    query
      .executeQueryJSON(environment.COMPATIBILIDAD_ACTIVIDAD_SERVICE, queryParamas)
      .then((results) => {
        console.log(results.features.length);
        if (results.features.length > 0) {
          console.log(results.features);//this.main.conceptForm.value.codCiiu.id_ciiu

          if (this.featureType === 'URBANO') {
            console.log(this.featureType);

          } else {
            this.sueloRural.compatibilidadCiiu = [];

            for (const feature of results.features) {
              this.sueloRural.compatibilidadCiiu.push({
                id_ciiu: feature.attributes.id_ciiu,
                tipo_actividad: feature.attributes.tipo_actividad,
                compatibilidad: feature.attributes.compatibilidad
              });
            }
          }

        }

        this.loading = false;
      });
  }

  getCompatibilidadActividad(listaIds: any, tipoFeature: string) {
    let consulta = '';
    if (tipoFeature === '') {
      consulta = `id_tipo_actividad in (${listaIds})`;
    }
    else {
      if (tipoFeature === 'URBANO') {
        consulta = `id_ciiu = '${this.conceptForm.value.codCiiu.id_ciiu}' and id_tipo_actividad in (${this.sueloUrbano.idsTiposActividades})`;
      } else {
        consulta = `id_ciiu = '${this.conceptForm.value.codCiiu.id_ciiu}' and id_tipo_actividad in (${this.sueloRural.idsTiposActividades})`;
      }
    }

    console.log(consulta)

    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['id_ciiu, tipo_actividad, compatibilidad'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = consulta;
    queryParamas.outSpatialReference = this.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.COMPATIBILIDAD_ACTIVIDAD_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.ciiuItems = [];
          const idsCodigosCiiu = [];

          if (this.featureType === 'URBANO') {
            this.sueloUrbano.compatibilidadCiiu = [];

            for (const feature of results.features) {
              idsCodigosCiiu.push(`'${feature.attributes.id_ciiu}'`);

              this.sueloUrbano.compatibilidadCiiu.push({
                id_ciiu: feature.attributes.id_ciiu,
                tipo_actividad: feature.attributes.tipo_actividad,
                compatibilidad: feature.attributes.compatibilidad
              });
            }
          } else {
            this.sueloRural.compatibilidadCiiu = [];

            for (const feature of results.features) {
              idsCodigosCiiu.push(`'${feature.attributes.id_ciiu}'`);

              this.sueloRural.compatibilidadCiiu.push({
                id_ciiu: feature.attributes.id_ciiu,
                tipo_actividad: feature.attributes.tipo_actividad,
                compatibilidad: feature.attributes.compatibilidad
              });
            }
          }
          // this.getActividadCiiu(idsCodigosCiiu);
        }

        this.loading = false;
      });
  }

  getActividadCiiu(listaCodigos: any) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['*'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = `id_ciiu is not null`;
    queryParamas.outSpatialReference =
      this.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.CIIU_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.ciiuItems = [];

          for (const feature of results.features) {
            this.ciiuItems.push({
              codigo: feature.attributes.ciiu_actividad,
              id_ciiu: feature.attributes.id_ciiu
            });
          }
        }

        this.loading = false;
      });
  }

  filterCiiu(event) {
    const filtered: any[] = [];
    const queryVar = event.query;
    for (const actCiiu of this.ciiuItems) {
      if (actCiiu.codigo.toLowerCase().indexOf(queryVar.toLowerCase()) >= 0) {
        filtered.push(actCiiu);
      }
    }

    this.filteredCiiu = filtered;
  }

  showMessage(message: string, severity: string) {
    this.messageService.clear();
    this.messageService.add({
      severity,
      summary: 'Trámites',
      detail: message
    });
  }

  onReject() {
    this.messageService.clear('c');
  }

}
