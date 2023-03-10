import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class ConceptoNomenclatura {
  main: any;
  code: string;

  maxQueries: number;
  countQueries: number;

  lMargin: number;
  rMargin: number;
  pdfInMM: number;
  pdfMaxWidth: number;
  row: number;

  nomenclaturaEstratificacion: any;

  constructor(main: any) {
    this.main = main;
  }

  public query(): void {
    this.code = this.main.code;
    this.countQueries = 0;
    this.maxQueries = 1;
    this.main.loading = true;

    this.nomenclaturaEstratificacion = null;

    this.validateCount();
    this.getNomenclaturaEstratificacion();
  }

  getNomenclaturaEstratificacion() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `codigo_predial_anterior = '${this.code}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.NOMENCLATURA_SEVICE, queryParamas)
      .then((results) => {
        if (results.features.length > 0) {
          this.nomenclaturaEstratificacion = results.features[0].attributes;
        }
      });
  }

  download(): any {
    const lMargin = 15;
    const rMargin = 15;
    const pdfInMM = 210;

    const doc = new jsPDF();
    this.main.addHeaders(doc, 'CERTFICACIÓN');
    this.main.addFooters(doc);
    doc.setFontSize(8);
    this.row = 30;
    let lines = '';

    doc.setFont(undefined, 'bold');
    doc.text('CERTIFICADO DE NOMENCLATURA', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 3;
    doc.text('Suelo Urbano', doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 10;
    doc.text('EL SUSCRITO SUBSECRETARIO DE APLICACIÓN DE NORMAS URBANÍSTICAS DEL MUNICIPIO DE PASTO.',
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 10;

    doc.setFont(undefined, 'normal');
    lines = `Hace constar que, de conformidad con lo ordenado en la LEY 142 DE 1994, la Alcadía de Pasto, estableció al inmueble ubicado en el predio No `;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;

    doc.setFont(undefined, 'bold');
    doc.text(this.main.printCode, doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });
    this.row += 10;

    doc.setFont(undefined, 'bold');
    lines = `NOMENCLATURA ACTUAL (BASE DE DATOS PLANEACIÓN MUNICIPAL):`;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;

    doc.setFont(undefined, 'normal');
    lines = this.nomenclaturaEstratificacion.nomenclatura_secretaria_de_plan;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;

    doc.setFont(undefined, 'normal');
    lines = `Barrio: ${this.nomenclaturaEstratificacion.barrio}`;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 10;

    doc.setFont(undefined, 'bold');
    lines = `NOMENCLATURA SUMINISTRADA POR EL IGAC:`;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;

    doc.setFont(undefined, 'normal');
    lines = this.nomenclaturaEstratificacion.nomenclatura_igac;
    doc.text(lines, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 10;

    const text = `Se informa al usuario que la nomenclatura denominada “Nomenclatura Actual” es la asignación realizada por la Secretaría de Planeación Municipal en cumplimiento a la normatividad nacional vigente. De presentarse diferencia entre la nomenclatura suministrada por el Instituto Geográfico Agustín Codazzi - IGAC y la nomenclatura actual, el usuario debe realizar los trámites con las entidades competentes para que en los documentos donde se registre la nomenclatura suministrada por el IGAC se actualice a la “Nomenclatura Actual”. Si la nomenclatura suministrada por el Instituto Geográfico Agustín Codazzi - IGAC, no registra información, soló debe tener encuenta la Nomenclatura asignada por la Secretaría de Planeación Municipal.`;

    doc.setFont(undefined, 'normal');
    doc.text(text, lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 50;

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

    this.row += 3;

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

    doc.setFontSize(6);
    doc.text('Para su validez, este documento requiere estampillas según lo estípulado en el estatuto tributario Municipal vigente, salvo en las excepciones contempladas en el mismo.', lMargin, this.row, { maxWidth: 185, align: 'justify' });
    this.row += 5;

    this.main.loading = false;
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

}
