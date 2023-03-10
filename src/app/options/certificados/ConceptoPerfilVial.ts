import * as query from '@arcgis/core/rest/query';
import Query from '@arcgis/core/rest/support/Query';

import 'moment/locale/es';
import { environment } from 'src/environments/environment';
import { jsPDF } from "jspdf";
export class ConceptoPerfilVial {
	main: any;
	atributosNorma: any;
	code: string;

  maxQueries: number;
  countQueries: number;

	lMargin: number;
  rMargin: number;
  pdfInMM: number;
  pdfMaxWidth: number;
  row: number;

  perfilesViales: any;

  CARDINALIDAD = {
    N: 'NORTE',
    S: 'SUR',
    E: 'ESTE',
    O: 'OESTE',
    NE: 'NORESTE',
    NO: 'NOROESTE',
    SE: 'SURESTE',
    SO: 'SUROESTE'
  }

	constructor(main: any) {
		this.main = main;
	}

	public query(): void {
		this.code = this.main.code;
		this.countQueries = 0;
		this.maxQueries = 2;
		this.main.loading = true;
		this.validateCount();
		this.atributosNorma = this.main.currentFeatures[0].attributes;

    this.getConsultaPerfilesViales();

		this.main.loading = false;
	}

  getConsultaPerfilesViales() {
    const queryParamas = new Query();
    queryParamas.returnGeometry = true;
    queryParamas.outFields = ['*'];
    queryParamas.where = `codigo_predial_anterior = '${this.code}'`;
    queryParamas.outSpatialReference =
      this.main.mapService.getViewMap().spatialReference;

    query
      .executeQueryJSON(environment.PERFIL_VIAL_SERVICE, queryParamas)
      .then((results) => {
        this.validateCount();
        if (results.features.length > 0) {
          this.perfilesViales = results.features;
        }
      });
  }

