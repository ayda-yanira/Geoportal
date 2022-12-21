import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoAfectacionRuralRes {
  main: any;
  atributosNorma: any;
  atributosRiesgoRural: any;
  atributosObservaciones: any;
  atributosObservacionesRiesgo: any;
  code: string;

  lMargin = 15;
  rMargin = 15;
  pdfInMM = 210;
  pdfMaxWidth: number;

  maxQueries: number;
  countQueries: number;

  tablaMitad: boolean;
  row: number;

  constructor(main: any) {
    this.main = main;
    this.tablaMitad = false;
  }

  public query(): void {
    this.code = this.main.code;
    this.tablaMitad = false;
    this.countQueries = 0;
    this.maxQueries = 2;
    this.main.loading = true;
    this.validateCount();
    this.getConsultaNormaRuralRestringido();
  }

  getConsultaNormaRuralRestringido(): void {
    this.code = this.main.code;
    this.main.maxQueries = 2;
    this.main.loading = true;

    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `codigo_anterior = '${this.code}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(
        environment.NORMA_RURAL_RESTRINGIDO_SERVICE,
        queryParamas
      )
      .then((results) => {
        if (results.features.length > 0) {
          this.atributosNorma = results.features;
          this.validateCount();
          this.getConsultaRiesgoRural();
        } else {
          this.atributosNorma = null;
          this.main.loading = false;
        }
      });
  }

  getConsultaRiesgoRural() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `codigo_predial_anterior = '${this.code}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.RIESGO_RURAL_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.atributosRiesgoRural = results.features;
        }

        let idsObservacionRiesgoRuralRes = [];
        for (const feature of this.atributosNorma) {
          const attributes = feature.attributes;
          if (attributes.id_observacion_rural_restringid) {
            idsObservacionRiesgoRuralRes.push(attributes.id_observacion_rural_restringid);
          }
        }
        if (idsObservacionRiesgoRuralRes.length > 0) {
          idsObservacionRiesgoRuralRes = idsObservacionRiesgoRuralRes.filter((item,
            index) => idsObservacionRiesgoRuralRes.indexOf(item) === index);
          this.maxQueries++;
          this.getObservacionesTratamientoRural(idsObservacionRiesgoRuralRes);
          this.maxQueries++;
          this.getObservacionesRiesgoTratamientoRural(idsObservacionRiesgoRuralRes);
        }

        this.main.validatCount();
        this.main.loading = false;
      });
  }

  getObservacionesTratamientoRural(ids) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_observacion_riesgo_rural_res IN ('${ids.join('\',\'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_TRATAMIENTO_RIESGO_RURAL_RESTRINGIDO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.atributosObservacionesRiesgo = results.features;
        }
        this.main.validatCount();
      });
  }

  getObservacionesRiesgoTratamientoRural(ids) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_observacion_rural_restringid IN ('${ids.join('\',\'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_TRATAMIENTO_RURAL_RESTRINGIDO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.atributosObservaciones = results.features;
        }
        this.main.validatCount();
      });
  }

  public download(): any {
    this.main.loading = true;
    const lMargin = 15;
    const rMargin = 15;
    const pdfInMM = 210;

    const doc = new jsPDF();
    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
    this.main.addFooters(doc);

    doc.setFontSize(6);
    this.row = 30;
    let lines = '';

    doc.setFont(undefined, 'bold');
    doc.text('CONCEPTO DE NORMA URBANÍSTICA', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 3;
    doc.text('Suelo Rural de Desarrollo Restringido', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
    this.row += 10;
    doc.text(`De acuerdo a lo establecido en el Acuerdo 004 del 14 de abril de 2015, por medio del cual se adopta el Plan de Ordenamiento Territorial del Municipio de Pasto 2015 - 2027 PASTO TERRITORIO CON - SENTIDO y con el Código catastral No.:`, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;

    doc.setFont(undefined, 'bold');
    doc.text(this.main.printCode, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
    this.row += 5;

    const predioNacional = `No. Predial Nacional: ${this.atributosNorma[0].attributes.codigo_predial_nacional}`;
    doc.text(predioNacional, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 5;

    let direccion = this.atributosNorma[0].attributes.corregimiento.trim();
    direccion = `CORREGIMIENTO ${direccion}.`;
    lines = doc.splitTextToSize(direccion, pdfInMM - lMargin - rMargin);
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 10;

    lines = doc.splitTextToSize(
      'En el Municipio de Pasto, se clasifica de la siguiente manera:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 8;

    lines = doc.splitTextToSize('Clase de suelo:', pdfInMM - lMargin - rMargin);
    doc.text(lines, lMargin, this.row);
    doc.text(this.atributosNorma[0].attributes.clase_suelo, 55, this.row, {
      align: 'left',
    });
    this.row += 4;
    lines = doc.splitTextToSize(
      'Unidad territorial:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(this.atributosNorma[0].attributes.unidad_territorial, 55, this.row, {
      align: 'left',
    });
    this.row += 8;

    this.addTextoCentrado(doc, this.row, 'AFECTACIONES', true);
    this.row += 6;
    this.addAfectacion(doc, 'Áreas de la estructura ecológica municipal', this.atributosNorma, 'areas_de_la_estructura_ecologic');
    this.addAfectacion(doc, 'Condición de riesgo Alto', this.atributosNorma, 'condicion_de_riesgo_alto');
    this.addAfectacion(doc, 'Condición de Riesgo Remoción Masa', this.atributosRiesgoRural, 'remocion_en_masa_ea19');
    this.addAfectacion(doc, 'Condición de Riesgo Volcánico', this.atributosRiesgoRural, 'riesgo_volcanico_ea27');
    this.addAfectacion(doc, 'Condición de Riesgo Subsidencia', this.atributosRiesgoRural, 'subsidencia_ea29');
    this.addAfectacion(doc, 'Línea de Alta Tensión', this.atributosRiesgoRural, 'lineas_alta_tension_ea31');
    this.row += 10;

    this.addTextoCentrado(doc, this.row, 'OBSERVACIONES', true);
    this.row += 6;
    this.addAfectacion(doc, 'Riesgo por inundación - Medio', this.atributosObservacionesRiesgo, 'area_amenaza_riesgo_rural_restr');
    this.addAfectacion(doc, 'Riesgo por inundación - Alto', this.atributosObservacionesRiesgo, 'area_amenaza_riesgo_rural_restr');
    this.addAfectacion(doc, 'Condición de Riesgo Remoción Masa', this.atributosObservacionesRiesgo, 'area_amenaza_riesgo_rural_restr');
    this.addAfectacion(doc, 'Condición de Riesgo Volcánico', this.atributosObservacionesRiesgo, 'area_amenaza_riesgo_rural_restr');
    this.addAfectacion(doc, 'Condición de Riesgo Subsidencia', this.atributosObservacionesRiesgo, 'area_amenaza_riesgo_rural_restr');
    this.addAfectacion(doc, 'Línea alta tensión', this.atributosObservacionesRiesgo, 'area_amenaza_riesgo_rural_restr');
    this.row += 10;

    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
    this.main.addFooters(doc);

    this.main.loading = false;

    return doc.output('blob');
  }

  getArrayFiltrado(lista: any, inicio: number, fin: number) {
    const nuevaLista = [];
    let i = 0;

    for (const item of lista) {
      if (i >= inicio && i < fin) {
        nuevaLista.push(item);
      }

      i += 1;
    }

    return nuevaLista;
  }

  addTextoCentrado(doc: any, row: number, texto: string, isBold: boolean): void {
    if (isBold) {
      doc.setFont(undefined, 'bold');
    }

    doc.text(texto, doc.internal.pageSize.width / 2, row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
  }

  addTextoJustificado(doc: any, row: number, texto: string): void {
    const lines = doc.splitTextToSize(texto, this.pdfMaxWidth);
    doc.text(lines, this.lMargin, row, { align: 'justify', maxWidth: this.pdfMaxWidth });
  }

  addTextoConValor(doc: any, row: number, textoLabel: string, textoValor?: string, isBold?: boolean, col?: number): void {
    let valCol = 55;

    if (isBold) {
      doc.setFont(undefined, 'bold');
    }

    if (col) {
      valCol = col;
    }

    const lines = doc.splitTextToSize(textoLabel + ':', this.pdfMaxWidth);
    doc.text(lines, this.lMargin, row);
    doc.text(textoValor, valCol, row, {
      align: 'left',
    });
    doc.setFont(undefined, 'normal');
  }

  addTabla(doc: any, row: number, datoHeader: string, datoValor: string): void {
    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
      headStyles: { col1: { halign: 'center' } },
      theme: 'grid',
      columns: [
        { header: datoHeader, dataKey: 'col1' }
      ],
      body: [
        { col1: datoValor }
      ],
      startY: row
    });
  }

  validateCount() {
    this.countQueries++;
    console.log(this.countQueries);
    if (this.countQueries === this.maxQueries) {
      this.main.loading = false;
    }
  }

  concatAttribute(features, attribute) {
    let result = [];
    for (const feature of features) {
      result.push(feature.attributes[attribute]);
    }

    result = result = result.filter((item,
      idx) => result.indexOf(item) === idx);

    if (result.length > 1) {
      result = result.filter((value) => {
        return value !== 'No aplica';
      });
    }

    return result.join(' - ');
  }

  addAfectacion(doc: any, title: string, features: any, attribute: string): void {
    const value = this.concatAttribute(features, attribute);
    const label = doc.splitTextToSize(
      title,
      this.pdfInMM - this.lMargin - this.rMargin
    );
    doc.text(label, this.lMargin, this.row);
    doc.text(value, 65, this.row, {
      align: 'left',
    });
    this.row += 4;
  }

}
