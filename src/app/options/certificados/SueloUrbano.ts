import * as query from "@arcgis/core/rest/query";
import Query from "@arcgis/core/rest/support/Query";

import "moment/locale/es";
import { environment } from "src/environments/environment";

import { jsPDF } from "jspdf";
import "jspdf-autotable";

export class SueloUrbano {
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

  tablaMitad: boolean;

  public idsTiposActividades = [];
  public tiposActividades = [];
  public compatibilidadCiiu = [];
  public restriccionesActividades = [];
  public criterios = [];
  public criteriosPEMP = [];
  public notasUso = [];

  constructor(main: any) {
    this.main = main;
    this.tablaMitad = false;
  }

  public query(): void {
    this.code = this.main.code;
    this.countQueries = 0;
    this.maxQueries = 2;
    this.main.loading = true;
    this.validateCount();
    this.atributosNorma = this.main.currentFeatures[0].attributes;

    if (this.idsTiposActividades.length === 0) {
      this.getAreaActividad();
    }

    this.main.loading = false;
  }

  getAreaActividad() {
    if (this.main.conceptForm.value.preCode === '') {
      this.main.messageService.add({
        severity: 'warn',
        summary: 'Concepto',
        detail: 'Digite el código predial'
      });
      this.main.loading = false;
    } else {
      this.main.loading = true;
      const queryParamas = new Query();
      queryParamas.returnGeometry = true;
      queryParamas.outFields = ['*'];
      queryParamas.where = `codigo_predial_anterior = '${this.main.conceptForm.value.preCode}'`;
      queryParamas.outSpatialReference =
        this.main.mapService.getViewMap().spatialReference;

      query
        .executeQueryJSON(environment.AREA_ACTIVIDAD_SERVICE, queryParamas)
        .then((results) => {
          if (results.features.length > 0) {
            this.idsTiposActividades = [];
            this.tiposActividades = [];

            for (const result of results.features) {
              this.idsTiposActividades.push(`'${result.attributes.id_tipo_actividad}'`);
              this.tiposActividades.push(`${result.attributes.tipo_actividad}`);
            }

          } else {
            // this.main.messageService.add({
            //   severity: 'warn',
            //   summary: 'Concepto',
            //   detail: 'El número predial no posee actividades compatibles'
            // });
            this.main.loading = false;
          }
        });
    }
  }