	public download(): any {
		this.main.loading = true;
		this.lMargin = 15;
		this.rMargin = 15;
		this.pdfInMM = 210;
		this.pdfMaxWidth = this.pdfInMM - this.lMargin - this.rMargin;

    console.log('this.perfilesViales');
    console.log(this.perfilesViales);
	
		const doc = new jsPDF();
	
		doc.setFontSize(10);
		this.row = 40;
		let lines = "";
		let texto = "";

		const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const todayString = today.toLocaleDateString('es-ES', options);

    doc.setFont(undefined, 'bold');
    doc.text('CONCEPTO DE PERFIL VIAL',
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

    this.row += 10;

		texto = `De acuerdo a lo establecido en el Acuerdo 004 del 14 de abril de 2015, por medio del cual se adopta el PLAN DE ORDENAMIENTO `
        + `TERRITORIAL DEL MUNICIPIO DE PASTO 2015 – 2027 PASTO TERRITORIO CON-SENTIDO, el PERFIL VIAL del predio identificado con el `
        + `código predial No. ${this.main.printCode.substring(5)} del municipio de Pasto se especifica de la siguiente manera: `;

    this.addTextoJustificado(doc, this.row, texto);

		this.row += 20;

		doc.setFont(undefined, 'bold');
    doc.text('PERFILES VIALES',
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

    this.row += 6;

    let distanciaEntreParamentos = '-';
    let nombreVia = '-';
    let jerarquiaVial = '-';
    let p1_orientacionIndividual, p2_orientacionIndividual = '-';

    let p1_nombrePerfilVial, p2_nombrePerfilVial = '-';
    let p1_distanciaAlEje, p2_distanciaAlEje = '-';
    let p1_antejardin, p2_antejardin = '-'; //1
    let p1_bahiaParqueo, p2_bahiaParqueo = '-'; //2
    let p1_anden_a, p2_anden_a = '-'; //3
    let p1_franjaAmbiental_a, p2_franjaAmbiental_a = '-'; //4
    let p1_calzadaVehicular_a, p2_calzadaVehicular_a = '-'; //5
    let p1_franjaAmbiental_a_2, p2_franjaAmbiental_a_2 = '-'; //6
    let p1_calzadaVehicular_a_2, p2_calzadaVehicular_a_2 = '-'; //7
    let p1_separador, p2_separador = '-'; //8
    let p1_calzadaVehicular_b, p2_calzadaVehicular_b = '-'; //9
    let p1_franjaAmbiental_b, p2_franjaAmbiental_b = '-'; //10
    let p1_calzadaVehicular_b_2, p2_calzadaVehicular_b_2 = '-'; //11
    let p1_franjaAmbiental_b_2, p2_franjaAmbiental_b_2 = '-'; //12
    let p1_cicloruta, p2_cicloruta = '-'; //13
    let p1_anden_b, p2_anden_b = '-'; //14
    let p1_antejardin_2, p2_antejardin_2 = '-'; //15
    //Otros
    let p1_anden_a_2, p2_anden_a_2 = '-';    

    if(this.perfilesViales.length > 0){
      distanciaEntreParamentos = this.perfilesViales[0].attributes.distancia_entre_paramentos;
      nombreVia = this.perfilesViales[0].attributes.via;
      jerarquiaVial = this.perfilesViales[0].attributes.jerarquia_vial_plano_efs11_y_ef;

      //Perfil 1
      p1_orientacionIndividual = this.CARDINALIDAD[`${this.perfilesViales[0].attributes.orientacion_individual}`];
      p1_nombrePerfilVial = this.perfilesViales[0].attributes.nombre_perfil_vial;
      p1_distanciaAlEje = this.perfilesViales[0].attributes.distancia_al_eje;
      p1_antejardin = this.perfilesViales[0].attributes.antejardin; //1
      p1_bahiaParqueo = this.perfilesViales[0].attributes.bahia_de_parqueadero; //2      
      p1_anden_a = this.perfilesViales[0].attributes.anden_a; //3
      p1_franjaAmbiental_a = this.perfilesViales[0].attributes.franja_ambiental_a; //4
      p1_calzadaVehicular_a = this.perfilesViales[0].attributes.calzada_vehicular_a;//5
      p1_franjaAmbiental_a_2 = this.perfilesViales[0].attributes.franja_ambiental_a_2; //6
      p1_calzadaVehicular_a_2 = this.perfilesViales[0].attributes.calzada_vehicular_a_2; //7
      p1_separador = this.perfilesViales[0].attributes.separador; //8
      p1_calzadaVehicular_b = this.perfilesViales[0].attributes.calzada_vehicular_b; //9
      p1_franjaAmbiental_b = this.perfilesViales[0].attributes.franja_ambiental_b; //10      
      p1_calzadaVehicular_b_2 = this.perfilesViales[0].attributes.calzada_vehicular_b_2; //11
      p1_franjaAmbiental_b_2 = this.perfilesViales[0].attributes.franja_ambiental_b_2; //12
      p1_cicloruta = this.perfilesViales[0].attributes.ciclo_ruta; //13
      p1_anden_b = this.perfilesViales[0].attributes.anden_b; //14
      p1_antejardin_2 = this.perfilesViales[0].attributes.antejardin_2; //15
      p1_anden_a_2 = this.perfilesViales[0].attributes.anden_a_2;   

      if(this.perfilesViales.length > 1){
        //Perfil 2
        p2_orientacionIndividual = this.CARDINALIDAD[`${this.perfilesViales[1].attributes.orientacion_individual}`];
        p2_nombrePerfilVial = this.perfilesViales[1].attributes.nombre_perfil_vial;
        p2_distanciaAlEje = this.perfilesViales[1].attributes.distancia_al_eje;
        p2_antejardin = this.perfilesViales[1].attributes.antejardin; //1
        p2_bahiaParqueo = this.perfilesViales[1].attributes.bahia_de_parqueadero; //2      
        p2_anden_a = this.perfilesViales[1].attributes.anden_a; //3
        p2_franjaAmbiental_a = this.perfilesViales[1].attributes.franja_ambiental_a; //4
        p2_calzadaVehicular_a = this.perfilesViales[1].attributes.calzada_vehicular_a;//5
        p2_franjaAmbiental_a_2 = this.perfilesViales[1].attributes.franja_ambiental_a_2; //6
        p2_calzadaVehicular_a_2 = this.perfilesViales[1].attributes.calzada_vehicular_a_2; //7
        p2_separador = this.perfilesViales[1].attributes.separador; //8
        p2_calzadaVehicular_b = this.perfilesViales[1].attributes.calzada_vehicular_b; //9
        p2_franjaAmbiental_b = this.perfilesViales[1].attributes.franja_ambiental_b; //10      
        p2_calzadaVehicular_b_2 = this.perfilesViales[1].attributes.calzada_vehicular_b_2; //11
        p2_franjaAmbiental_b_2 = this.perfilesViales[1].attributes.franja_ambiental_b_2; //12
        p2_cicloruta = this.perfilesViales[1].attributes.ciclo_ruta; //13
        p2_anden_b = this.perfilesViales[1].attributes.anden_b; //14
        p2_antejardin_2 = this.perfilesViales[1].attributes.antejardin_2; //15
        p2_anden_a_2 = this.perfilesViales[1].attributes.anden_a_2;  
      }
    }

    let orientacionArray = [      
      ['0', 'NOMBRE PERFIL VIAL', p1_nombrePerfilVial, p2_nombrePerfilVial],
      ['0', 'DISTANCIA AL EJE', p1_distanciaAlEje, p2_distanciaAlEje],
      ['1', 'ANTEJARDIN', p1_antejardin, p2_antejardin], //1
      ['2', 'BAHÍA DE PARQUEO', p1_bahiaParqueo, p2_bahiaParqueo], //2
      ['3', 'ANDEN A', p1_anden_a, p2_anden_a], //3
      ['4', 'FRANJA AMBIENTAL A', p1_franjaAmbiental_a, p2_franjaAmbiental_a], //4
      ['5', 'CALZADA VEHICULAR A', p1_calzadaVehicular_a, p2_calzadaVehicular_a], //5
      ['6', 'FRANJA AMBIENTAL A2', p1_franjaAmbiental_a_2, p2_franjaAmbiental_a_2], //6
      ['7', 'CALZADA VEHICULAR A2', p1_calzadaVehicular_a_2, p2_calzadaVehicular_a_2], //7
      ['8', 'SEPARADOR', p1_separador, p2_separador], //8
      ['9', 'CALZADA VEHICULAR B', p1_calzadaVehicular_b, p2_calzadaVehicular_b], //9
      ['10', 'FRANJA AMBIENTAL B', p1_franjaAmbiental_b, p2_franjaAmbiental_b], //10
      ['11', 'CALZADA VEHICULAR B2', p1_calzadaVehicular_b_2, p2_calzadaVehicular_b_2], //11
      ['12', 'FRANJA AMBIENTAL B2', p1_franjaAmbiental_b_2, p2_franjaAmbiental_b_2], //12
      ['13', 'CICLORUTA', p1_cicloruta, p2_cicloruta], //13
      ['14', 'ANDEN B', p1_anden_b, p2_anden_b], //14
      ['15', 'ANTEJARDIN 2', p1_antejardin_2, p2_antejardin_2], //15
      ['0', 'ANDEN A2', p1_anden_a_2, p2_anden_a_2], //15
    ];

    const p1_orientacionFilteredArray = [];
    const p2_orientacionFilteredArray = [];
    const p1_elementosArray = [];
    const p2_elementosArray = [];

    // orientacionArray = orientacionArray.filter((element) => {
    //   return element[2] !== 'No aplica';
    // });

    // console.log(orientacionArray);
    const textoExcluyente = ["-", "No aplica", "Por visitar"];
    orientacionArray.filter(element => {
      if (!textoExcluyente.includes(element[2])){
        p1_elementosArray.push([element[0]]);
        p1_orientacionFilteredArray.push([element[1], element[2]]);
      } 

      if (!textoExcluyente.includes(element[3])){
        p2_elementosArray.push([element[0]]);
        p2_orientacionFilteredArray.push([element[1], element[3]]);
      } 
    });

    console.log('p1_orientacionFilteredArray');
    console.log(p1_orientacionFilteredArray.length);

    console.log('p2_orientacionFilteredArray');
    console.log(p2_orientacionFilteredArray.length);

		let perfilesArray = [      
      ['TIPO DE VÍA', jerarquiaVial],
      ['ORIENTACIÓN INDIVIDUAL', p1_orientacionIndividual],
      ['DISTANCIA DEL PARAMENTO SOLICITADO AL EJE', distanciaEntreParamentos],
      ['NOMBRE DE LA VÍA', nombreVia],
    ];

		(doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.0, fontSize: 6 },
      headStyles: { minCellHeight: 2 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', fontSize: 6, halign: 'left', cellWidth: 60 }, 1: { fontStyle: 'normal', fontSize: 6, halign: 'left' } },
      theme: 'grid',
      startX: 20,
      startY: this.row,
      head: [],
      body: perfilesArray
    });

		this.row += perfilesArray.length * 7;

		let imgWidth = 160; 
		let imgHeight = imgWidth / 3;

		const imgPerfil = new Image();
    imgPerfil.src = 'assets/images/perfiles_viales/perfil_vial.jpeg';
    doc.addImage(imgPerfil, 'jpeg', (doc.internal.pageSize.width / 2) - (imgWidth / 2), this.row, imgWidth, imgHeight);
    this.row += imgHeight + 3;
		
		doc.setFont(undefined, 'normal');
		doc.setFontSize(6);

		doc.text('Esta imagen es una representación de los elementos que puede incluir un perfil vial, mas no corresponde necesariamente al caso concreto',
      doc.internal.pageSize.width / 2, this.row, {
      align: 'center',
    });

		this.row += 6;

		let tableWidth = 8;
		(doc as any).autoTable({
      styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], lineColor: [255, 255, 255], lineWidth: 0.2, fontSize: 6 },
			tableWidth,
      headStyles: { minCellHeight: 2, halign: 'center', fillColor: [255, 255, 255] },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', fontSize: 6, halign: 'center' }},
      theme: 'grid',
      startX: 20,
      startY: this.row,
      head: [{id:{content: 'N', styles: {halign: 'center', fontSize: 8}}}],
      body: p1_elementosArray,
      didParseCell: hookData => {
        if(hookData.cell.raw == "0"){
          hookData.cell.text = "";
          hookData.cell.styles.fillColor = [255, 255, 255];
        }
      }
    });

