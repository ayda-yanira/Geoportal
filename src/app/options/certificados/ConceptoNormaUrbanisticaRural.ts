import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoNormaUrbanisticaRural {
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

  allowDownload: boolean;

  constructor(main: any) {
    this.main = main;
    this.lMargin = 15;
    this.rMargin = 15;
    this.pdfInMM = 210;
  }

  public query(): void {
    this.allowDownload = false;
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

          const riesgoVolcanico = this.concatAttribute(this.normaRuralRiesgo, 'riesgo_volcanico_ea27');
          const restriccionesFlujosLodo = this.concatAttribute(this.normaRuralRiesgo, 'restricciones_flujos_lodo_ea32');
          const remocionMasa = this.concatAttribute(this.normaRuralRiesgo, 'remocion_en_masa_ea21');
          const subsidencia = this.concatAttribute(this.normaRuralRiesgo, 'subsidencia_ea29');
          const inundacion = this.concatAttribute(this.normaRuralRiesgo, 'inundacion_ea20');
          const lineasAltaTension = this.concatAttribute(this.normaRuralRiesgo, 'lineas_alta_tension_ea31');

          if (riesgoVolcanico !== 'No aplica' || restriccionesFlujosLodo !== 'No aplica' || remocionMasa !== 'No aplica' ||
            subsidencia !== 'No aplica' || inundacion !== 'No aplica' || lineasAltaTension !== 'No aplica') {
            this.allowDownload = true;
          }
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
    doc.text('Suelo Rural', doc.internal.pageSize.width / 2, this.row, {
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

    const predioNacional = `No. Predial Nacional: ${this.normaRuralRiesgo[0].attributes.codigo_predial_nacional}`;
    doc.text(predioNacional, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 5;

    let direccion = this.normaRural[0].attributes.corregimiento.trim();
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
    doc.text(this.normaRural[0].attributes.clase_suelo, 55, this.row, {
      align: 'left',
    });
    this.row += 4;
    lines = doc.splitTextToSize(
      'Unidad territorial:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(this.normaRural[0].attributes.unidad_territorial, 55, this.row, {
      align: 'left',
    });
    this.row += 8;

    const estructuraEcologicaPrincipal = this.concatAttribute(this.normaRural, 'estructura_ecologica_principal');
    const tipoAreaProtegida = this.concatAttribute(this.normaRural, 'tipo_de_area_protegida');
    const nombreAreaProtegida = this.concatAttribute(this.normaRural, 'nombre_del_area_protegida');
    const clasificacionCorredorEcologic = this.concatAttribute(this.normaRural, 'clasificacion_corredor_ecologic');

    if (estructuraEcologicaPrincipal !== 'No aplica' || tipoAreaProtegida !== 'No aplica' || nombreAreaProtegida !== 'No aplica'
      || clasificacionCorredorEcologic !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `CATEGORIAS DE PROTECCIÓN EN SUELO RURAL`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 4;
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `ÁREAS DE CONSERVACIÓN Y PROTECCIÓN AMBIENTAL`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 6;
      doc.setFont(undefined, 'normal');
    }

    if (estructuraEcologicaPrincipal !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Estructura ecológica municipal:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(estructuraEcologicaPrincipal, 55, this.row, {
        align: 'left',
      });
      this.row += 4;
    }

    if (tipoAreaProtegida !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Tipo de área protegida:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(tipoAreaProtegida, 55, this.row, {
        align: 'left',
      });
      this.row += 4;
    }

    if (nombreAreaProtegida !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Nombre del área protegida:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        nombreAreaProtegida,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 4;
    }

    if (clasificacionCorredorEcologic !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Clasificación del Corredor ecológico:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        clasificacionCorredorEcologic,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 4;
    }

    const zfa = this.concatAttribute(this.normaRural, 'zonificacion_zfa_galeras_o_rams');
    const sistemaHidrico = this.concatAttribute(this.normaRural, 'sistema_hidrico');
    const sueloEnCota = this.concatAttribute(this.normaRural, 'suelo_en_cota_superior_a_3000_m');
    const areaPublicaPrivadas = this.concatAttribute(this.normaRural, 'areas_publicas_y_privadas');

    if (zfa !== 'No aplica' || sistemaHidrico !== 'No aplica' || sueloEnCota !== 'No aplica'
      || areaPublicaPrivadas !== 'No aplica') {

      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        'Áreas de especial importancia ecosistémica:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);;
      this.row += 4;
      doc.setFont(undefined, 'normal');
    }

    if (zfa !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Zonificación ZFA Galeras o Ramsar:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        zfa,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 4;
    }

    if (sistemaHidrico !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Sistema hídrico:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        sistemaHidrico,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 4;
    }

    if (sueloEnCota !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Suelo en cota superior a 3000 msnm:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        sueloEnCota,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 4;
    }

    if (areaPublicaPrivadas !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        'Áreas de calidad ambiental y paisajística:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);;
      this.row += 4;
      doc.setFont(undefined, 'normal');
      lines = doc.splitTextToSize(
        'Áreas publicas y privadas:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        areaPublicaPrivadas,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 4;
    }

    this.row += 4;

    const areasAgrico = this.concatAttribute(this.normaRural, 'areas_para_la_produccion_agrico');
    if (areasAgrico !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `ÁREAS PARA LA PRODUCCIÓN AGRÍCOLA, GANADERA Y DE EXPLOTACIÓN DE RECURSOS NATURALES`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 4;
      doc.setFont(undefined, 'normal');
      lines = doc.splitTextToSize(
        'Clasificación de áreas destinadas a la producción:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text
        (areasAgrico, 65, this.row, {
          align: 'left',
        });
      this.row += 8;
    }

    const areasInmuebles = this.concatAttribute(this.normaRural, 'areas_inmuebles_consideradas_pa');
    if (areasInmuebles !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `ÁREAS E INMUEBLES CONSIDERADAS COMO PATRIMONIO CULTURA`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 4;
      doc.setFont(undefined, 'normal');
      lines = doc.splitTextToSize(
        'Clasificación de áreas destinadas a la producción:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        areasInmuebles, 65, this.row, {
        align: 'left',
      });
      this.row += 8;
    }

    const areasServicios = this.concatAttribute(this.normaRural, 'areas_del_sistema_de_servicios_');
    if (areasServicios !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `ÁREAS DEL SISTEMA DE SERVICIOS PÚBLICOS DOMICILIARIOS`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 4;
      doc.setFont(undefined, 'normal');
      lines = doc.splitTextToSize(
        'Clasificación de áreas destinadas a la producción:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        areasServicios, 65, this.row, {
        align: 'left',
      });
      this.row += 8;
    }

    const riesgoVolcanico = this.concatAttribute(this.normaRuralRiesgo, 'riesgo_volcanico_ea27');
    const restriccionesFlujosLodo = this.concatAttribute(this.normaRuralRiesgo, 'restricciones_flujos_lodo_ea32');
    const remocionMasa = this.concatAttribute(this.normaRuralRiesgo, 'remocion_en_masa_ea21');
    const subsidencia = this.concatAttribute(this.normaRuralRiesgo, 'subsidencia_ea29');
    const inundacion = this.concatAttribute(this.normaRuralRiesgo, 'inundacion_ea20');
    const lineasAltaTension = this.concatAttribute(this.normaRuralRiesgo, 'lineas_alta_tension_ea31');

    doc.setFont(undefined, 'bold');
    lines = doc.splitTextToSize(
      `ÁREAS DE AMENAZA Y RIESGO`,
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 4;
    doc.setFont(undefined, 'normal');

    if (riesgoVolcanico !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Condición de Riesgo Volcánico:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(riesgoVolcanico, 65, this.row, {
        align: 'left',
      });
      this.row += 4;
    }

    if (restriccionesFlujosLodo !== 'No aplica') {
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
    }

    if (riesgoVolcanico !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Condición de riesgo por remoción en masa:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        riesgoVolcanico, 65, this.row, {
        align: 'left',
      });
      this.row += 4;
    }

    if (subsidencia !== 'No aplica') {
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
    }

    if (inundacion !== 'No aplica') {
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
    }

    if (lineasAltaTension !== 'No aplica') {
      lines = doc.splitTextToSize(
        'Líneas Alta Tensión:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        lineasAltaTension, 65, this.row, {
        align: 'left',
      });
    }

    let calc = 15;
    if (this.obsTratamientosrural || this.tableObservaciones.length > 0) {

      if (this.row > 250) {
        doc.addPage();
        this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
        this.main.addFooters(doc);
        this.row = 30;
      } else {
        this.row += 10;
      }

      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        'OBSERVACIONES',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });

      if (this.obsTratamientosrural && this.obsTratamientosrural.a1_aplicacion_edificabilidad !== 'No aplica') {
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
          this.main.addFooters(doc);
          this.row = 30;
        } else {
          this.row += 10;
        }

        doc.setFont(undefined, 'bold');
        doc.text('A1 aplicación edificabilidad:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(this.obsTratamientosrural.a1_aplicacion_edificabilidad.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
      }

      if (this.obsTratamientosrural && this.obsTratamientosrural.a2_aplicacion_edificabilidad !== 'No aplica') {
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
          this.main.addFooters(doc);
          this.row = 30;
        } else {
          this.row += 15;
        }

        doc.setFont(undefined, 'bold');
        doc.text('A2 aplicación edificabilidad:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(this.obsTratamientosrural.a2_aplicacion_edificabilidad.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
      }

      if (this.obsTratamientosrural && this.obsTratamientosrural.a3_aplicacion_edificabilidad !== 'No aplica') {
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
          this.main.addFooters(doc);
          this.row = 30;
        } else {
          this.row += 15;
        }

        doc.setFont(undefined, 'bold');
        doc.text('A3 aplicación edificabilidad:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(this.obsTratamientosrural.a3_aplicacion_edificabilidad.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
      }

      if (this.obsTratamientosrural && this.obsTratamientosrural.n1_normas_complementarias !== 'No aplica') {
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
          this.main.addFooters(doc);
          this.row = 30;
        } else {
          this.row += 15;
        }

        doc.setFont(undefined, 'bold');
        doc.text('N1 Normas complementarias:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(this.obsTratamientosrural.n1_normas_complementarias.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
      }

      if (this.obsTratamientosrural && this.obsTratamientosrural.n2_normas_complementarias !== 'No aplica') {
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
          this.main.addFooters(doc);
          this.row = 30;
        } else {
          this.row += 15;
        }

        doc.setFont(undefined, 'bold');
        doc.text('N2 Normas complementarias:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(this.obsTratamientosrural.n2_normas_complementarias.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
      }

      if (this.tableObservaciones.length > 0) {
        for (const obs of this.tableObservaciones) {
          if (this.row > 250) {
            doc.addPage();
            this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
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

      if (sistemaHidrico !== 'No aplica') {
        if (this.row > 250) {
          doc.addPage();
          this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
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
        calc = Math.ceil(this.obsSistemaHidrico.length / 180) * 3;
        calc = calc > 3 ? calc : 6;
      }
    }

    /*doc.setFont(undefined, 'normal');
    if (
      this.normaRuralRiesgo[0].attributes.zava_t_269_2015 ===
      'Predio en ZAVA sentencia T-269 de 2015'
    ) {
      if (this.row > 250) {
        doc.addPage();
        this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
        this.main.addFooters(doc);
        this.row = 30;
      } else {
        this.row += calc;
      }
      const notaZava =
        `Nota: En cumplimiento a lo ordenado por el Consejo de Estado, en el fallo proferido por la sala de lo contencioso Administrativo Sección Primera, ` 
        + `dentro de la Acción Popular No. 52001-23-33-000-2015-00607-0, se informa que el predio identificado con el No. Predial: ${this.code}`;
      doc.text(notaZava, lMargin, this.row, { maxWidth: 185, align: 'justify' });
      calc = Math.ceil(notaZava.length / 180) * 3;
      calc = calc > 3 ? calc : 6;
    }*/

    doc.setFont(undefined, 'normal');
    if (
      areasAgrico ===
      'Produccion agricola, ganadera y explotación de recursos naturales'
    ) {
      if (this.row > 250) {
        doc.addPage();
        this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
        this.main.addFooters(doc);
        this.row = 30;
      } else {
        this.row += calc;
      }
      const notaAreasAgrico =
        `Acuerdo 004 de 2015, ARTÍCULO 321: Densidades de las áreas para la producción, agrícola, ganadera y de explotación de recursos naturales y de actividades por sistemas agrosilvopastoriles. La densidad de vivienda para uso residencial en áreas para la producción, agrícola, ganadera y de explotación de recursos naturales y áreas destinadas al desarrollo de actividades por sistemas agrosilvopastoriles es de 1 vivienda por cada 3 hectáreas`;
      doc.text(notaAreasAgrico, lMargin, this.row, { maxWidth: 185, align: 'justify' });
      calc = Math.ceil(notaAreasAgrico.length / 180) * 3;
      calc = calc > 3 ? calc : 6;
    }

    if (
      estructuraEcologicaPrincipal ===
      'Corredores ecologicos'
    ) {
      if (this.row > 250) {
        doc.addPage();
        this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
        this.main.addFooters(doc);
        this.row = 30;
      } else {
        this.row += calc;
      }
      const notaEcologico =
        `Acuerdo 004 de 2015, Artículo 45. Suelo de protección. Son zonas o áreas de terrenos localizadas dentro del suelo urbano, de expansión y rural, que de conformidad con lo establecido en la Ley 388 de 1997, tienen restringida la posibilidad de urbanizarse. El suelo de protección se encuentra especializado en los Planos No. 6G y 7G.`;
      doc.text(notaEcologico, lMargin, this.row, { maxWidth: 185, align: 'justify' });
      calc = Math.ceil(notaEcologico.length / 180) * 3;
      calc = calc > 6 ? calc : 10;
    }

    if (this.row > 250) {
      doc.addPage();
      this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
      this.main.addFooters(doc);
      this.row = 30;
    } else {
      this.row += calc;
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
      doc.addPage();
      this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
      this.main.addFooters(doc);
      this.row = 30;
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
    this.row += 5;
    doc.text(
      'Subsecretario de Aplicación de Normas Urbanísticas',
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

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