  //eliminar
  getConsultaRiesgoRural() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ["*"];
    queryParamas.where = "codigo_predial_anterior = '" + this.code + "'";
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.RIESGO_RURAL_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.atributosRiesgoRural = results.features[0].attributes;
        }

        if (this.atributosNorma.id_observacion_rural_restringid) {
          this.main.maxQueries++;
          this.getObservacionesTratamientoRural(this.atributosNorma.id_observacion_rural_restringid);
        }

        if (this.atributosNorma.id_observacion_rural_restringid) {
          this.main.maxQueries++;
          this.getObservacionesRiesgoTratamientoRural(this.atributosNorma.id_observacion_rural_restringid);
        }

        this.main.validatCount();
        this.main.loading = false;
      });
  }

  //eliminar
  getObservacionesTratamientoRural(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ["*"];
    queryParamas.where = "id_observacion_riesgo_rural_res = '" + id + "'";
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_TRATAMIENTO_RIESGO_RURAL_RESTRINGIDO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          for (const result of results.features) {
            if (results.features.length > 0) {
              this.atributosObservacionesRiesgo = results.features[0].attributes;
            }
          }
        }
        this.main.validatCount();
      });
  }

  //eliminar
  getObservacionesRiesgoTratamientoRural(id) {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ["*"];
    queryParamas.where = "id_observacion_rural_restringid = '" + id + "'";
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.OBS_TRATAMIENTO_RURAL_RESTRINGIDO_SERVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          for (const result of results.features) {
            if (results.features.length > 0) {
              this.atributosObservaciones = results.features[0].attributes;
            }
          }
        }
        this.main.validatCount();
      });
  }

  public download(): any {
    this.main.loading = true;
    this.lMargin = 15;
    this.rMargin = 15;
    this.pdfInMM = 210;
    this.pdfMaxWidth = this.pdfInMM - this.lMargin - this.rMargin;

    const doc = new jsPDF();

    doc.setFontSize(10);
    this.row = 40;
    let lines = "";
    let texto = "";

    const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const todayString = today.toLocaleDateString('es-ES', options);

    doc.setFont(undefined, 'bold');
    doc.text('CONCEPTO DE USO DE SUELO',
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 5;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Número de Radicado ${this.main.consecutive} de ${today.getFullYear()}`,
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 5;
    doc.text(`Suelo: ${this.atributosNorma.clase_de_suelo.toUpperCase()}`,
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 8;

    let rowAdicional = 0;
    texto = "De conformidad con lo establecido en el acuerdo 04 de 2015 por medio del cual se adopta el Plan " +
      "de Ordenamiento Territorial “PASTO –Territorio Con Sentido”, el predio identificado con el código predial:";

    if (this.main.currentFeatures[0].attributes.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico"){
      texto = `Conforme a lo establecido en la Resolución Número 0452 de 2012, expedido por el Ministerio de Cultura “por la cual se aprueba `
        + `el Plan Especial de Manejo y Protección del Centro Histórico - PEMP de Pasto (Nariño) y su zona de influencia, declarado bien de `
        + `interés cultural del ámbito nacional” y De acuerdo a lo establecido en el Acuerdo 004 del 14 de abril de 2015, por medio del cual `
        + `se adopta el Plan de Ordenamiento Territorial del Municipio de Pasto 2015 - 2027  PASTO TERRITORIO CON - SENTIDO y de acuerdo al `
        + `Plan Especial de Manejo y Protección del Centro Histórico - PEMP de Pasto (Nariño), el predio identificado con el código catastral No.: `;
      
        rowAdicional = 10;
    }

    this.addTextoJustificado(doc, this.row, texto);

    this.row += 10 + rowAdicional;
    let codigo = this.main.printCode.substring(0, 5) + "  " + this.main.printCode.substring(5);
    let start_x = doc.internal.pageSize.width / 2;

    var pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    var wantedTableWidth = 65;
    var marginTable = (pageWidth - wantedTableWidth) / 2;

    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0, fontSize: 6 },
      margin: { top: 0, right: marginTable, left: marginTable, bottom: 0 },
      tableWidth: wantedTableWidth,
      headStyles: { minCellHeight: 2 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'normal', fontSize: 8, halign: 'left', cellWidth: 24 }, 1: { fontStyle: 'bold', fontSize: 9, halign: 'center' } },
      theme: 'grid',
      startX: start_x,
      startY: this.row,
      head: [],
      body: [["Número Predial:", codigo]]
    });

    this.row += 14;

    this.addTextoJustificado(doc, this.row, "Tiene el siguiente concepto de uso de suelo:");
    this.row += 6;

    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, fontSize: 6 },
      headStyles: { minCellHeight: 3 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'normal', fontSize: 8, halign: 'left' } },
      theme: 'grid',
      startX: 20,
      startY: this.row,
      head: [],
      body: [["USO DE SUELO"]]
    });

    this.row += 15;

    for (const criterio of this.criterios) {
      this.addTextoJustificado(doc, this.row, criterio);
      this.row += 7;
    }

    if (this.main.currentFeatures[0].attributes.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico"){
      for (const criterio of this.criteriosPEMP) {
        this.addTextoJustificado(doc, this.row, criterio);
        this.row += 7;
      }
    }

    this.row += 5;
    this.addTextoJustificado(doc, this.row, "Con base en lo anterior, la actividad económica con código CIIU");
    this.row += 3;

    let codCiuu = "";

    if (this.main.conceptForm.value.codCiiu.id_ciiu == 0) {
      codCiuu = "0000";
    }
    else {
      if (this.main.conceptForm.value.codCiiu.id_ciiu.toString().length == 4) {
        codCiuu = this.main.conceptForm.value.codCiiu.id_ciiu.toString();
      }
      else {
        if (this.main.conceptForm.value.codCiiu.id_ciiu.toString().length == 3) {
          codCiuu = "0" + this.main.conceptForm.value.codCiiu.id_ciiu.toString();
        }
        else {
          if (this.main.conceptForm.value.codCiiu.id_ciiu.toString().length == 2) {
            codCiuu = "00" + this.main.conceptForm.value.codCiiu.id_ciiu.toString();
          }
          else {
            if (this.main.conceptForm.value.codCiiu.id_ciiu.toString().length == 1) {
              codCiuu = "000" + this.main.conceptForm.value.codCiiu.id_ciiu.toString();
            }
          }
        }
      }
    }

    (doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
      headStyles: { minCellHeight: 3 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', fontSize: 12, halign: 'center', cellWidth: 30 }, 1: { fontStyle: 'normal', fontSize: 10, halign: 'left' } },
      theme: 'grid',
      startX: 20,
      startY: this.row,
      head: [],
      body: [[`${codCiuu}`, (doc as any).splitTextToSize(`${this.main.conceptForm.value.codCiiu.codigo.split(" - ")[1]}`, 100)]]
    });

    this.row += 20;

    for (const item of this.compatibilidadCiiu) {
      texto = `Para ${item.tipo_actividad} es:`;

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      this.addTextoJustificado(doc, this.row, texto);
      this.row += 8;

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');

      let compatibilidad = item.compatibilidad;
      if(compatibilidad != null){
        doc.text(`${item.compatibilidad.toUpperCase()}`, doc.internal.pageSize.width / 2, this.row, { align: 'center' });
      }
      else{
        doc.text(`-`, doc.internal.pageSize.width / 2, this.row, { align: 'center' });
      }
            
      this.row += 8;
    } //010200670001000

    this.row += 5;

    if (this.notasUso.length > 0){
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      this.addTextoJustificado(doc, this.row, 
        "De acuerdo con la tabla 7 del documento Técnico de soporte del PEMP, las condiciones del USO DE SUELO son:");
      this.row += 8;
  
      for (const item of this.notasUso) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        //this.addTextoJustificadoAjusteUltimaLinea(doc, this.row, item.nota);
        doc.text(item.nota, this.lMargin, this.row, { align: "left", maxWidth: this.pdfMaxWidth, lineHeightFactor: 1.8 });
        this.row += 8;
      }
    }
    
    if (this.row > 250) {
      this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
      this.main.addFooters(doc);

      this.newPage(doc, 35);
    } else {
      this.row += 6;
    }

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    const id_ciiu = this.main.conceptForm.value.codCiiu.id_ciiu;

    if (id_ciiu == 5630 || id_ciiu == 4724 || id_ciiu == 4711 || id_ciiu == 0) {
      //doc.setFont(undefined, 'bold');
      doc.setFontSize(6);
      doc.setFont(undefined, 'bold');
      this.addTextoJustificado(doc, this.row, "Observaciones:");
      this.row += 5;
      doc.setFont(undefined, 'normal');

      if (id_ciiu == 5630 || id_ciiu == 4724) {
        texto = "Restricciones: Los establecimientos de comercio en los cuales se realice consumo y/o venta de bebidas alcohólicas deberán dar estricto " +
          "cumplimiento a lo señalado en el artículo 306 del Plan de Ordenamiento Territorial, el cual señala: " +
          "Artículo 306. Restricciones a la implantación de usos. La implantación de nuevos establecimientos de comercio para consumo y/o venta de bebidas alcohólicas, " +
          "independiente de su denominación, queda restringida en el área de influencia de equipamientos de educación, " +
          "atención en salud, bienestar social y recreativos. " +
          "Para efectos del presente Acuerdo, el área de influencia corresponde a setenta (70) metros. \n\n" +
          "Parágrafo. - La implantación de nuevos equipamientos de educación, atención en salud, bienestar social y recreativos, " +
          "también estará condicionada a la restricción que se establece en el presente artículo. ";

        this.addTextoJustificadoAjusteUltimaLinea(doc, this.row, texto);
        this.row += 8;
      }
      else {
        if (id_ciiu == 4711) {
          texto = "Para GRANDES SUPERFICIES se requiere estudio con base en los requerimientos de los artículos 305 y 307 del acuerdo 004 del 2015.";
          this.addTextoJustificado(doc, this.row, texto);
          this.row += 8;
        }
        else {
          if (id_ciiu == 0) {
            texto = "NOTA: Esta nota soló aplica para Vivienda rural de acuerdo a la Unidad agrícola Familiar (UAF). del municipio. " +
              "Se entiende por UAF, la empresa básica de producción agrícola, pecuaria, acuícola o forestal cuya extensión, " +
              "conforme a las condiciones agroecológicas de la zona y con tecnología adecuada, " +
              "permite a la familia remunerar su trabajo y disponer de un excedente capitalizable que coadyuve a la formación de su patrimonio (Ley 160 de 1994).";

            this.addTextoJustificado(doc, this.row, texto);
            this.row += 8;
          }
        }
      }
    }

    doc.setFontSize(7);

    this.row += 8;

    doc.text(
      `Fecha de expedición: ${todayString}`,
      doc.internal.pageSize.width / 2,
      this.row,
      {
        align: 'center',
      }
    );

    this.row += 5;

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

    this.row += 10;
    texto = "El presente Concepto es el dictamen escrito por medio del cual la Secretaría de planeación municipal, " +
      "informa al interesado sobre el uso o usos permitidos en un predio o edificación, de conformidad con " +
      "las normas urbanísticas del Plan de Ordenamiento Territorial y los instrumentos que lo desarrollen. \n" +
      "La expedición de estos conceptos NO OTORGA DERECHOS NI OBLIGACIONES a su peticionario y no " +
      "modifica los derechos conferidos mediante licencias que estén vigentes o que hayan sido ejecutadas.\n\n\n" +
      "Nota: Cualquier inquietud u observación de este documento generado desde esta plataforma " +
      "dirigirse al correo electrónico unidaddecorrespondencia@pasto.gov.co";

    if (this.row > 250) {
      this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
      this.main.addFooters(doc);

      this.newPage(doc, 35);
    } else {
      this.row += 6;
    }

    this.addTextoJustificadoAjusteUltimaLinea(doc, this.row, texto);

    this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
    this.main.addFooters(doc);

    this.main.loading = false;

    return doc.output('blob');
  }

  public download2(): any {
    this.main.loading = true;
    this.lMargin = 15;
    this.rMargin = 15;
    this.pdfInMM = 210;
    this.pdfMaxWidth = this.pdfInMM - this.lMargin - this.rMargin;

    const doc = new jsPDF();

    doc.setFontSize(6);
    this.row = 30;
    let lines = "";

    // this.addTextoCentrado(doc, this.row, "CONCEPTO DE USO DE SUELO", true);
    // this.row += 10;

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

    const predioNacional = `No. Predial Nacional: ${this.atributosNorma.codigo_predial_nacional}`;
    doc.text(predioNacional, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 5;

    let texto = '';

    if (this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Histórico" ||
      this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico") {
      this.tablaMitad = true;

      texto = "De acuerdo a lo establecido en la Resolución Número  0452 de 2012, " +
        'expedido por el Ministerio de Cultura “por la cual se aprueba el Plan Especial de Manejo y Protección del  Centro  Histórico - PEMP  de  Pasto  (Nariño)  y  su  zona  de  influencia,  declarado  bien  de interés  cultural  del  ámbito  nacional”, ' +
        `el predio identificado con el código No.: ${this.main.printCode}.`;

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 10;
    }

    if (this.atributosNorma.zava_t_269_de_2015 == "Predio en ZAVA sentencia T-269 de 2015") {
      texto = "En cumplimiento a lo ordenado por el Consejo de Estado, " +
        "en el fallo proferido por la sala de lo contencioso Administrativo Sección Primera, " +
        "dentro de la Acción Popular No. 52001-23-33-000-2015-00607-0, " +
        `se informa que el predio identificado con el No. Predial: ${this.main.printCode}.`;

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 5;
    }

    if (this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Histórico" ||
      this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico") {
      this.tablaMitad = true;

      texto = "del  municipio  de  Pasto,  se  encuentra  en  la  zona  de  influencia  del  Centro Histórico.";

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 10;
    }

    if (this.atributosNorma.zava_t_269_de_2015 == "Predio en ZAVA sentencia T-269 de 2015") {
      texto = "Para la expedición y aprobación de LICENCIAS URBANÍSTICAS, " +
        "la respectiva Curaduría Urbana debe contemplar lo establecido y dispuesto por el Consejo de Estado, " +
        "en el fallo proferido por la sala de lo contencioso Administrativo Sección Primera, " +
        "dentro de la Acción Popular No. 52001-23-33-000-2015-00607-0, " +
        "relacionada con la suspensión de solicitudes de licencias de construcción en la zona de influencia alta del volcán Galeras, " +
        "de acuerdo con el nuevo Mapa de Amenaza Volcánica del Volcán Galeras, " +
        "elaborado por el Servicio Geológico Colombiano 2015.  " +
        "Actualización del Mapa de Amenaza Volcánica del Volcán Galeras - Colombia. En cumplimiento a la Sentencia de la Corte Constitucional T-269 de 2015.";

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 10;
    }

    if (this.atributosNorma.zava_t_269_de_2015 == "Predio en ZAVA sentencia T-269 de 2015") {
      texto = "De acuerdo al Plan Especial de Manejo y Protección del  Centro  Histórico - PEMP  de  Pasto  (Nariño), " +
        `el predio identificado con el No. Predial: ${this.main.printCode}.`;

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 15;
    }

    let localizacion = this.atributosNorma.direccion.trim();
    if (this.atributosNorma.barrio != null && this.atributosNorma.barrio != '') {
      localizacion += ' - ' + this.atributosNorma.barrio;
    }
    this.addTextoCentrado(doc, this.row, `ubicado en ${localizacion} de la siguiente manera:`, false);
    this.row += 8;

    // this.addTextoCentrado(doc, this.row, "En el Municipio de Pasto, se clasifica de la siguiente manera:", false);
    // this.row += 8;

    this.addTextoConValorLabelBold(doc, this.row, "Clase de suelo", this.atributosNorma.clase_de_suelo, true);
    this.row += 5;

    // if(this.tiposActividades.length == 0){
    //   this.addTextoLista(doc, this.row, `Ninguna.`);
    //   this.row += 5;
    // }
    // else{
    //   for (const tipo_actividad of this.tiposActividades) {
    //     this.addTextoLista(doc, this.row, `${tipo_actividad}.`);
    //     this.row += 5;
    //   } 
    // }

    let area_act = ''

    if (this.tiposActividades.length == 0) {
      area_act = 'Ninguna';
    }
    else {
      for (const tipo_actividad of this.tiposActividades) {
        area_act = this.tiposActividades[0];
      }
    }

    this.addTextoConValorLabelBold(doc, this.row, "Código Área Actividad", area_act, true);//010107610021000
    this.row += 5;

    this.addTextoConValorLabelBold(doc, this.row, "Uso", `${this.idsTiposActividades[0].replace(/[']/g, "")} ${area_act}`, true);
    this.row += 15;

    let arrayCompatibilidad = this.compatibilidadCiiu.filter(s => s.id_ciiu === this.main.conceptForm.value.codCiiu.id_ciiu)

    let usoCompatible = ''

    if (arrayCompatibilidad.length > 0) {
      usoCompatible = arrayCompatibilidad[0].compatibilidad;
    }

    texto = "De acuerdo a lo anterior, la actividad con el código CIIU: **" +
      this.main.conceptForm.value.codCiiu.codigo +
      `** y según el anexo AE2 del POT, la actividad es: **${usoCompatible}.**`;

    this.addTextoNormalNegrita(doc, this.row, texto);
    // //this.addTextoJustificado(doc, this.row, texto);
    this.row += 10;

    this.addTextoConValor(doc, this.row, "Restricciones", "", true);
    this.row += 5;

    if (this.restriccionesActividades.length == 0) {
      this.addTextoLista(doc, this.row, `No presenta restricciones.`);
    }
    else {
      for (const nota_uso of this.restriccionesActividades) {
        let notaUso = ''
        if (nota_uso.nota != 'Según el anexo AE2 del POT, la actividad es: ') {
          notaUso = nota_uso.nota

          this.addTextoLista(doc, this.row, `${notaUso}.`);
          this.row += 5;
        }

      }
    }

    if (this.row > 250) {
      this.newPage(doc, 30);
    } else {
      this.row += 10;
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

    const img = new Image();
    img.src = 'assets/images/Firma.png';
    doc.addImage(img, 'png', 67, this.row, 70, 30);
    this.row += 30;
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

    this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
    this.main.addFooters(doc);

    //let nombreArchivo = `Suelo Urbano ${this.code}.pdf`;
    //doc.save(nombreArchivo);

    this.main.loading = false;

    return doc.output('blob');
  }

  newPage(doc, value) {
    doc.addPage();
    this.main.addHeaders(doc, 'CONCEPTO DE NORMA URBANÍSTICA');
    this.main.addFooters(doc);
    this.row = value;
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

  addTextoNormalNegrita(doc: any, row: number, texto: string): void {
    let textMap = doc.splitTextToSize(
      texto,
      this.pdfMaxWidth
    );

    let lMarginTemp = this.lMargin;
    const startXCached = this.lMargin;
    let boldOpen = false;

    textMap.map((text, i) => {
      if (text) {
        const arrayOfNormalAndBoldText = text.split('**');
        const boldStr = 'bold';
        const normalOr = 'normal';
        arrayOfNormalAndBoldText.map((textItems, j) => {
          doc.setFont(undefined, boldOpen ? normalOr : boldStr);
          if (j % 2 === 0) {
            doc.setFont(undefined, boldOpen ? boldStr : normalOr);
          }
          doc.text(textItems, lMarginTemp, this.row);
          lMarginTemp = lMarginTemp + doc.getStringUnitWidth(textItems) * 2.2;
        });
        boldOpen = this.isBoldOpen(arrayOfNormalAndBoldText.length, boldOpen);
        lMarginTemp = startXCached;
        this.row += 3;
      }
    });
  }

  isBoldOpen = (arrayLength, valueBefore = false) => {
    const isEven = arrayLength % 2 === 0;
    const result = valueBefore !== isEven;

    return result;
  }

  addTextoCentrado(doc: any, row: number, texto: string, isBold: boolean): void {
    if (isBold) {
      doc.setFont(undefined, "bold");
    }

    doc.text(texto, doc.internal.pageSize.width / 2, this.row, {
      align: "center",
    });
    doc.setFont(undefined, "normal");
  }

  addTextoJustificado(doc: any, row: number, texto: string): void {
    const lines = doc.splitTextToSize(texto, this.pdfMaxWidth);
    doc.text(lines, this.lMargin, row, { align: "justify", maxWidth: this.pdfMaxWidth, lineHeightFactor: 1.5 });
  }

  addTextoJustificadoAjusteUltimaLinea(doc: any, row: number, texto: string): void {
    const lines = doc.splitTextToSize(texto, this.pdfMaxWidth);

    for (const line of lines) {
      if(line.length > this.pdfMaxWidth/2){
        doc.text(line, this.lMargin, this.row, { align: "justify", maxWidth: this.pdfMaxWidth, lineHeightFactor: 1.5 });        
      }
      else{
        doc.text(line, this.lMargin, this.row, { align: "left", maxWidth: this.pdfMaxWidth, lineHeightFactor: 1.5 });
      }
      this.row += 3
    }    
  }

  addTextoLista(doc: any, row: number, textoLabel: string): void {
    let val_col = 20;

    const lines = doc.splitTextToSize(" - " + textoLabel, this.pdfMaxWidth);
    doc.text(lines, val_col, this.row);
    doc.setFont(undefined, "normal");
  }

  addTextoConValorLabelBold(doc: any, row: number, textoLabel: string, textoValor?: string, isBold?: boolean, col?: number): void {
    let val_col = 55;

    if (isBold) {
      doc.setFont(undefined, "bold");
    }

    if (col) {
      val_col = col;
    }

    const lines = doc.splitTextToSize(textoLabel + ":", this.pdfMaxWidth);
    doc.text(lines, this.lMargin, this.row);

    doc.setFont(undefined, "normal");
    doc.text(textoValor, val_col, this.row, {
      align: "left",
    });
  }

  addTextoConValor(doc: any, row: number, textoLabel: string, textoValor?: string, isBold?: boolean, col?: number): void {
    let val_col = 55;

    if (isBold) {
      doc.setFont(undefined, "bold");
    }

    if (col) {
      val_col = col;
    }

    const lines = doc.splitTextToSize(textoLabel + ":", this.pdfMaxWidth);
    doc.text(lines, this.lMargin, this.row);
    doc.text(textoValor, val_col, this.row, {
      align: "left",
    });
    doc.setFont(undefined, "normal");
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
      startY: this.row
    })
  }

  validateCount() {
    this.countQueries++;
    console.log(this.countQueries);
    if (this.countQueries === this.maxQueries) {
      this.main.loading = false;
    }
  }

}
