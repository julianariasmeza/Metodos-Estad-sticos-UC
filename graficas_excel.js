/* Inserción de gráficas PNG en archivos Excel XLSX */

async function agregarGraficasExcel(archivo, calculos) {
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip no está disponible.");
  }

  const zip = await JSZip.loadAsync(archivo);
  const tipos = [];

  for (let i = 0; i < calculos.length; i++) {
    const calculo = calculos[i];

    if (!calculo.img || !calculo.img.startsWith("data:image/png;base64,")) {
      continue;
    }

    const imagen = calculo.img.split(",")[1];
    const numero = i + 1;

    zip.file(`xl/media/grafica${numero}.png`, imagen, {
      base64: true
    });

    const dibujo = `xl/drawings/drawing${numero}.xml`;
    const relacion = `xl/drawings/_rels/drawing${numero}.xml.rels`;
    const hoja = `xl/worksheets/sheet${numero}.xml`;
    const relacionHoja =
      `xl/worksheets/_rels/sheet${numero}.xml.rels`;

    const xmlDibujo = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<xdr:oneCellAnchor>
<xdr:from><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:ext cx="7620000" cy="3429000"/>
<xdr:pic>
<xdr:nvPicPr><xdr:cNvPr id="1" name="Gráfica estadística"/>
<xdr:cNvPicPr/></xdr:nvPicPr>
<xdr:blipFill>
<a:blip r:embed="rId1"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
<a:stretch><a:fillRect/></a:stretch>
</xdr:blipFill>
<xdr:spPr><a:xfrm><a:off x="0" y="0"/>
<a:ext cx="7620000" cy="3429000"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:oneCellAnchor>
</xdr:wsDr>`;

    zip.file(dibujo, xmlDibujo);

    zip.file(relacion, `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
 Target="../media/grafica${numero}.png"/>
</Relationships>`);

    const contenidoHoja = await zip.file(hoja).async("string");

    zip.file(
      hoja,
      contenidoHoja.replace(
        "</worksheet>",
        `<drawing r:id="rIdGrafica" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></worksheet>`
      )
    );

    const relacionExistente = zip.file(relacionHoja);

    const nuevaRelacion = `<Relationship Id="rIdGrafica"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"
 Target="../drawings/drawing${numero}.xml"/>`;

    if (relacionExistente) {
      const xmlRelaciones = await relacionExistente.async("string");

      zip.file(
        relacionHoja,
        xmlRelaciones.replace(
          "</Relationships>",
          nuevaRelacion + "</Relationships>"
        )
      );
    } else {
      zip.file(relacionHoja, `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${nuevaRelacion}
</Relationships>`);
    }

    // Agregar gráfico XY nativo para distribuciones normales
    const tipo = calculo.datosExcel?.tipo;

    if (tipo !== "binomial" && tipo !== "poisson") {
      zip.file(
        `xl/charts/chart${numero}.xml`,
        crearGraficoNormalExcel(numero, tipo)
      );

      const relacionDibujo = await zip.file(relacion).async("string");

      zip.file(
        relacion,
        relacionDibujo.replace(
          "</Relationships>",
          `<Relationship Id="rId2"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"
 Target="../charts/chart${numero}.xml"/>
</Relationships>`
        )
      );

      const dibujoActual = await zip.file(dibujo).async("string");

      const anclaGrafico = `
<xdr:oneCellAnchor>
<xdr:from>
<xdr:col>11</xdr:col><xdr:colOff>0</xdr:colOff>
<xdr:row>4</xdr:row><xdr:rowOff>0</xdr:rowOff>
</xdr:from>
<xdr:ext cx="7620000" cy="3429000"/>
<xdr:graphicFrame macro="">
<xdr:nvGraphicFramePr>
<xdr:cNvPr id="2" name="Gráfico normal dinámico"/>
<xdr:cNvGraphicFramePr/>
</xdr:nvGraphicFramePr>
<xdr:xfrm>
<a:off x="0" y="0"/>
<a:ext cx="7620000" cy="3429000"/>
</xdr:xfrm>
<a:graphic>
<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 r:id="rId2"/>
</a:graphicData>
</a:graphic>
</xdr:graphicFrame>
<xdr:clientData/>
</xdr:oneCellAnchor>`;

      zip.file(
        dibujo,
        dibujoActual.replace(
          "</xdr:wsDr>",
          anclaGrafico + "</xdr:wsDr>"
        )
      );
    }

    tipos.push(numero);
  }

  if (tipos.length) {
    const contenidoTipos = await zip.file("[Content_Types].xml")
      .async("string");

    const nuevosTipos = tipos.map(numero =>
      `<Override PartName="/xl/drawings/drawing${numero}.xml"
ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`
    ).join("");

    const tiposGraficos = calculos
      .map((calculo, indice) => ({
        numero: indice + 1,
        tipo: calculo.datosExcel?.tipo,
        tieneImagen: calculo.img?.startsWith("data:image/png;base64,")
      }))
      .filter(item =>
        item.tieneImagen &&
        item.tipo !== "binomial" &&
        item.tipo !== "poisson"
      )
      .map(item =>
        `<Override PartName="/xl/charts/chart${item.numero}.xml"
ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`
      ).join("");

    zip.file(
      "[Content_Types].xml",
      contenidoTipos.replace(
        "</Types>",
        `<Default Extension="png" ContentType="image/png"/>${nuevosTipos}${tiposGraficos}</Types>`
      )
    );
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE"
  });
}

// Gráfico XY nativo de Excel para distribución normal
function crearGraficoNormalExcel(numero, tipo) {
  const hoja = `'Ejercicio ${numero}'`;

  const nombres = {
    normal: "Distribución normal",
    muestreo: "Distribución normal de la media muestral",
    normal_binomial: "Aproximación normal a la binomial",
    normal_poisson: "Aproximación normal a Poisson"
  };

  const nombreGrafica = nombres[tipo] || "Distribución normal";

  const serie = (nombre, columna, indice) => `
    <c:ser>
      <c:idx val="${indice}"/>
      <c:order val="${indice}"/>
      <c:tx><c:v>${nombre}</c:v></c:tx>
      <c:spPr>
        <a:ln w="28575">
          <a:solidFill><a:srgbClr val="${indice === 0 ? '2563EB' : 'F97316'}"/></a:solidFill>
        </a:ln>
      </c:spPr>
      <c:marker><c:symbol val="none"/></c:marker>
      <c:xVal><c:numRef><c:f>${hoja}!$N$2:$N$122</c:f></c:numRef></c:xVal>
      <c:yVal><c:numRef><c:f>${hoja}!$${columna}$2:$${columna}$122</c:f></c:numRef></c:yVal>
      <c:smooth val="1"/>
    </c:ser>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<c:chart>
<c:autoTitleDeleted val="1"/>
<c:plotArea>
<c:layout/>
<c:scatterChart>
<c:scatterStyle val="smooth"/>
<c:varyColors val="0"/>
${serie(nombreGrafica, "O", 0)}
${serie("Área de probabilidad", "P", 1)}
<c:axId val="100001"/>
<c:axId val="100002"/>
</c:scatterChart>
<c:valAx>
<c:axId val="100001"/>
<c:scaling><c:orientation val="minMax"/></c:scaling>
<c:axPos val="b"/>
<c:crossAx val="100002"/>
<c:crosses val="autoZero"/>
</c:valAx>
<c:valAx>
<c:axId val="100002"/>
<c:scaling><c:orientation val="minMax"/></c:scaling>
<c:axPos val="l"/>
<c:crossAx val="100001"/>
<c:crosses val="autoZero"/>
</c:valAx>
</c:plotArea>
<c:plotVisOnly val="1"/>
</c:chart>
</c:chartSpace>`;
}
