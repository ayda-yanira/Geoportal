import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoAfectacionUrbana {
  main: any;
  code: string;

  maxQueries: number;
  countQueries: number;

  lMargin: number;
  rMargin: number;
  pdfInMM: number;
  pdfMaxWidth: number;
  row: number;

  tratamientosUbanisiticos: any;
  obsTratamientosUbanisiticos: any;
  tableDataRiesgo = [];
  obsRiesgosUrbanos = [];
  obsAfectaciones: any;
  texto11: string;
  texto13: string;
  texto18: string;

  constructor(main: any) {
    this.main = main;
  }

  public query(): void {
    this.code = this.main.code;
    this.countQueries = 0;
    this.maxQueries = 2;
    this.main.loading = true;

    this.tableDataRiesgo = [];
    this.obsRiesgosUrbanos = [];
    this.obsAfectaciones = null;
    this.texto11 = null;
    this.texto13 = null;
    this.texto18 = null;

    this.validateCount();
    this.tratamientosUbanisiticos = this.main.currentFeatures[0].attributes;
    this.getConsultaRiesgoUrbano();
    this.getTextTratamientosUbanisiticos();
  }

  getConsultaRiesgoUrbano() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `codigo_predial_anterior = '${this.code}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.RIESGO_URBANO_SERVICE, queryParamas)
      .then((results) => {
        this.validateCount();
        if (results.features.length > 0) {
          this.obsAfectaciones = results.features;
          for (const result of results.features) {
            const attributes = result.attributes;
            this.tableDataRiesgo.push(attributes.id_cru_observacion);
          }
          this.tableDataRiesgo = this.tableDataRiesgo = this.tableDataRiesgo.filter((item,
            idx) => this.tableDataRiesgo.indexOf(item) === idx);
          this.getObservacionCRU();
        }
      });
  }

  getObservacionCRU() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_cru_observacion IN ('${this.tableDataRiesgo.join('\',\'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    this.tableDataRiesgo = [];
    query
      .executeQueryJSON(environment.OBS_CRU_URBANO, queryParamas)
      .then((results) => {
        this.validateCount();
        if (results.features.length > 0) {
          for (const result of results.features) {
            const attributes = result.attributes;
            this.tableDataRiesgo.push(attributes.id_observacion_riesgo_urbana);
          }
          this.getObsRiesgosUrbanos();
        }
      });
  }

  getObsRiesgosUrbanos() {
    if (this.tratamientosUbanisiticos.afectacion_por_ronda_hidrica !== 'No aplica') {
      this.tableDataRiesgo.push('11');
    }
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_observacion_riesgo_urbano IN ('${this.tableDataRiesgo.join('\',\'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_RIESGO_URBANO_SERVICE, queryParamas)
      .then((results) => {
        this.validateCount();
        if (results.features.length > 0) {
          for (const result of results.features) {
            const attributes = result.attributes;
            this.obsRiesgosUrbanos.push(attributes);
          }
        }
      });
  }

  getTextTratamientosUbanisiticos() {
    const direccion = this.tratamientosUbanisiticos.direccion.trim();
    this.texto11 = `PREDIO LOCALIZADO en ${direccion}.`;
    this.getTipoTratamiento(
      this.tratamientosUbanisiticos.id_tipo_tratamiento
    );
    this.getObservacionesTratamientoUrbano(this.tratamientosUbanisiticos.id_observacion_tratamieto_urban);
  }

  getTipoTratamiento(tipoTratamiento) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['tipo_tratamiento'];
    queryParamas.where = `id_tipo_tratamiento = '${tipoTratamiento}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.TIPO_TRATAMIENTO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          const attributes = results.features[0].attributes;
          this.tratamientosUbanisiticos._tipoTratamiento =
            attributes.tipo_tratamiento;
          this.tratamientosUbanisiticos._tipoTratamiento += ' ' + this.tratamientosUbanisiticos.tratamiento_urbanistico;
        }
      });
  }

  getObservacionesTratamientoUrbano(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_observacion_tratamiento_urba = '${id}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_TRATAMIENTO_URBANO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.obsTratamientosUbanisiticos = results.features[0].attributes;
        }
        this.validateCount();
      });
  }

  download(): any {
    const lMargin = 15;
    const rMargin = 15;
    const pdfInMM = 210;

    const doc = new jsPDF();
    this.main.addHeaders(doc, 'CERTIFICACI??N DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
    this.main.addFooters(doc);
    doc.setFontSize(6);
    this.row = 30;
    let lines = '';

    doc.setFont(undefined, 'bold');
    doc.text('EL SUSCRITO SUBSECRETARIO DE APLICACI??N DE NORMAS URBANISTICAS DEL MUNICIPIO DE PASTO',
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 7;
    doc.setFont(undefined, 'normal');
    doc.text(`En atenci??n a la solicitud radicada con consecutivo ${this.main.consecutive}`,
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

    if (
      this.tratamientosUbanisiticos.zava_t_269_de_2015 ===
      'Predio en ZAVA sentencia T-269 de 2015'
    ) {
      lines = `Que el predio con c??digo n??mero ${this.code} TIENE UNA RESTRICCI??N que suspende ` +
        `actuaciones urban??sticas como licencias de construcci??n ante curadur??as urbanas en cumplimiento a lo ` +
        `ordenado en la Sentencia T269-2015 del Consejo de Estado, mientras se materializa el procedimiento de revisi??n y ` +
        `modificaci??n del componente de gesti??n del riesgo de desastre del POT.`;
      doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.row += 10;
    }

    lines = `Que el Plan de Ordenamiento Territorial del Municipio de Pasto ??? POT, contenido en el Acuerdo 004 del `
      + `2015, clasifica al predio con c??digo catastral No:`;
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

    const predioNacional = `No. Predial Nacional: ${this.tratamientosUbanisiticos.codigo_predial_nacional}`;
    doc.text(predioNacional, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 5;

    doc.text('ubicado en el Municipio de Pasto, de la siguiente manera:', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 7;

    if (!this.obsAfectaciones) {
      this.main.showMessage('Error al ejecutar la consulta, intente nuevamente', 'warn');
      this.main.loading = false;
    }

    if (this.obsAfectaciones.length > 0) {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        'AFECTACIONES',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });

      let valueObs = this.concatAttribute(this.obsAfectaciones, 'riesgo_volcanico_ea27');
      doc.setFont(undefined, 'bold');
      this.row += 8;
      doc.text('Condici??n de Riesgo Volc??nico:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'flujos_de_lodo_ea22');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condici??n de Riesgo Flujos de lodo:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'restricciones_por_lujos_de_lodo');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Restricci??n por flujos de lodo (Sector):', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'remocion_en_masa_ea19');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condici??n de Riesgo Remoci??n en Masa:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Ronda H??drica:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(this.tratamientosUbanisiticos.afectacion_por_ronda_hidrica.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'subsidencia_ea29');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condici??n de Riesgo Subsidencia:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'inundacion_ea23');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condici??n de Riesgo Inundaci??n:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'servidumbre_de_lineas_de_alta_t');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('L??neas Alta Tensi??n:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);
    }

    if (this.obsRiesgosUrbanos.length > 0) {
      if (this.row > 250) {
        this.newPage(doc, 30);
      } else {
        this.row += 15;
      }

      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        'OBSERVACIONES',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });

      let lastRow = this.row;
      const riesgoVolcanico = this.concatAttribute(this.obsAfectaciones, 'riesgo_volcanico_ea27');
      for (const obs of this.obsRiesgosUrbanos) {
        if (obs.afectacion_urbanistica.toUpperCase().trim().indexOf('VOLC??NICO') < 0 ||
          (obs.afectacion_urbanistica.toUpperCase().trim().indexOf('VOLC??NICO') >= 0 &&
            obs.norma_urbana.toUpperCase().indexOf('91') >= 0) ||
          (obs.afectacion_urbanistica.toUpperCase().trim().indexOf('VOLC??NICO') >= 0 &&
            obs.norma_urbana.toUpperCase().indexOf('250') >= 0 &&
            riesgoVolcanico.toUpperCase().indexOf('LODO') >= 0)) {
          lastRow = this.row;
          doc.setFont(undefined, 'bold');
          const title = obs.afectacion_urbanistica === 'Flujo de masa' ? 'Condici??n de Riesgo Remoci??n en Masa'
            : obs.afectacion_urbanistica;
          doc.text(title.replace(/(\r\n|\n|\r)/gm, ''), lMargin, this.row, { maxWidth: 185, align: 'justify' });
          this.row += 5;
          doc.setFont(undefined, 'normal');
          const label = obs.norma_urbana;
          doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
            lMargin, this.row, { maxWidth: 185, align: 'justify' });
          let calc = Math.ceil(label.length / 180) * 2.5;
          calc = calc > 3 ? calc : 6;

          this.row += calc;
          console.log(this.row);
          if (this.row > 250) {
            this.newPage(doc, 30);
          }
        }
      }

      if (this.row - lastRow < 10) {
        this.row = this.row + 10 - this.row + lastRow;
      }
    }

    if (this.row > 250) {
      this.newPage(doc, 30);
    }

    lines = `De acuerdo a lo anterior y de conformidad al Art??culo 45 y lo contenido en el cap??tulo II del POT referente a la Gesti??n del Riesgo, el predio:`;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;
    doc.setFont(undefined, 'bold');

    let restriccion = 'NO TIENE RESTRICCI??N POR ESTE CONCEPTO.';
    if (this.concatAttribute(this.obsAfectaciones, 'riesgo_volcanico_ea27').toUpperCase().indexOf('ALTO') > -1 ||
      this.concatAttribute(this.obsAfectaciones, 'subsidencia_ea29').toUpperCase().indexOf('MEDIO') > -1 ||
      this.concatAttribute(this.obsAfectaciones, 'subsidencia_ea29').toUpperCase().indexOf('ALTO') > -1) {
      restriccion = 'TIENE RESTRICCI??N POR ESTE CONCEPTO.';
    }

    doc.text(restriccion, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;
    doc.setFont(undefined, 'normal');

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 10;
    }

    const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const todayString = today.toLocaleDateString('es-ES', options);

    doc.text(
      `Fecha de expedici??n: ${todayString}`,
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 10;
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
      'Subsecretario de Aplicaci??n de Normas Urban??sticas',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    doc.setFontSize(4);
    this.row += 4;
    doc.text('El documento id??neo para los tr??mites para licencia de construcci??n ante curadur??a urbana es el '
      + 'concepto de norma urban??stica (Decreto 1077 de 2015).',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      });

    doc.setFontSize(6);
    this.row += 4;
    doc.text('Para su validez este documento requiere estampillas seg??n lo estipulado en el Estatuto Tributario ' +
      'Municipal. Salvo en las acepciones contempladas en el mismo.',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      });

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 25;
    }
    doc.setFont(undefined, 'normal');
    const notaTexto = 'Nota: Cualquier inquietud u observaci??n de este documento generado desde esta plataforma '
      + 'dirigirse al correo electr??nico unidaddecorrespondencia@pasto.gov.co';
    doc.text(notaTexto.replace(/(\r\n|\n|\r)/gm, ''),
      lMargin, this.row, { maxWidth: 185, align: 'justify' });

    this.main.addHeaders(doc, 'CERTIFICACI??N DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
    this.main.addFooters(doc);

    return doc.output('blob');
  }

  getCalc(doc, label: string) {
    let calc = Math.ceil(label.length / 180) * 3;
    calc = calc > 3 ? calc : 6;
    this.row += calc;
    if (this.row > 250) {
      this.newPage(doc, 30);
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

  newPage(doc, value) {
    doc.addPage();
    this.main.addHeaders(doc, 'CERTIFICACI??N DE PRESENCIA DE RIESGOS Y RESTRICCIONES');
    this.main.addFooters(doc);
    this.row = value;
  }

  validateCount() {
    this.countQueries++;
    console.log(this.countQueries);
    if (this.countQueries === this.maxQueries) {
      this.main.loading = false;
    }
  }

}
