import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoNormaUrbanisticaRuralRes {
  main: any;
  atributosNorma: any;
  atributosRiesgoRural: any;
  atributosObservaciones: any;
  atributosObservacionesRiesgo: any;
  code: string;

  maxQueries: number;
  countQueries: number;

  lMargin: number;
  rMargin: number;
  pdfInMM: number;
  pdfMaxWidth: number;
  row: number;

  constructor(main: any) {
    this.main = main;
    this.lMargin = 15;
    this.rMargin = 15;
    this.pdfInMM = 210;
  }

  public query(): void {
    this.code = this.main.code;
    this.countQueries = 0;
    this.maxQueries = 2;
    this.atributosObservaciones = [];
    this.atributosObservacionesRiesgo = [];
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
    queryParamas.where = `Codigo_anterior = '${this.code}'`;
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

        this.validateCount();
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
          for (const result of results.features) {
            const attributes = result.attributes;
            this.atributosObservacionesRiesgo.push(attributes);
          }
        }
        this.validateCount();
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
        this.validateCount();
      });
  }

  public download(): any {
    this.pdfMaxWidth = this.pdfInMM - this.lMargin - this.rMargin;
    const doc = new jsPDF();
    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
    this.main.addFooters(doc);

    doc.setFontSize(6);
    this.row = 30;

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
    doc.text(`De acuerdo a lo establecido en el Acuerdo 004 del 14 de abril de 2015, por medio del cual se adopta el Plan de Ordenamiento Territorial del Municipio de Pasto 2015 - 2027 PASTO TERRITORIO CON - SENTIDO y con el Código catastral No.:`, this.lMargin, this.row, { maxWidth: 185, align: 'justify' });
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

    this.addTextoCentrado(doc, this.row, 'En el Municipio de Pasto, se clasifica de la siguiente manera:', false);
    this.row += 8;

    this.addTextoConValor(doc, this.row, 'Clase de suelo', this.atributosNorma[0].attributes.clase_suelo);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Categoría de desarrollo restringido',
      this.atributosNorma[0].attributes.categoria_de_desarrollo_restrin);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Subcategoría', this.atributosNorma[0].attributes.subcategoria);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Unidad territorial', this.atributosNorma[0].attributes.unidad_territorial);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Localización', this.atributosNorma[0].attributes.localizacion);
    this.row += 10;

    this.addTextoCentrado(doc, this.row, 'NORMAS URBANÍSTICAS GENERALES', true);
    this.row += 10;
    this.addTextoConValor(doc, this.row, 'Actuación de Edificación', '', true);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Índice de Construcción',
      this.atributosNorma[0].attributes.indice_de_construccion);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Índice de Ocupación',
      this.atributosNorma[0].attributes.indice_de_ocupacion);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Altura Máxima Permitida',
      this.atributosNorma[0].attributes.altura_maxima_permitida);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Cesión en Edificación',
      this.atributosNorma[0].attributes.cesion_en_edificacion);
    this.row += 10;

    this.addTextoConValor(doc, this.row, 'Actuación de Parcelación', '', true);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Aplicabilidad norma de parcelación',
      this.atributosNorma[0].attributes.aplicabilidad_norma_de_parcelac, false, 75);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Unidad mínima de actuación en procesos de parcelación',
      this.atributosNorma[0].attributes.unidad_minima_de_actuacion_en_p, false, 75);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Área mínima del predio resultado del proceso de parcelación',
      this.atributosNorma[0].attributes.area_minima_del_predio_resultad, false, 75);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Cesión de espacio público',
      this.atributosNorma[0].attributes.cesion_de_espacio_publico, false, 75);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Cesión de vías',
      this.atributosNorma[0].attributes.cesion_de_vias, false, 75);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Cesión de equipamientos',
      this.atributosNorma[0].attributes.cesion_de_equipamientos, false, 75);
    this.row += 4;
    this.addTextoConValor(doc, this.row, 'Densidad aplicable',
      this.atributosNorma[0].attributes.densidad_aplicable, false, 75);
    this.row += 10;

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
    this.row += 4;
    this.addObservacion(doc, 'C1 Cargas urbanística:', this.atributosObservaciones, 'c1_cargas_urbanisticas');
    this.addObservacion(doc, 'A1 aplicación edificabilidad:', this.atributosObservaciones, 'a1_aplicacion_edificabilidad');
    this.addObservacion(doc, 'A2 aplicación edificabilidad:', this.atributosObservaciones, 'a2_aplicacion_edificabilidad');
    this.addObservacion(doc, 'A3 aplicación edificabilidad:', this.atributosObservaciones, 'a3_aplicacion_edificabilidad');
    this.addObservacion(doc, 'N1 Normas complementarias:', this.atributosObservaciones, 'n1_normas_complementarias');
    this.addObservacion(doc, 'N2 Normas complementarias:', this.atributosObservaciones, 'n2_normas_complementarias');
    this.addObservacion(doc, 'A Normas ambientales:', this.atributosObservaciones, 'a_normas_ambientales');

    if (this.atributosObservacionesRiesgo.length > 0) {
      const riesgosVolcanicos = [];
      for (const obs of this.atributosObservacionesRiesgo) {
        doc.setFont(undefined, 'bold');
        doc.text(obs.area_amenaza_riesgo_rural_restr.replace(/(\r\n|\n|\r)/gm, '') + ':',
          this.lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        const label = obs.norma_rural_restringido;
        doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
          this.lMargin, this.row, { maxWidth: 185, align: 'justify' });
        let calc = Math.ceil(label.length / 180) * 3;
        calc = calc > 3 ? calc : 6;
        this.row += calc;
        if (this.row > 250) {
          this.newPage(doc, 30);
        }
      }
    }

    const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const todayString = today.toLocaleDateString('es-ES', options);

    doc.text(
      `Fecha de expedición: ${todayString}`,
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 8;
    }

    const img = new Image();
    img.src = 'assets/images/Firma.png';
    doc.addImage(img, 'png', 75, this.row, 60, 20);
    this.row += 16;
    doc.text(
      this.main.SUBSECREATRIO_NOMBRE,
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );
    this.row += 4;
    doc.text(
      'Subsecretario de Aplicación de Normas Urbanísticas',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 25;
    }
    doc.setFont(undefined, 'normal');
    const notaTexto = 'Nota: Cualquier inquietud u observación de este documento generado desde esta plataforma '
      + 'dirigirse al correo electrónico unidaddecorrespondencia@pasto.gov.co';
    doc.text(notaTexto.replace(/(\r\n|\n|\r)/gm, ''),
      this.lMargin, this.row, { maxWidth: 185, align: 'justify' });

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

    doc.text(texto, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
  }

  addTextoJustificado(doc: any, row: number, texto: string): void {
    const lines = doc.splitTextToSize(texto, this.pdfMaxWidth);
    doc.text(lines, this.lMargin, this.row, { align: 'justify', maxWidth: this.pdfMaxWidth });
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
    doc.text(textoValor, valCol, this.row, {
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

  addAfectacion(doc: any, title: string, features: any, attribute: string): void {
    const value = this.concatAttribute(features, attribute);
    const label = doc.splitTextToSize(
      title,
      this.pdfInMM - this.lMargin - this.rMargin
    );
    doc.text(label + ':', this.lMargin, this.row);
    doc.text(value, 75, this.row, {
      align: 'left',
    });
    this.row += 4;
  }

  addObservacion(doc: any, title: string, features: any, attribute: string): void {
    const value = this.concatAttribute(features, attribute);
    if (value.toUpperCase() !== 'NO APLICA') {
      const label = doc.splitTextToSize(
        title,
        this.pdfInMM - this.lMargin - this.rMargin
      );
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', this.lMargin, this.row);
      this.row += 4;
      doc.setFont(undefined, 'normal');
      doc.text(value.replace(/(\r\n|\n|\r)/gm, ''),
        this.lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.getCalc(doc, value);
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

    return result.join(' - ') ? result.join(' - ') : 'No aplica';
  }

  getCalc(doc, label: string) {
    let calc = Math.ceil(label.length / 180) * 3;
    calc = calc > 3 ? calc : 6;
    this.row += calc;
    if (this.row > 250) {
      this.newPage(doc, 30);
    }
  }

  newPage(doc, value) {
    doc.addPage();
    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
    this.main.addFooters(doc);
    this.row = value;
  }

}