		tableWidth = 60;
		(doc as any).autoTable({
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, fontSize: 6 },
			tableWidth,
      headStyles: { minCellHeight: 2, halign: 'center' },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold', fontSize: 6, halign: 'left', cellWidth: (tableWidth / 2) + 5 }, 1: { fontStyle: 'normal', fontSize: 6, halign: 'left' } },
      margin: {left: 22},
      theme: 'grid',
      startX: 20,
      startY: this.row,
      head: [{id:{content: `Orientación 1: ${p1_orientacionIndividual}`, colSpan: 2, styles: {halign: 'center', fontSize: 8}}}],
      body: p1_orientacionFilteredArray
    });

    if(p2_orientacionFilteredArray.length > 0){
      tableWidth = 8;
      (doc as any).autoTable({
        styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], lineColor: [255, 255, 255], lineWidth: 0.2, fontSize: 6 },
        tableWidth,
        headStyles: { minCellHeight: 2, halign: 'center', fillColor: [255, 255, 255] },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', fontSize: 6, halign: 'center' }},
        margin: {left: 120},
        theme: 'grid',
        startX: 20,
        startY: this.row,
        head: [{id:{content: 'N', styles: {halign: 'center', fontSize: 8}}}],
        body: p2_elementosArray,
        didParseCell: hookData => {
          if(hookData.cell.raw == "0"){
            hookData.cell.text = "";
            hookData.cell.styles.fillColor = [255, 255, 255];
          }
        }
      });

      tableWidth = 60;
      (doc as any).autoTable({
        styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, fontSize: 6 },
        tableWidth,
        headStyles: { minCellHeight: 2, halign: 'center' },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', fontSize: 6, halign: 'left', cellWidth: (tableWidth / 2) + 5 }, 1: { fontStyle: 'normal', fontSize: 6, halign: 'left' } },
        margin: {left: 128},
        theme: 'grid',
        startX: 20,
        startY: this.row,
        head: [{id:{content: `Orientación 2: ${p2_orientacionIndividual}`, colSpan: 2, styles: {halign: 'center', fontSize: 8}}}],
        body: p2_orientacionFilteredArray
      });
    }

    let sizeTabla = p1_orientacionFilteredArray.length;
    if(p2_orientacionFilteredArray.length > sizeTabla){
      sizeTabla = p2_orientacionFilteredArray.length;
    }

    this.row += sizeTabla * 8;

    if (this.row > 250) {
      this.main.addHeaders(doc, 'CONCEPTO DE USO DE SUELO');
      this.main.addFooters(doc);

      this.newPage(doc, 35);
    } else {
      this.row += 6;
    }

		doc.setFontSize(7);
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

		doc.setFontSize(6);
    this.row += 16;
		
    doc.setFont(undefined, 'normal');
    const notaTexto = 'Nota: Cualquier inquietud u observación de este documento generado desde esta plataforma '
      + 'dirigirse al correo electrónico unidaddecorrespondencia@pasto.gov.co';
    doc.text(notaTexto.replace(/(\r\n|\n|\r)/gm, ''),
			this.lMargin, this.row, { maxWidth: 185, align: 'justify' });

		this.main.addHeaders(doc, 'CONCEPTO DE PERFIL VIAL');
    this.main.addFooters(doc);

    this.main.loading = false;

    return doc.output('blob');
	}

	newPage(doc, value) {
    doc.addPage();
    this.main.addHeaders(doc, 'CONCEPTO DE PERFIL VIAL');
    this.main.addFooters(doc);
    this.row = value;
  }

	addTextoJustificado(doc: any, row: number, texto: string): void {
    const lines = doc.splitTextToSize(texto, this.pdfMaxWidth);
    doc.text(lines, this.lMargin, row, { align: "justify", maxWidth: this.pdfMaxWidth, lineHeightFactor: 1.5 });
  }

	validateCount() {
		this.countQueries++;
		console.log(this.countQueries);
		if (this.countQueries === this.maxQueries) {
			this.main.loading = false;
		}
	}
}
