import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoNormaUrbanisticaUrbana {
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
  tratamientoUrbanisticoArray = [];
  obsTratamientosUbanisiticos: any;
  tableDataEdificabilidads = null;
  tableDataTipoEquipamiento = [];
  tableDataInstituciones = [];
  tableObservaciones = [];
  tableDataRiesgo = [];
  obsRiesgosUrbanos = [];
  obsAfectaciones: any;
  tableDataEquipamiento: any;
  texto4: string;
  texto5: string;
  texto8: string;
  texto11: string;
  texto13: string;
  texto18: string;
  headerObservaciones = [];
  headerEdificabilidads = null;
  nombreImageVolumen: any;
  edificabilidad: string;

  activarObservacionDesarrollo: boolean;
  activarSueloProteccion: boolean;

  headerTipoEquipamiento = [
    ['Tipo de Equipamiento',
      'Localización e índice de ocupación',
      '', '', ''
    ],
  ];

  headerTipoEquipamientoPEMP = [
    ['Tratamiento',
      'Sector Normativo', 'Área Morfológica',
      'Edificabilidad', 'Delimitación área afectada PEMP',
      'Volumen a edificar', 'Nivel de intervención PEMP'
    ],
  ];

  headerInstituciones = [
    ['Institución', 'Carácter',
      'Funciones Respecto a la Protección del B.I.C.', 'Actividades a Realizar'
    ],
  ];

  constructor(main: any) {
    this.main = main;
  }

  public query(): void {
    this.code = this.main.code;
    this.countQueries = 0;
    this.maxQueries = 2;
    this.main.loading = true;

    this.tableDataEdificabilidads = new Map();
    this.tableDataTipoEquipamiento = [];
    this.tableDataInstituciones = [];
    this.tableObservaciones = [];
    this.tableDataRiesgo = [];
    this.obsRiesgosUrbanos = [];
    this.obsAfectaciones = null;
    this.texto4 = null;
    this.texto5 = null;
    this.texto8 = null;
    this.texto11 = null;
    this.texto13 = null;
    this.texto18 = null;
    this.headerObservaciones = [];
    this.headerEdificabilidads = new Map();
    this.nombreImageVolumen = null;
    this.tableDataEquipamiento = null;
    this.tratamientoUrbanisticoArray = [];
    this.activarObservacionDesarrollo = false;
    this.activarSueloProteccion = false;

    this.validateCount();
    this.tratamientosUbanisiticos = this.main.currentFeatures[0].attributes;
    for (const tu1 of this.main.currentFeatures) {
      this.tratamientoUrbanisticoArray.push(tu1.attributes.tratamiento_urbanistico);
      if (tu1.attributes.tratamiento_urbanistico.toUpperCase().indexOf('DESARROLLO') >= 0) {
        this.activarObservacionDesarrollo = true;
      }
    }

    // remove duplicates
    this.tratamientoUrbanisticoArray = this.tratamientoUrbanisticoArray.filter((c, index) => {
      return this.tratamientoUrbanisticoArray.indexOf(c) === index;
    });

    const sueloProteccionArray = ['Suelo de proteccion', 'Areas restringidas a estudios por poligono'];
    const intersection = this.tratamientoUrbanisticoArray.filter((element) =>
      sueloProteccionArray.includes(element)
    );
    if (intersection.length === 2) {
      this.activarSueloProteccion = true;
    }

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
    if (
      this.tratamientosUbanisiticos.zava_t_269_de_2015 ===
      'Predio en ZAVA sentencia T-269 de 2015'
    ) {
      this.texto5 = `En cumplimiento a lo ordenado por el Consejo de Estado, en el fallo proferido por la sala de lo contencioso Administrativo Sección Primera, dentro de la Acción Popular No. 52001-23-33-000-2015-00557-0, se informa que el predio identificado con el No. Predial ${this.code}. del  municipio  de  Pasto,  se  encuentra  en  la  zona  de  influencia  del  Centro Histórico.`;
      this.texto8 = `Para la expedición y aprobación de LICENCIAS URBANÍSTICAS, la respectiva Curaduría Urbana debe contemplar lo establecido y dispuesto por el Consejo de Estado, en el fallo proferido por la sala de lo contencioso Administrativo Sección Primera, dentro de la Acción Popular No. 52001-23-33-000-2015-00557-0, relacionada con la suspensión de solicitudes de licencias de construcción en la zona de influencia alta del volcán Galeras, de acuerdo con el nuevo Mapa de Amenaza Volcánica del Volcán Galeras, elaborado por el Servicio Geológico Colombiano 2015. Actualización del Mapa de Amenaza Volcánica del Volcán Galeras - Colombia. En cumplimiento a la Sentencia de la Corte Constitucional T-269 de 2015.`;
    }

    const direccion = this.tratamientosUbanisiticos.direccion.trim();
    this.texto11 = `PREDIO LOCALIZADO en ${direccion}.`;
    const edificabilidad =
      this.tratamientosUbanisiticos.edificabilidad.split(' - ');
    this.getTipoTratamiento(
      this.tratamientosUbanisiticos.id_tipo_tratamiento
    );
    this.getObservacionesTratamientoUrbano(this.tratamientosUbanisiticos.id_observacion_tratamieto_urban);
    this.getObservacioneNormaUrbano(this.tratamientosUbanisiticos.ID_Observacion_norma_urbana);
    this.edificabilidad = edificabilidad[0];
    this.nombreImageVolumen = this.getNombreImageVolumen(this.edificabilidad,
      this.tratamientosUbanisiticos.codigo_morfologico_de_alturas, this.tratamientosUbanisiticos.volumen_a_edificar);

    if (this.edificabilidad === 'PEMP') {
      this.tratamientosUbanisiticos._PEMP = 'SI';
      this.tratamientosUbanisiticos._edificabilidad = edificabilidad[1];
      this.tratamientosUbanisiticos._altura = edificabilidad[2] ? edificabilidad[2] : this.tratamientosUbanisiticos.edificabilidad;
      this.getObrasPermitidas(this.tratamientosUbanisiticos.id_obra_permitida);
      this.getInstitucionPEMP(this.tratamientosUbanisiticos.id_institucion_pemp);
      this.texto18 = `El predio identificado con el No. Predial ${this.code} del  municipio  de  Pasto,  se  encuentra  en  la  zona  de  influencia  del  Centro Histórico.`;
    } else {
      this.maxQueries++;
      this.tratamientosUbanisiticos._PEMP = 'NO';
      this.tratamientosUbanisiticos._altura = 'No Aplica';
      this.tratamientosUbanisiticos._edificabilidad = edificabilidad;
      if (this.tratamientosUbanisiticos.id_tu_edificabilidad) {
        this.getTuEdificabilidad(this.tratamientosUbanisiticos.id_tu_edificabilidad);
      }
      if (this.tratamientosUbanisiticos.id_tipo_equipamiento) {
        this.getTipoEquipamiento(this.tratamientosUbanisiticos.id_tipo_equipamiento);
      }
    }

    const arr = [];
    arr.push(// null, null, this.tratamientosUbanisiticos.correccion_cartografica,
      this.tratamientosUbanisiticos.tratamiento_urbanistico,
      this.tratamientosUbanisiticos.sector_normativo,
      this.tratamientosUbanisiticos.area_morfologica,
      this.tratamientosUbanisiticos.edificabilidad,
      this.tratamientosUbanisiticos.delimitacion_del_area_afectada_,
      this.tratamientosUbanisiticos.volumen_a_edificar,
      this.tratamientosUbanisiticos.nivel_intervencion_pemp
    );
    this.tableDataTipoEquipamiento.push(arr);
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

  getObservacioneNormaUrbano(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_observacion_noma_urbana = '${id}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_NORMA_URBANO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.headerObservaciones = [];
          const subheaderObservaciones = [];
          for (const result of results.features) {
            subheaderObservaciones.push(result.attributes.afectacion_urbanistico);
          }
          this.headerObservaciones.push(subheaderObservaciones);

          for (const result of results.features) {
            const attributes = result.attributes;
            const arr = [];
            arr.push(attributes.norma_urbana);
            this.tableObservaciones.push(arr);
          }
        }
        this.validateCount();
      });
  }

  getObrasPermitidas(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['obra_permitida'];
    queryParamas.where = `id_obra_permitida = '${id}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBRAS_PERMITIDAS_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          const attributes = results.features[0].attributes;
          this.tratamientosUbanisiticos._obra_permitida =
            attributes.obra_permitida;
        }
      });
  }

  getTipoEquipamiento(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_tipo_equipamiento = '${id}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.TIPO_EQUIPAMIENTOS, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.tableDataEquipamiento = results.features;
        }
      });
  }

  getInstitucionPEMP(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_institucion_pemp = '${id}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.INSTITUCION_PEMP_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          const attributes = results.features[0].attributes;
          const arr = [];
          arr.push(attributes.institucion,
            attributes.caracter, attributes.funcion,
            attributes.actividad_realizar
          );
          this.tableDataInstituciones.push(arr);
        }
      });
  }

  getTuEdificabilidad(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['id_edificabilidad'];
    queryParamas.where = `id_tu_edificabilidad = '${id}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.TU_EDIFICABILIDAD_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          const idEdificabilidads = [];
          for (const result of results.features) {
            idEdificabilidads.push(result.attributes.id_edificabilidad);
          }
          this.maxQueries++;
          this.getEdificabilidad(idEdificabilidads);
        }
        this.validateCount();
      });
  }

  getEdificabilidad(idEdificabilidads) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `id_edificabilidad in ('${idEdificabilidads.join('\', \'')}')`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;
    queryParamas.orderByFields = ['tipo_edificabilidad'];

    query
      .executeQueryJSON(environment.EDIFICABILIDAD_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          let lastIdEdificabilidad = null;
          for (const feature of results.features) {
            if (feature.attributes.tipo_edificabilidad.charAt(0) !== lastIdEdificabilidad) {
              const headerEdificabilidad = [];
              const subheaderEdificabilidad = [];

              subheaderEdificabilidad.push('Edificabilidad', 'Actuación Urbanística', 'Tipo Edificatorio');

              const firstRecord = feature.attributes;
              if (firstRecord.codigo_morfologico_altura.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Código morfológico de altura');
              }

              if (firstRecord.indice_construccion.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Índice de Construcción');
              }

              if (firstRecord.indice_construccion_maxima.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Índice de Construcción máximo');
              }

              if (firstRecord.indice_ocupacion.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Índice de ocupación');
              }

              if (firstRecord.indice_ocupacion_maxima.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Índice de ocupación máximo');
              }

              if (firstRecord.altura.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Altura');
              }

              if (firstRecord.altura_maxima.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Altura Máxima');
              }

              if (firstRecord.altura_maxima_zonas_receptoras.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Altura Máxima en zonas receptoras de derechos de construcción');
              }

              if (firstRecord.rango_altura.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Rangos de altura');
              }

              if (firstRecord.area_minima_m2.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Área mínima de predio (m2)');
              }

              if (firstRecord.frente_minimo_m.toUpperCase() !== 'NO APLICA') {
                subheaderEdificabilidad.push('Frente mínimo de predio (metros)');
              }

              subheaderEdificabilidad.push('Cargas urbanísticas', 'Condicionantes');

              headerEdificabilidad.push(subheaderEdificabilidad);
              this.headerEdificabilidads.set(feature.attributes.tipo_edificabilidad.charAt(0), headerEdificabilidad);
            }
            lastIdEdificabilidad = feature.attributes.tipo_edificabilidad.charAt(0);
          }

          lastIdEdificabilidad = results.features[0].attributes.tipo_edificabilidad.charAt(0);
          let tableDataEdificabilidad = [];
          for (const result of results.features) {

            const attributes = result.attributes;
            if (attributes.codigo_morfologico_altura.toUpperCase() !== 'NO APLICA'
              && this.tratamientosUbanisiticos.codigo_morfologico_de_alturas.indexOf('CMA') >= 0
              && this.tratamientosUbanisiticos.codigo_morfologico_de_alturas !== attributes.codigo_morfologico_altura) {
              continue;
            }

            /*if (lastIdEdificabilidad === '3' && this.tratamientosUbanisiticos.volumen_a_edificar.toUpperCase().indexOf('RANGO 1') >= 0) {
              lastIdEdificabilidad = attributes.tipo_edificabilidad.charAt(0);
              continue;
            }*/

            if (attributes.tipo_edificabilidad.charAt(0) !== lastIdEdificabilidad) {
              this.tableDataEdificabilidads.set(lastIdEdificabilidad, tableDataEdificabilidad);
              tableDataEdificabilidad = [];
              lastIdEdificabilidad = attributes.tipo_edificabilidad.charAt(0);
            }

            const arr = [];
            arr.push(attributes.tipo_edificabilidad.charAt(0), attributes.actuacion_urbanistica, attributes.tipo_edificatorio);

            if (attributes.codigo_morfologico_altura.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.codigo_morfologico_altura);
            }

            if (attributes.indice_construccion.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.indice_construccion);
            }

            if (attributes.indice_construccion_maxima.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.indice_construccion_maxima);
            }

            if (attributes.indice_ocupacion.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.indice_ocupacion);
            }

            if (attributes.indice_ocupacion_maxima.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.indice_ocupacion_maxima);
            }

            if (attributes.altura.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.altura);
            }

            if (attributes.altura_maxima.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.altura_maxima);
            }

            if (attributes.altura_maxima_zonas_receptoras.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.altura_maxima_zonas_receptoras);
            }

            if (attributes.rango_altura.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.rango_altura);
            }

            if (attributes.area_minima_m2.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.area_minima_m2);
            }

            if (attributes.frente_minimo_m.toUpperCase() !== 'NO APLICA') {
              arr.push(attributes.frente_minimo_m);
            }

            arr.push(attributes.carga_urbanistica,
              attributes.condicionante);

            tableDataEdificabilidad.push(arr);
          }

          this.tableDataEdificabilidads.set(lastIdEdificabilidad, tableDataEdificabilidad);
        }

        this.validateCount();
      });
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
    doc.text('Suelo Urbano', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
    this.row += 6;

    if (
      this.tratamientosUbanisiticos.codigo_morfologico_de_alturas ===
      'Alturas reguladas en el PEMP Centro Historico'
    ) {
      lines = `Conforme a lo establecido en la Resolución Número 0452 de 2012, expedido por el Ministerio de Cultura “por la cual se aprueba `
        + `el Plan Especial de Manejo y Protección del Centro Histórico - PEMP de Pasto (Nariño) y su zona de influencia, declarado bien de `
        + `interés cultural del ámbito nacional” y De acuerdo a lo establecido en el Acuerdo 004 del 14 de abril de 2015, por medio del cual `
        + `se adopta el Plan de Ordenamiento Territorial del Municipio de Pasto 2015 - 2027  PASTO TERRITORIO CON - SENTIDO y de acuerdo al `
        + `Plan Especial de Manejo y Protección del Centro Histórico - PEMP de Pasto (Nariño), el predio identificado con el código catastral No.: `;
      doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.row += 10;
    } else if (this.tratamientosUbanisiticos._PEMP === 'NO') {
      lines = `De acuerdo a lo  establecido en el Acuerdo 004 del 14 de abril de 2015,  por medio del  cual  se adopta el Plan de Ordenamiento Territorial del Municipio de Pasto 2015- 2027 PASTO `
        + `TERRITORIO CON - SENTIDO y con el Código catastral No.:`;
      doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.row += 5;
    }

    doc.setFont(undefined, 'bold');
    doc.text(this.main.printCode, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    doc.setFont(undefined, 'normal');
    this.row += 5;

    this.texto4 = `No. Predial Nacional: ${this.tratamientosUbanisiticos.codigo_predial_nacional}`;
    doc.text(this.texto4, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 5;

    lines = doc.splitTextToSize(
      'En el Municipio de Pasto, se clasifica de la siguiente manera:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 4;

    lines = doc.splitTextToSize('Clase de suelo:', pdfInMM - lMargin - rMargin);
    doc.text(lines, lMargin, this.row);
    doc.text(this.tratamientosUbanisiticos.clase_de_suelo, 55, this.row, {
      align: 'left',
    });
    this.row += 4;
    lines = doc.splitTextToSize(
      'Unidad territorial:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(this.tratamientosUbanisiticos.unidad_territorial, 55, this.row, {
      align: 'left',
    });
    this.row += 4;
    lines = doc.splitTextToSize(
      'Áreas morfológicas homogéneas:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(this.tratamientosUbanisiticos.area_morfologica, 55, this.row, {
      align: 'left',
    });
    this.row += 4;
    lines = doc.splitTextToSize(
      'Sector normativo:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(this.tratamientosUbanisiticos.sector_normativo, 55, this.row, {
      align: 'left',
    });
    this.row += 5;

    doc.setFont(undefined, 'bold');
    doc.text(this.tratamientosUbanisiticos._tipoTratamiento, 80, this.row, {
      align: 'left',
    });
    doc.text(this.tratamientoUrbanisticoArray[0], 115, this.row, {
      align: 'left',
    });
    this.row += 4;
    if (this.tratamientoUrbanisticoArray.length > 1) {
      const length1 = `${this.tratamientosUbanisiticos._tipoTratamiento}`.length;
      for (let index = 1; index < this.tratamientoUrbanisticoArray.length; index++) {
        const tu = this.tratamientoUrbanisticoArray[index];
        const length2 = tu.length - this.tratamientoUrbanisticoArray[0].length;
        if (tu !== 'Vacio normativo') {
          doc.text(tu, 115, this.row, {
            align: 'left',
          });
          this.row += 4;
        }
      }
    }

    doc.setFont(undefined, 'normal');
    lines = doc.splitTextToSize(
      'Código Morfológico de Alturas:',
      pdfInMM - lMargin - rMargin
    );
    doc.text(lines, lMargin, this.row);
    doc.text(
      this.tratamientosUbanisiticos.codigo_morfologico_de_alturas,
      55,
      this.row,
      {
        align: 'left',
      }
    );
    this.row += 4;

    if (this.tratamientosUbanisiticos._PEMP === 'SI') {
      lines = doc.splitTextToSize('Altura:', pdfInMM - lMargin - rMargin);
      doc.text(lines, lMargin, this.row);
      doc.text(this.tratamientosUbanisiticos._altura, 55, this.row, {
        align: 'left',
      });
      this.row += 4;
      lines = doc.splitTextToSize(
        'Obras Permitidas:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      const obrasPermitidas = this.splitSentence(12, this.tratamientosUbanisiticos._obra_permitida);
      for (const obraPermitida of obrasPermitidas) {
        doc.text(obraPermitida, 55, this.row, {
          align: 'left',
        });
        this.row += 4;
      }
      lines = doc.splitTextToSize(
        'Nivel de Intervención PEMP:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(this.tratamientosUbanisiticos.nivel_intervencion_pemp, 55, this.row, {
        align: 'left',
      });
      this.row += 4;
      lines = doc.splitTextToSize(
        'Delimitación área afectada PEMP:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(
        this.tratamientosUbanisiticos.delimitacion_del_area_afectada_,
        55,
        this.row,
        {
          align: 'left',
        }
      );
      this.row += 8;
    } else {
      lines = doc.splitTextToSize(
        'Edificabilidad:',
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, lMargin, this.row);
      doc.text(this.tratamientosUbanisiticos.edificabilidad, 55, this.row, {
        align: 'left',
      });
      this.row += 4;
    }

    if (this.tratamientosUbanisiticos.volumen_a_edificar !== 'No aplica') {
      doc.setFont(undefined, 'bold');
      lines = doc.splitTextToSize(
        `VOLUMEN A EDIFICAR Y AISLAMIENTOS`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });
      this.row += 2;
      doc.setFont(undefined, 'normal');
      try {
        const imgVol = new Image();
        imgVol.src = 'assets/images/figuras_volumetricas/' + this.nombreImageVolumen;
        doc.addImage(imgVol, 'PNG', 30, this.row, 150, 100, this.nombreImageVolumen, 'FAST');
        if (this.edificabilidad === 'Tipo 1 y tipo 3 rango 1') {
          this.row += 99;
          const imgVolE = new Image();
          imgVolE.src = 'assets/images/figuras_volumetricas/POT/EDIFICABILIDAD TIPO 3 - 1 A 5 PISOS.png';
          doc.addImage(imgVolE, 'PNG', 30, this.row, 150, 80, 'EDIFICABILIDAD TIPO 3 - 1 A 5 PISOS', 'FAST');
        }
        this.row += 105;
      } catch (e) {
        console.log(e);
      }
      lines = doc.splitTextToSize(
        `Volumen a edificar: ${this.tratamientosUbanisiticos.volumen_a_edificar}`,
        pdfInMM - lMargin - rMargin
      );
      doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
        align: 'center',
      });

      if (this.edificabilidad === 'Tipo 1 y tipo 3 rango 1') {
        doc.addPage();
        this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
        this.main.addFooters(doc);
        this.row = 30;
      } else {
        this.row += 5;
      }
    }

    if (this.row > 250) {
      doc.addPage();
      this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
      this.main.addFooters(doc);
      this.row = 30;
    }

    if (this.tratamientosUbanisiticos._PEMP === 'NO') {
      if (this.headerEdificabilidads.size > 0) {
        doc.setFont(undefined, 'bold');
        lines = doc.splitTextToSize(
          'CONDICIONES DE EDIFICABILIDAD:',
          pdfInMM - lMargin - rMargin
        );
        doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
          align: 'center',
        });
        this.row += 5;

        for (const [key, value] of this.headerEdificabilidads) {
          const tableDataEdificabilidad = this.tableDataEdificabilidads.get(key);
          doc.setFont(undefined, 'normal');

          if (tableDataEdificabilidad.length > 0) {
            lines = doc.splitTextToSize(
              `EDIFICABILIDAD TIPO ${tableDataEdificabilidad[0][0]}. Para la aplicación de este tipo de edificabilidad se deberán cumplir de forma obligatoria los siguientes parámetros:`,
              pdfInMM - lMargin - rMargin
            );
            doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
              align: 'center',
            });

            (doc as any).autoTable({
              styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
              head: value,
              body: tableDataEdificabilidad,
              theme: 'grid',
              startY: this.row + 5,
            });

            this.row = (doc as any).autoTable.previous.finalY + 5;
          }

          if (this.row > 240) {
            this.newPage(doc, 30);
          }
        }
      }

      if (this.headerEdificabilidads.size > 0) {
        doc.setFontSize(5);
        doc.setFont(undefined, 'bold');
        lines = doc.splitTextToSize(
          '* Nota: Para acceder a una de las edificabilidades plasmadas en este concepto, se deben cumplir con cada una de las condicionantes y demás requisitos como rangos de altura, índices, áreas, frentes mínimos normas volumétricas, restricciones para las áreas en condición de riesgo entre otros.',
          pdfInMM - lMargin - rMargin
        );
        doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
          align: 'center',
        });

        if (this.tratamientosUbanisiticos.edificabilidad.toUpperCase().indexOf('LODO') > 0) {
          this.row += 5;
          lines = doc.splitTextToSize(
            '* Para este predio que se ubica en una área con restricción por riesgo por flujos de lodo secundario "LA EDIFICABILIDAD" se limita, a las condiciones de baja ocupación plasmadas en el ARTICULO 92 del acuerdo 004 de 2015.',
            pdfInMM - lMargin - rMargin
          );
          doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
            align: 'center',
          });
        }
        doc.setFontSize(6);

        this.row += 15;

        if (this.row > 250) {
          this.newPage(doc, 30);
        }
      }

      if (this.tratamientosUbanisiticos.edificabilidad.toUpperCase().indexOf('EQUIPAMIENTO') > 0) {
        this.addEquipamiento(doc);
      }
    } else {
      this.addEquipamientoPEMP(doc);
      this.addEntidades(doc);
    }

    if (!this.obsAfectaciones) {
      this.main.showMessage('Error al ejecutar la consulta, intente nuevamente', 'warn');
      this.main.loading = false;
    }

    if (this.obsAfectaciones.length > 0) {
      if (this.row > 250) {
        this.newPage(doc, 30);
      }

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
      doc.text('Condición de Riesgo Volcánico:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'flujos_de_lodo_ea22');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condición de Riesgo Flujos de lodo:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'restricciones_por_lujos_de_lodo');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Restricción por flujos de lodo (Sector):', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'remocion_en_masa_ea19');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condición de Riesgo Remoción en Masa:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Ronda Hídrica:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(this.tratamientosUbanisiticos.afectacion_por_ronda_hidrica.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'subsidencia_ea29');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condición de Riesgo Subsidencia:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'inundacion_ea23');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Condición de Riesgo Inundación:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);

      valueObs = this.concatAttribute(this.obsAfectaciones, 'servidumbre_de_lineas_de_alta_t');
      doc.setFont(undefined, 'bold');
      this.row += 5;
      doc.text('Líneas Alta Tensión:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      doc.setFont(undefined, 'normal');
      doc.text(valueObs.replace(/(\r\n|\n|\r)/gm, ''), 70, this.row);
    }

    if (this.obsTratamientosUbanisiticos) {
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

      this.row += 8;
      const a1AplicacionEdificabilidad = this.obsTratamientosUbanisiticos.a1_aplicacion_edificabilidad;
      if (a1AplicacionEdificabilidad !== 'No aplica' || this.activarObservacionDesarrollo || this.activarSueloProteccion) {
        doc.setFont(undefined, 'bold');
        doc.text('A1 aplicación edificabilidad:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;

        if (a1AplicacionEdificabilidad !== 'No aplica') {
          doc.setFont(undefined, 'normal');
          doc.text(a1AplicacionEdificabilidad.replace(/(\r\n|\n|\r)/gm, ''),
            lMargin, this.row, { maxWidth: 185, align: 'justify' });
          this.getCalc(doc, a1AplicacionEdificabilidad);
        }

        if (this.activarObservacionDesarrollo) {
          if (this.row > 250) {
            this.newPage(doc, 30);
          }
          doc.setFont(undefined, 'normal');
          const label = 'Al área bruta del predio en tratamiento de desarrollo se deben descontar las áreas de afectaciones que constituyen suelo de protección, se tiene así el área neta urbanizable.';
          doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
            lMargin, this.row, { maxWidth: 185, align: 'justify' });
          this.getCalc(doc, label);
        }

        if (this.activarSueloProteccion) {
          if (this.row > 250) {
            this.newPage(doc, 30);
          }
          doc.setFont(undefined, 'normal');
          const label = 'Teniendo en cuenta la condición de riesgo, los estudios de detalle a realizar en los términos del decreto 1077 del 2015, definirán las medidas de mitigación y cuando aplique la redefinición del suelo de protección.';
          doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
            lMargin, this.row, { maxWidth: 185, align: 'justify' });
          this.getCalc(doc, label);
        }
      }

      const a2AplicacionEdificabilidad = this.obsTratamientosUbanisiticos.a2_aplicación_edificabilidad;
      if (a2AplicacionEdificabilidad !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('A2 aplicación edificabilidad:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(a2AplicacionEdificabilidad.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, a2AplicacionEdificabilidad);
      }

      const a3AplicacionEdificabilidad = this.obsTratamientosUbanisiticos.a3_aplicación_edificabilidad;
      if (a3AplicacionEdificabilidad !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('A3 aplicación edificabilidad:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(a3AplicacionEdificabilidad.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, a3AplicacionEdificabilidad);
      }

      const c1CargasUrbanisticas = this.obsTratamientosUbanisiticos.c1_cargas_urbanisticas;
      if (c1CargasUrbanisticas !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('C1 Cargas urbanísticas:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(c1CargasUrbanisticas.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, c1CargasUrbanisticas);
      }

      const c2CargasUrbanisticas = this.obsTratamientosUbanisiticos.c2_cargas_urbanisticas;
      if (c2CargasUrbanisticas !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('C2 Cargas urbanísticas:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(c2CargasUrbanisticas.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, c2CargasUrbanisticas);
      }

      const c3CargasUrbanisticas = this.obsTratamientosUbanisiticos.c3_cargas_urbanisticas;
      if (c3CargasUrbanisticas !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('C3 Cargas urbanísticas:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(c3CargasUrbanisticas.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, c3CargasUrbanisticas);
      }

      const n1NnormasComplementarias = this.obsTratamientosUbanisiticos.n1_normas_complementarias;
      if (n1NnormasComplementarias !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('N1 Normas complementarias:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(n1NnormasComplementarias.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, n1NnormasComplementarias);
      }

      const n2NnormasComplementarias = this.obsTratamientosUbanisiticos.n2_normas_complementarias;
      if (n2NnormasComplementarias !== 'No aplica') {
        doc.setFont(undefined, 'bold');
        doc.text('N2 Normas complementarias:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.row += 5;
        doc.setFont(undefined, 'normal');
        doc.text(n2NnormasComplementarias.replace(/(\r\n|\n|\r)/gm, ''),
          lMargin, this.row, { maxWidth: 185, align: 'justify' });
        this.getCalc(doc, n2NnormasComplementarias);
      }

      if (this.obsRiesgosUrbanos.length > 0) {
        const riesgosVolcanicos = [];
        for (const obs of this.obsRiesgosUrbanos) {
          if (obs.id_observacion_riesgo_urbano !== '10') {
            doc.setFont(undefined, 'bold');
            doc.text(obs.afectacion_urbanistica.replace(/(\r\n|\n|\r)/gm, '') + ':',
              lMargin, this.row, { maxWidth: 185, align: 'justify' });
            this.row += 5;
            doc.setFont(undefined, 'normal');
            const label = obs.norma_urbana;
            doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
              lMargin, this.row, { maxWidth: 185, align: 'justify' });
            let calc = Math.ceil(label.length / 180) * 3;
            calc = calc > 3 ? calc : 6;
            this.row += calc;
            if (this.row > 250) {
              this.newPage(doc, 30);
            }
          } else {
            riesgosVolcanicos.push(obs.norma_urbana);
          }
        }

        if (riesgosVolcanicos.length > 0) {
          if (this.row > 250) {
            this.newPage(doc, 30);
          }
          const riesgoVolcanico = this.concatAttribute(this.obsAfectaciones, 'riesgo_volcanico_ea27');
          doc.setFont(undefined, 'bold');
          doc.text('Condición de Riesgo Volcánico:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
          this.row += 5;
          doc.setFont(undefined, 'normal');
          for (const riesgo of riesgosVolcanicos) {
            if (riesgo.indexOf('91') >= 0) {
              if (riesgoVolcanico.toUpperCase().indexOf('BAJO') >= 0 || riesgoVolcanico.toUpperCase().indexOf('MEDIO') >= 0
                || riesgoVolcanico.toUpperCase().indexOf('ALTO') >= 0) {
                doc.text(riesgo.replace(/(\r\n|\n|\r)/gm, ''),
                  lMargin, this.row, { maxWidth: 185, align: 'justify' });
                let calc = Math.ceil(riesgo.length / 180) * 3;
                calc = calc > 3 ? calc : 6;
                this.row += calc;
              }
            } else if (riesgo.indexOf('250') >= 0) {
              if (riesgoVolcanico.toUpperCase().indexOf('LODO') >= 0) {
                doc.text(riesgo.replace(/(\r\n|\n|\r)/gm, ''),
                  lMargin, this.row, { maxWidth: 185, align: 'justify' });
                let calc = Math.ceil(riesgo.length / 180) * 3;
                calc = calc > 3 ? calc : 6;
                this.row += calc;
              }
            }
          }
        }
      }
    }

    if (this.headerObservaciones.length > 0) {
      doc.addPage();
      this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
      this.main.addFooters(doc);
      this.row = 30;
      (doc as any).autoTable({
        styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
        head: this.headerObservaciones,
        body: this.tableObservaciones,
        theme: 'grid',
        margin: { top: 35 },
      });
    }

    if (
      this.tratamientosUbanisiticos.zava_t_269_de_2015 ===
      'Predio en ZAVA sentencia T-269 de 2015'
    ) {
      if (this.row > 250) {
        this.newPage(doc, 30);
      } else {
        this.row += 8;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Información diferente a la consignada en el Acuerdo 004 del 14 de abril del 2015:',
        lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.row += 5;
      doc.setFont(undefined, 'normal');
      const label = 'Predio incluido en oficio 1511-501-2021 Alcance Resolución 197 de 2020, referente al fallo del Consejo de Estado que suspende la solicitud de licencias de construcción.';
      doc.text(label.replace(/(\r\n|\n|\r)/gm, ''),
        lMargin, this.row, { maxWidth: 185, align: 'justify' });
    }

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 8;
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

    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
    this.main.addFooters(doc);

    if (this.obsTratamientosUbanisiticos.a_normas_ambientales !== 'No aplica') {
      if (this.row > 250) {
        this.newPage(doc, 30);
      } else {
        this.row += 25;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Normas Nacionales:', lMargin, this.row, { maxWidth: 185, align: 'justify' });
      this.row += 5;
      doc.setFont(undefined, 'normal');
      doc.text(this.obsTratamientosUbanisiticos.a_normas_ambientales.replace(/(\r\n|\n|\r)/gm, ''),
        lMargin, this.row, { maxWidth: 185, align: 'justify' });
    }

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 25;
    }
    doc.setFont(undefined, 'normal');
    const notaTexto = 'Nota: Cualquier inquietud u observación de este documento generado desde esta plataforma '
      + 'dirigirse al correo electrónico unidaddecorrespondencia@pasto.gov.co';
    doc.text(notaTexto.replace(/(\r\n|\n|\r)/gm, ''),
      lMargin, this.row, { maxWidth: 185, align: 'justify' });

    return doc.output('blob');
  }

  addEquipamiento(doc) {
    doc.setFont(undefined, 'bold');
    const lines = doc.splitTextToSize(
      'Edificabilidad para equipamientos. La edificabilidad específica para los equipamientos será:',
      this.pdfInMM - this.lMargin - this.rMargin
    );
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    const tableDataEquipamientoFinal = [];
    let arr = [];
    arr.push('Equipamiento con área superior a 1.000m2');
    arr.push('Edificabilidad tipo 1, para optar edificabilidad adicional (edificabilidad 2) se tendrá en cuenta los retrocesos establecidos en las normas volumétricas.');
    arr.push('Índice de ocupación máximo del 60%');
    arr.push('Altura de acuerdo al plano EE6 Modelo morfológico de alturas ');
    arr.push('Los nuevos equipamientos con estas características se deben localizar sobre vías arterias A3, A2 o A1');
    tableDataEquipamientoFinal.push(arr);
    arr = [];
    arr.push('Equipamientos con área inferior a 1.000 m2');
    arr.push('Edificabilidad tipo 1.');
    arr.push('Índice de ocupación máximo del 75%');
    arr.push('Altura de acuerdo al plano EE6 Modelo morfológico de alturas ');
    tableDataEquipamientoFinal.push(arr);

    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
      head: this.headerTipoEquipamiento,
      body: tableDataEquipamientoFinal,
      theme: 'grid',
      startY: this.row + 5,
    });

    this.row = (doc as any).autoTable.previous.finalY + 5;

    if (this.row > 250) {
      this.newPage(doc, 30);
    }
  }

  addEquipamientoPEMP(doc) {
    doc.setFont(undefined, 'bold');
    const lines = doc.splitTextToSize(
      'CONDICIONES DE EDIFICABILIDAD:	PLAN ESPECIAL DE MANEJO Y PROTECCIÓN - PEMP',
      this.pdfInMM - this.lMargin - this.rMargin
    );
    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
      head: this.headerTipoEquipamientoPEMP,
      body: this.tableDataTipoEquipamiento,
      theme: 'grid',
      startY: this.row + 5,
    });

    this.row = (doc as any).autoTable.previous.finalY + 5;

    if (this.row > 250) {
      this.newPage(doc, 30);
    }
  }

  addEntidades(doc) {
    doc.setFont(undefined, 'bold');
    const lines = doc.splitTextToSize(
      'ENTIDADES QUE DEBEN INTERACTUAR PARA LA PROTECCIÓN DEL CENTRO HISTÓRICO DE PASTO:',
      this.pdfInMM - this.lMargin - this.rMargin
    );

    doc.text(lines, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
      head: this.headerInstituciones,
      body: this.tableDataInstituciones,
      theme: 'grid',
      startY: this.row + 5,
    });

    this.row = (doc as any).autoTable.previous.finalY + 5;
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

    result = result.filter((item,
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
    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
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

  splitSentence(maxLength: number, stringToSplit: string) {
    const app = stringToSplit.split(' ');
    const arrayApp = [];
    let stringApp = '';
    app.forEach((sentence, index) => {
      stringApp += sentence + ' ';

      if ((index + 1) % maxLength === 0) {
        arrayApp.push(stringApp);
        stringApp = '';
      } else if (app.length === index + 1 && stringApp !== '') {
        arrayApp.push(stringApp);
        stringApp = '';
      }
    });
    return arrayApp;
  }

  getNombreImageVolumen(edificabilidad, codigoMorfologicoAltura, volumenEdificar) {
    let te = 'PEMP';
    let imageName = this.tratamientosUbanisiticos.volumen_a_edificar;
    if (edificabilidad !== 'PEMP') {
      let tipo = '';
      te = 'POT';
      if (edificabilidad.indexOf('2') >= 0) {
        tipo = 'TIPO2';
      } else {
        tipo = 'TIPO1';
      }
      imageName = `${codigoMorfologicoAltura}-${tipo}`;
    }
    return `${te}/${imageName}.png`;
  }

}
