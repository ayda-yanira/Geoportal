import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoAfectacionRural {
  main: any;
  code: string;

  maxQueries: number;
  countQueries: number;

  lMargin: number;
  rMargin: number;
  pdfInMM: number;
  pdfMaxWidth: number;
  row: number;

  normaRural: any;
  normaRuralRiesgo: any;

  tableObservaciones = [];
  headerObservaciones = [];
  obsTratamientosrural: any;
  obsSistemaHidrico: any;

  texto4: string;
  texto5: string;
  texto13: string;
  texto18: string;

  constructor(main: any) {
    this.main = main;
  }

  public query(): void {
    this.code = this.main.code;
    this.obsTratamientosrural = null;
    this.tableObservaciones = [];
    this.headerObservaciones = [];
    this.countQueries = 0;
    this.maxQueries = 2;
    this.main.loading = true;
    this.validateCount();
    this.normaRural = this.main.currentFeatures;
    this.getConsultaRiesgoRural();
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
          this.normaRuralRiesgo = results.features;
        }

        let idsCrrObservacion = [];
        for (const feature of this.normaRuralRiesgo) {
          const attributes = feature.attributes;
          if (attributes.id_observacion_riesgo_rural_res) {
            idsCrrObservacion.push(attributes.id_observacion_riesgo_rural_res);
          }
        }
        if (idsCrrObservacion.length > 0) {
          idsCrrObservacion = idsCrrObservacion.filter((item,
            index) => idsCrrObservacion.indexOf(item) === index);
          this.maxQueries++;
          this.getObservacionCRR(idsCrrObservacion);
        }

        let idsObservacionRural = [];
        for (const feature of this.normaRural) {
          const attributes = feature.attributes;
          if (attributes.id_observacion_rural) {
            idsObservacionRural.push(attributes.id_observacion_rural);
          }
        }
        if (idsObservacionRural.length > 0) {
          idsObservacionRural = idsObservacionRural.filter((item,
            index) => idsObservacionRural.indexOf(item) === index);
          this.maxQueries++;
          this.getObservacionesTratamientoRural(idsObservacionRural);
        }

        if (this.concatAttribute(this.normaRural, 'sistema_hidrico') !== 'No aplica') {
          this.maxQueries++;
          this.getObservacionesSistemaHidrico();
        }

        this.validateCount();
      });
  }

  getObservacionCRR(ids) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['id_observacion_riesgo_rural'];
    queryParamas.where = `id_crr_observacion IN ('${ids.join('\',\'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    let idObservacionRiesgoRural = [];
    query
      .executeQueryJSON(environment.OBS_CRR_RURAL_SERVICE, queryParamas)
      .then((results) => {
        this.validateCount();
        if (results.features.length > 0) {
          for (const result of results.features) {
            const attributes = result.attributes;
            idObservacionRiesgoRural.push(attributes.id_observacion_riesgo_rural);
          }
          idObservacionRiesgoRural = idObservacionRiesgoRural.filter((item,
            index) => idObservacionRiesgoRural.indexOf(item) === index);
          this.getObservacionesTratamientoRuralRestringido(idObservacionRiesgoRural);
        }
      });
  }

  getObservacionesTratamientoRural(ids) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_observacion_rural IN ('${ids.join('\',\'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_TRATAMIENTO_RURAL_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.obsTratamientosrural = results.features[0].attributes;
        }
        this.validateCount();
      });
  }

  getObservacionesSistemaHidrico() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `1=1`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_NORMA_RURAL_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.obsSistemaHidrico = results.features[0].attributes.norma_rural;
        }
        this.validateCount();
      });
  }

  getObservacionesTratamientoRuralRestringido(ids) {
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
            this.tableObservaciones.push(attributes);
          }
        }
        this.validateCount();
      });
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

  download(): any {
    const lMargin = 15;
    const rMargin = 15;
    const pdfInMM = 210;

    const doc = new jsPDF();
    this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
    this.main.addFooters(doc);

    doc.setFontSize(6);
    let lines = '';

    this.row = 30;
    doc.setFont(undefined, 'bold');
    doc.text('EL SUSCRITO SUBSECRETARIO DE APLICACIÓN DE NORMAS URBANISTICAS DEL MUNICIPIO DE PASTO',
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 7;
    doc.setFont(undefined, 'normal');
    doc.text(`En atención a la solicitud radicada con consecutivo ${this.main.consecutive}`,
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 7;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('CERTIFICA', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);

    this.row += 7;
    lines = `Que el Plan de Ordenamiento Territorial del Municipio de Pasto – POT, contenido en el Acuerdo 004 del `
      + `2015, clasifica al predio con código catastral No:`;
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 5;
    doc.setFont(undefined, 'bold');
    doc.text(this.main.printCode, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
    this.row += 5;

    const predioNacional = `No. Predial Nacional: ${this.normaRuralRiesgo[0].attributes.codigo_predial_nacional}`;
    doc.text(predioNacional, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 5;

    let direccion = this.normaRural[0].attributes.corregimiento.trim();
    direccion = `ubicado en el Corregimiento de ${direccion}, de la siguiente manera:`;
    lines = doc.splitTextToSize(direccion, pdfInMM - lMargin - rMargin);
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 10;

    const riesgoVolcanico = this.concatAttribute(this.normaRuralRiesgo, 'riesgo_volcanico_ea27');
    const restriccionesFlujosLodo = this.concatAttribute(this.normaRuralRiesgo, 'restricciones_flujos_lodo_ea32');
    const remocionMasa = this.concatAttribute(this.normaRuralRiesgo, 'remocion_en_masa_ea21');
    const subsidencia = this.concatAttribute(this.normaRuralRiesgo, 'subsidencia_ea29');
    const inundacion = this.concatAttribute(this.normaRuralRiesgo, 'inundacion_ea20');
    const lineasAltaTension = this.concatAttribute(this.normaRuralRiesgo, 'lineas_alta_tension_ea31');

    if (riesgoVolcanico !== 'No aplica' || restriccionesFlujosLodo !== 'No aplica' || remocionMasa !== 'No aplica' || subsidencia !== 'No aplica' || inundacion !== 'No aplica' || lineasAltaTension !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `AFECTACIONES`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 4;
      doc.setFont(undefined, 'normal');
    }

    lines = doc.splitTextToSize(
      'Condición de Riesgo Volcánico:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(riesgoVolcanico, 65, this.row, {
      align: 'left',
    });
    this.row += 4;

    lines = doc.splitTextToSize(
      'Restricción por flujos de lodo:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(
      restriccionesFlujosLodo, 65, this.row, {
      align: 'left',
    });
    this.row += 4;

    lines = doc.splitTextToSize(
      'Condición de riesgo por remoción en masa:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(
      remocionMasa, 65, this.row, {
      align: 'left',
    });
    this.row += 4;

    lines = doc.splitTextToSize(
      'Condición de Riesgo Subsidencia:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(
      subsidencia, 65, this.row, {
      align: 'left',
    });
    this.row += 4;

    lines = doc.splitTextToSize(
      'Condición de Riesgo Inundación:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(
      inundacion, 65, this.row, {
      align: 'left',
    });
    this.row += 4;

    lines = doc.splitTextToSize(
      'Líneas Alta Tensión:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(
      lineasAltaTension, 65, this.row, {
      align: 'left',
    });

    let calc = 10;
    let lastRow = this.row;
    if (this.tableObservaciones.length > 0) {
      if (this.row > 250) {
        doc.addPage();
        this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
        this.main.addFooters(doc);
        this.row = 30;
      }

      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        'OBSERVACIONES',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      for (const obs of this.tableObservaciones) {
        lastRow = this.row;
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
          this.main.addFooters(doc);
          this.row = 30;
        } else {
          this.row += calc;
        }
        doc.setFont(undefined, 'bold');
        let title = obs.area_amenaza_riesgo_rural_restr.replace(/(\r\n|\n|\r)/gm, '');
        title = title !== 'Flujo de masa 1 Y 2' ? title : 'Condición de Riesgo Remoción en Masa    ';
        doc.text(title, lMargin, this.row,
          { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        const label = obs.norma_rural_restringido;
        doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        calc = Math.ceil(label.length / 180) * 3;
        calc = calc > 3 ? calc : 6;
      }
    }

    const sistemaHidrico = this.concatAttribute(this.normaRural, 'sistema_hidrico');
    if (sistemaHidrico !== 'No aplica') {
      lastRow = this.row;
      if (this.row > 250) {
        doc.addPage();
        this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
        this.main.addFooters(doc);
        this.row = 30;
      } else {
        this.row += calc;
      }

      doc.setFont(undefined, 'bold');
      doc.text('Ronda Hídrica:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.row += 5;
      doc.setFont(undefined, 'normal');
      doc.text(this.obsSistemaHidrico.replace(/(\r\n|\n|\r)/gm, ''),
        lMargin, this.row, { maxWidth: 185, align: 'justify' });
    }

    if (this.row - lastRow < 10) {
      this.row = this.row + 10 - this.row + lastRow;
    }

    if (this.row > 250) {
      doc.addPage();
      this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
      this.main.addFooters(doc);
      this.row = 30;
    } else {
      this.row += 20;
    }

    lines = `De acuerdo a lo anterior y de conformidad al Artículo 45 y lo contenido en el capítulo II del POT referente a la Gestión del Riesgo, el predio:`;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });

    let restriccion = 'NO TIENE RESTRICCIÓN POR ESTE CONCEPTO.';
    if (riesgoVolcanico.toUpperCase().indexOf('ALTO') > -1 ||
      subsidencia.toUpperCase().indexOf('MEDIO') > -1 ||
      subsidencia.toUpperCase().indexOf('ALTO') > -1) {
      restriccion = 'TIENE RESTRICCIÓN POR ESTE CONCEPTO.';
    }

    this.row += 5;
    doc.setFont(undefined, 'bold');
    doc.text(restriccion, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;
    doc.setFont(undefined, 'normal');

    if (this.row > 250) {
      doc.addPage();
      this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
      this.main.addFooters(doc);
      this.row = 30;
    } else {
      this.row += 10;
    }

    const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const todayString = today.toLocaleDateString('es-ES', options);

    doc.setFont(undefined, 'normal');
    doc.text(
      `Fecha de expedición: ${todayString}`,
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    if (this.row > 250) {
      doc.addPage();
      this.main.addHeaders(doc, 'CCERTIFICACIÓN DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
      this.main.addFooters(doc);
      this.row = 30;
    } else {
      this.row += 10;
    }

    const img = new Image();
    img.src = 'assets/images/Firma.png';
    doc.addImage(img, 'png', 75, this.row, 60, 20);
    this.row += 16;
    doc.setFont(undefined, 'normal');
    doc.text(
      this.main.SUBSECREATRIO_NOMBRE,
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );
    this.row += 5;
    doc.text(
      'Subsecretario de Aplicación de Normas Urbanísticas',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    doc.setFontSize(4);
    this.row += 4;
    doc.text('El documento idóneo para los trámites para licencia de construcción ante curaduría urbana es el '
      + 'concepto de norma urbanística (Decreto 1077 de 2015).',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      });

    doc.setFontSize(6);
    this.row += 4;
    doc.text('Para su validez este documento requiere estampillas según lo estipulado en el Estatuto Tributario ' +
      'Municipal. Salvo en las acepciones contempladas en el mismo.',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      });

    this.row += 25;
    doc.setFont(undefined, 'normal');
    const notaTexto = 'Nota: Cualquier inquietud u observación de este documento generado desde esta plataforma '
      + 'dirigirse al correo electrónico unidaddecorrespondencia@pasto.gov.co';
    doc.text(notaTexto.replace(/(\r\n|\n|\r)/gm, ''),
      lMargin, this.row, { maxWidth: 185, align: 'justify' });

    return doc.output('blob');
  }

  validateCount() {
    this.countQueries++;
    if (this.countQueries === this.maxQueries) {
      this.main.loading = false;
    }
  }

}
