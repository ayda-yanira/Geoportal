import * as query from "@arcgis/core/rest/query";
import Query from "@arcgis/core/rest/support/Query";
import Graphic from "@arcgis/core/Graphic";

import "moment/locale/es";
import { environment } from "src/environments/environment";

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { LeadingComment } from "@angular/compiler";

export class SueloRural {
  main: any;
  atributosNorma: any;
  atributosRiesgoRural: any;
  atributosObservaciones: any;
  atributosObservacionesRiesgo: any;
  code: string;
  compatibilidad: string;

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
  public normaRural = [];
  public criterios = [];
  public condiciones = [];

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
    console.log(this.atributosNorma);

    if (this.idsTiposActividades.length == 0) {
      this.getAreaActividad();
    }
    this.getConsultaRiesgoRural();
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
          //this.atributosNorma = results.features[0].attributes;
          console.log(this.atributosRiesgoRural);
        }

        // if (this.atributosNorma.id_observacion_rural_restringid) {
        //   this.main.maxQueries++;
        //   this.getObservacionesTratamientoRural(this.atributosNorma.id_observacion_rural_restringid);
        // }

        // if (this.atributosNorma.id_observacion_rural_restringid) {
        //   this.main.maxQueries++;
        //   this.getObservacionesRiesgoTratamientoRural(this.atributosNorma.id_observacion_rural_restringid);
        // }

        this.validateCount();
      });
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

            console.log(this.idsTiposActividades);
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

  getTipoActividadRural(id) {
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
  // getObservacionesTratamientoRural(id) {
  //   const queryParamas = new Query();
  //   queryParamas.returnGeometry = true;
  //   queryParamas.outFields = ["*"];
  //   queryParamas.where = "id_observacion_riesgo_rural_res = '" + id + "'";
  //   queryParamas.outSpatialReference =
  //     this.main.mapService.getViewMap().spatialReference;

  //   query
  //     .executeQueryJSON(environment.OBS_TRATAMIENTO_RIESGO_RURAL_RESTRINGIDO_SERVICE, queryParamas)
  //     .then((results) => {
  //       if (results.features.length > 0) {
  //         for (const result of results.features) {
  //           if (results.features.length > 0) {
  //             this.atributosObservacionesRiesgo = results.features[0].attributes;
  //           }
  //         }
  //       }
  //       this.main.validatCount();
  //     });
  // }

  //eliminar
  // getObservacionesRiesgoTratamientoRural(id) {
  //   const queryParamas = new Query();
  //   queryParamas.returnGeometry = true;
  //   queryParamas.outFields = ["*"];
  //   queryParamas.where = "id_observacion_rural_restringid = '" + id + "'";
  //   queryParamas.outSpatialReference =
  //     this.main.mapService.getViewMap().spatialReference;

  //   query
  //     .executeQueryJSON(environment.OBS_TRATAMIENTO_RURAL_RESTRINGIDO_SERVICE, queryParamas)
  //     .then((results) => {
  //       if (results.features.length > 0) {
  //         for (const result of results.features) {
  //           if (results.features.length > 0) {
  //             this.atributosObservaciones = results.features[0].attributes;
  //           }
  //         }
  //       }
  //       this.main.validatCount();
  //     });
  // }

  //eliminar
  public download_old(): any {
    let listaIds = [this.main.conceptForm.value.codCiiu.id_ciiu];
    console.log(this.compatibilidadCiiu);
    console.log(this.compatibilidadCiiu.filter(s => s.id_ciiu === this.main.conceptForm.value.codCiiu.id_ciiu))

    const queryParamas = new Query();
    queryParamas.returnGeometry = false;
    queryParamas.outFields = ['id_ciiu'];
    queryParamas.returnDistinctValues = true;
    queryParamas.where = `id_tipo_actividad in (${listaIds})`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    Promise.all([
      query
        .executeQueryJSON(
          environment.COMPATIBILIDAD_ACTIVIDAD_SERVICE,
          queryParamas
        )
    ]).then(([results]) => {
      console.log(results);

      if (results.features.length > 0) {
        for (const feature of results.features) {
          this.compatibilidad = feature.attributes.compatibilidad;
        }

        //this.fillPdf();
      }
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
    doc.text(`Suelo: ${this.atributosNorma.clase_suelo.toUpperCase()}`,
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

    console.log(this.normaRural);
    console.log(this.compatibilidadCiiu);

    for (const criterio of this.criterios) {
      this.addTextoJustificado(doc, this.row, criterio);
      this.row += 7;
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
      doc.text(`${item.compatibilidad.toUpperCase()}`, doc.internal.pageSize.width / 2, this.row, { align: 'center' });
      this.row += 8;

      if (this.row > 250) {
        this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
        this.main.addFooters(doc);
  
        this.newPage(doc, 35);
      } else {
        this.row += 6;
      }
    }

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    if (this.condiciones.length > 0) {
      (doc as any).autoTable({
        styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, fontSize: 6 },
        headStyles: { minCellHeight: 3 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'normal', fontSize: 8, halign: 'left' } },
        theme: 'grid',
        startX: 20,
        startY: this.row,
        head: [],
        body: [["CONDICIONES"]]
      });

      this.row += 12;

      let textoCondiciones = "";
      for (const condicion of this.condiciones) {
        textoCondiciones += condicion + ", ";
      }

      this.addTextoJustificado(doc, this.row, `Áreas en condición de riesgo alto: ${textoCondiciones.toUpperCase()}`);
      this.row += 8;    //000100580052000
    }

    if (this.row > 250) {
      this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
      this.main.addFooters(doc);

      this.newPage(doc, 35);
    } else {
      this.row += 6;
    }

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

    this.row += 10; //000100320406000

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

    //this.addTextoCentrado(doc, this.row, "CONCEPTO DE USO DE SUELO", true);
    //this.row += 10;

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

    // if (this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Histórico" ||
    //   this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico") {
    //   this.tablaMitad = true;

    //   texto = "De acuerdo a lo establecido en la Resolución Número  0452 de 2012, " +
    //     'expedido por el Ministerio de Cultura “por la cual se aprueba el Plan Especial de Manejo y Protección del  Centro  Histórico - PEMP  de  Pasto  (Nariño)  y  su  zona  de  influencia,  declarado  bien  de interés  cultural  del  ámbito  nacional”, ' +
    //     `el predio identificado con el código No.: ${this.code}.`;

    //   this.addTextoJustificado(doc, row, texto);
    //   row += 10;
    // }

    if (this.atributosRiesgoRural.zava_t_269_2015 == "Predio en ZAVA sentencia T-269 de 2015") {
      texto = "En cumplimiento a lo ordenado por el Consejo de Estado, " +
        "en el fallo proferido por la sala de lo contencioso Administrativo Sección Primera, " +
        "dentro de la Acción Popular No. 52001-23-33-000-2015-00607-0, " +
        `se informa que el predio identificado con el No. Predial: ${this.main.printCode}.`;

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 10;
    }

    // if (this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Histórico" ||
    //   this.atributosNorma.codigo_morfologico_de_alturas == "Alturas reguladas en el PEMP Centro Historico") {
    //   this.tablaMitad = true;

    //   texto = "del  municipio  de  Pasto,  se  encuentra  en  la  zona  de  influencia  del  Centro Histórico.";

    //   this.addTextoJustificado(doc, row, texto);
    //   row += 10;
    // }

    if (this.atributosRiesgoRural.zava_t_269_2015 == "Predio en ZAVA sentencia T-269 de 2015") {
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

    if (this.atributosRiesgoRural.zava_t_269_2015 == "Predio en ZAVA sentencia T-269 de 2015") {
      texto = "De acuerdo al Plan Especial de Manejo y Protección del  Centro  Histórico - PEMP  de  Pasto  (Nariño), " +
        `el predio identificado con el No. Predial: ${this.main.printCode}.`;

      this.addTextoJustificado(doc, this.row, texto);
      this.row += 15;
    }

    let localizacion = this.atributosNorma.corregimiento;
    // if (this.atributosNorma.corregimiento != null && this.atributosNorma.corregimiento != '') {
    //   localizacion += ' - ' + this.atributosNorma.corregimiento;
    // }
    this.addTextoCentrado(doc, this.row, `ubicado en ${localizacion} de la siguiente manera:`, false);
    this.row += 8;

    // this.addTextoCentrado(doc, this.row, "En el Municipio de Pasto, se clasifica de la siguiente manera:", false);
    // this.row += 8;

    this.addTextoConValor(doc, this.row, "Clase de suelo", this.atributosNorma.clase_suelo);
    this.row += 8;
    this.addTextoConValor(doc, this.row, "Categoría(s) de uso", "", true);
    this.row += 5;

    if (this.tiposActividades.length == 0) {
      this.addTextoLista(doc, this.row, `Ninguna.`);
      this.row += 5;
    }
    else {
      const uniqueIds = [];

      const uniqueTiposActividades = this.tiposActividades.filter(element => {
        const isDuplicate = uniqueIds.includes(element);

        if (!isDuplicate) {
          if (element != 'No aplica') {
            uniqueIds.push(element);
            return true;
          }
        }

        return false;
      });

      for (const tipo_actividad of uniqueTiposActividades) {
        this.addTextoLista(doc, this.row, `${tipo_actividad}.`);
        this.row += 5;
      }
    }
    this.row += 5;

    // this.compatibilidadCiiu.filter(s => s.id_ciiu === this.main.conceptForm.value.codCiiu.id_ciiu)

    // texto = "De acuerdo a lo anterior, la actividad con el código CIIU: **" +
    //   this.main.conceptForm.value.codCiiu.codigo +
    //   `** y según el anexo AE1 /AE4 del POT, el predio ${this.code} tiene el siguiente uso: **${this.compatibilidadCiiu[0].compatibilidad}.**`;

    // this.addTextoNormalNegrita(doc, this.row, texto);
    //this.addTextoJustificado(doc, row, texto);
    this.row += 10;

    this.addTextoConValor(doc, this.row, "Restricciones", "", true);
    this.row += 5;

    if (this.restriccionesActividades.length == 0) {
      this.addTextoLista(doc, this.row, `No presenta restricciones.`);
    }
    else {
      for (const nota_uso of this.restriccionesActividades) {
        this.addTextoLista(doc, this.row, `${nota_uso.nota}.`);
        this.row += 5;
      }
    }

    // this.addTextoCentrado(doc, row, "En el Municipio de Pasto, se clasifica de la siguiente manera:", false);
    // row += 8;

    // this.addTextoCentrado(doc, row, "AFECTACIONES", true);
    // row += 4;

    // (doc as any).autoTable({
    //   styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
    //   headStyles: { col1: { halign: 'center' } },
    //   theme: 'grid',
    //   columns: [
    //     { header: 'Áreas de la estructura ecológica municipal', dataKey: 'col1' },
    //     { header: 'Condición de riesgo Alto', dataKey: 'col2' },
    //     { header: 'Condición de Riesgo Remoción Masa', dataKey: 'col3' },
    //     { header: 'Condición de Riesgo Volcánico', dataKey: 'col4' },
    //     { header: 'Condición de Riesgo Subsidencia', dataKey: 'col5' },
    //     { header: 'Línea de Alta Tensión', dataKey: 'col6' }
    //   ],
    //   body: [
    //     { col1: this.atributosNorma.areas_de_la_estructura_ecologic, 
    //       col2: this.atributosNorma.condicion_de_riesgo_alto, 
    //       col3: this.atributosRiesgoRural.remocion_en_masa_ea19, 
    //       col4: this.atributosRiesgoRural.riesgo_volcanico_ea27, 
    //       col5: this.atributosRiesgoRural.subsidencia_ea29, 
    //       col6: this.atributosRiesgoRural.lineas_alta_tension_ea31
    //     }
    //   ],      
    //   startY: row
    // })
    // row += 30;

    // this.addTextoCentrado(doc, row, "OBSERVACIONES", true);
    // row += 4;

    // let observacionesArray = [      
    //   ['Riesgo volcánico', this.atributosObservacionesRiesgo.area_amenaza_riesgo_rural_restr],
    //   ['Riesgo por inundación - Medio', this.atributosObservacionesRiesgo.area_amenaza_riesgo_rural_restr],
    //   ['Riesgo por inundación - Alto', this.atributosObservacionesRiesgo.area_amenaza_riesgo_rural_restr],
    //   ['Subsidencia', this.atributosObservacionesRiesgo.area_amenaza_riesgo_rural_restr],
    //   ['Línea alta tensión', this.atributosObservacionesRiesgo.area_amenaza_riesgo_rural_restr],
    //   ['Flujo de masa', this.atributosObservacionesRiesgo.area_amenaza_riesgo_rural_restr],
    // ];

    // (doc as any).autoTable({
    //   styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3, fontSize: 6 },
    //   columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    //   margin: { top: 10 },
    //   body: observacionesArray,
    //   pageBreak: 'auto',
    //   rowPageBreak: 'avoid',
    //   startY: row
    // })		

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

    this.main.loading = false;

    return doc.output('blob');
  }

  newPage(doc, value) {
    doc.addPage();
    this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
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
          doc.text(textItems, lMarginTemp, row);
          lMarginTemp = lMarginTemp + doc.getStringUnitWidth(textItems) * 2.2;
        });
        boldOpen = this.isBoldOpen(arrayOfNormalAndBoldText.length, boldOpen);
        lMarginTemp = startXCached;
        row += 3;
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

    doc.text(texto, doc.internal.pageSize.width / 2, row, {
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
    doc.text(lines, val_col, row);
    doc.setFont(undefined, "normal");
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
    doc.text(lines, this.lMargin, row);
    doc.text(textoValor, val_col, row, {
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
      startY: row
    })
  }

  addHeaders(doc: any): void {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(0);
      doc.setFillColor(255, 255, 255);
      doc.rect(5, 2, 40, 20, "FD");
      doc.rect(40, 2, 165, 20, "FD");
      const img = new Image();
      img.src = "assets/images/logo_municipio.png";
      doc.addImage(img, "png", 13, 3, 18, 18);
      doc.setFontSize(6);
      doc.setFont(undefined, "bold");
      const col = doc.internal.pageSize.width / 2 + 20;
      doc.text("PROCESO GESTION DE ORDENAMIENTO TERRITORIAL", col, 5, {
        align: "center",
      });
      doc.setFontSize(6);
      doc.setFont(undefined, "normal");
      doc.text("NOMBRE DEL FORMATO", col, 9, {
        align: "center",
      });
      doc.setFontSize(6);
      doc.setFont(undefined, "bold");
      doc.text("CONCEPTO DE NORMA URBANÍSTICA", col, 13, {
        align: "center",
      });
      doc.setFontSize(6);
      doc.text("VIGENCIA", 42, 18, {
        align: "left",
      });
      doc.text("VERSION", 92, 18, {
        align: "left",
      });
      doc.text("CODIGO", 142, 18, {
        align: "left",
      });
      doc.text("CONSECUTIVO", 188, 18, {
        align: "left",
      });
      doc.text("7-oct-16", 43, 21, {
        align: "left",
      });
      doc.text("01", 95, 21, {
        align: "left",
      });
      doc.text("GOT-F-009", 141, 21, {
        align: "left",
      });
      doc.text("8033", 192, 21, {
        align: "left",
      });
    }
  }

  addFooters(doc: any): void {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const img = new Image();
      img.src = "assets/images/logo_footer.png";
      doc.addImage(img, "png", 120, 280);
    }
  }

}
