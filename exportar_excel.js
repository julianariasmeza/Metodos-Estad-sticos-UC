/* Exportación de cálculos estadísticos a Excel */

async function descargarExcel(cual) {
  const lista = cual === "todos"
    ? historial
    : (actual ? [actual] : []);

  if (!lista.length) {
    alert("Primero realizá un cálculo.");
    return;
  }

  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la biblioteca Excel.");
    return;
  }

  const libro = XLSX.utils.book_new();

  const calculosExportados = lista.filter(c => c.datosExcel);

  calculosExportados.forEach((calculo, indice) => {
    const d = calculo.datosExcel;
    const tipo = d.tipo;
    const modo = d.modo;

    const discreta = tipo === "binomial" || tipo === "poisson";
    const aproximacion =
      tipo === "normal_binomial" || tipo === "normal_poisson";
    const muestreo = tipo === "muestreo";
    const binomial =
      tipo === "binomial" || tipo === "normal_binomial";

    const entre = modo === "entre";

    let media = d.media;
    let sigma = d.sigma;

    if (discreta || aproximacion) {
      media = binomial ? d.n * d.p : d.lambda;
      sigma = binomial
        ? Math.sqrt(d.n * d.p * (1 - d.p))
        : Math.sqrt(d.lambda);
    }

    const desviacion = muestreo
      ? sigma / Math.sqrt(d.n)
      : sigma;

    let inferior = d.a;
    let superior = entre ? d.b : null;

    if (aproximacion) {
      inferior = modo === "menor" ? null : d.a + 0.5;
      superior = modo === "mayor"
        ? null
        : modo === "entre"
          ? d.b - 0.5
          : d.a + (modo === "exacta" ? 0.5 : -0.5);

      if (modo === "exacta") inferior = d.a - 0.5;
    }

    const zInferior = inferior === null || !desviacion
      ? null
      : redondearZ((inferior - media) / desviacion);

    const zSuperior = superior === null || !desviacion
      ? null
      : redondearZ((superior - media) / desviacion);

    const za = aproximacion
      ? zInferior
      : redondearZ((d.a - media) / desviacion);

    const zb = aproximacion
      ? zSuperior
      : entre
        ? redondearZ((d.b - media) / desviacion)
        : null;

    let prob;

    if (discreta) {
      prob = calcularDiscreta(
        tipo, modo, d.a, d.b, d.n, d.p, d.lambda
      );
    } else if (aproximacion) {
      prob = calcularAproximacionNormal(
        tipo, modo, d.a, d.b, d.n, d.p, d.lambda
      ).probabilidad;
    } else {
      prob = modo === "menor"
        ? normalCDF(za)
        : modo === "mayor"
          ? 1 - normalCDF(za)
          : normalCDF(zb) - normalCDF(za);
    }

    const formula = prepararFormulaExcel(d);

    const formulaMedia = binomial
      ? "B8*B11"
      : tipo === "poisson" || tipo === "normal_poisson"
        ? "B12"
        : null;

    const formulaSigma = binomial
      ? "SQRT(B8*B11*(1-B11))"
      : tipo === "poisson" || tipo === "normal_poisson"
        ? "SQRT(B12)"
        : null;

    const celda = (f, v) => ({
      t: "n", f, v
    });

    const filas = [
      ["MÉTODOS ESTADÍSTICOS II"],
      ["Distribución", calculo.tipo],
      ["Tipo de probabilidad", calculo.titulo],
      [],
      ["1. DATOS"],
      ["Media (μ)", formulaMedia ? celda(formulaMedia, media) : media],
      ["Desviación estándar (σ)",
        formulaSigma ? celda(formulaSigma, sigma) : sigma],
      ["Tamaño de muestra (n)", d.n ?? ""],
      ["Límite a", d.a],
      ["Límite b", entre ? d.b : ""],
      ["Probabilidad de éxito (p)", d.p ?? ""],
      ["Lambda (λ)", d.lambda ?? ""],
      ["Desviación utilizada",
        celda(muestreo ? "B7/SQRT(B8)" : "B7", desviacion)],
      ["Z inferior",
        discreta || za === null
          ? ""
          : celda(
              aproximacion
                ? "ROUND((B16-B6)/B13,2)"
                : "ROUND((B9-B6)/B13,2)",
              za
            )],
      ["Z superior",
        discreta || zb === null
          ? ""
          : celda(
              aproximacion
                ? "ROUND((B17-B6)/B13,2)"
                : "ROUND((B10-B6)/B13,2)",
              zb
            )],
      ["Límite inferior corregido",
        aproximacion && inferior !== null
          ? celda(
              modo === "exacta" ? "B9-0.5" : "B9+0.5",
              inferior
            )
          : ""],
      ["Límite superior corregido",
        aproximacion && superior !== null
          ? celda(
              modo === "entre" ? "B10-0.5"
                : modo === "exacta" ? "B9+0.5" : "B9-0.5",
              superior
            )
          : ""],
      ["Probabilidad", celda(formula, prob)],
      ["Porcentaje", celda("B18*100", prob * 100)],
      [],
      ["INTERPRETACIÓN"],
      ["Probabilidad (%)", celda("B19", prob * 100)],
      ["Nota",
        aproximacion
          ? "Aproximación normal con corrección por continuidad."
          : discreta
            ? "Probabilidad discreta."
            : "Valores Z redondeados a dos decimales."]
    ];

    const hoja = XLSX.utils.aoa_to_sheet(filas);

    // Datos auxiliares para la gráfica normal dinámica
    if (!discreta) {
      hoja["N1"] = { t: "s", v: "Valores X" };
      hoja["O1"] = { t: "s", v: "Densidad normal" };
      hoja["P1"] = { t: "s", v: "Área de probabilidad" };

      const paso = desviacion * 8 / 120;

      for (let i = 0; i <= 120; i++) {
        const fila = i + 2;
        const x = media - 4 * desviacion + i * paso;
        const y = Math.exp(
          -0.5 * Math.pow((x - media) / desviacion, 2)
        ) / (desviacion * Math.sqrt(2 * Math.PI));

        hoja["N" + fila] = {
          t: "n",
          f: `$B$6-4*$B$13+${i}*(8*$B$13/120)`,
          v: x
        };

        hoja["O" + fila] = {
          t: "n",
          f: `EXP(-0.5*((N${fila}-$B$6)/$B$13)^2)/($B$13*SQRT(2*PI()))`,
          v: y
        };
        const dentro = modo === "menor"
          ? x <= (aproximacion ? superior : d.a)
          : modo === "mayor"
            ? x >= (aproximacion ? inferior : d.a)
            : x >= (aproximacion ? inferior : d.a) &&
              x <= (aproximacion ? superior : d.b);

        const condicion = modo === "menor"
          ? `N${fila}<=${aproximacion ? "$B$17" : "$B$9"}`
          : modo === "mayor"
            ? `N${fila}>=${aproximacion ? "$B$16" : "$B$9"}`
            : `AND(N${fila}>=${aproximacion ? "$B$16" : "$B$9"},N${fila}<=${aproximacion ? "$B$17" : "$B$10"})`;

        hoja["P" + fila] = {
          t: "n",
          f: `IF(${condicion},O${fila},0)`,
          v: dentro ? y : 0
        };
      }

      hoja["!ref"] = "A1:P122";
    }

    hoja["!cols"] = [{wch: 43}, {wch: 48}];

    hoja["B18"].z = "0.0000";
    hoja["B19"].z = '0.00" %"';
    hoja["B22"].z = '0.00" %"';

    XLSX.utils.book_append_sheet(
      libro, hoja, "Ejercicio " + (indice + 1)
    );
  });

  if (!libro.SheetNames.length) {
    alert("Recalculá los ejercicios para exportarlos.");
    return;
  }

  try {
    const archivo = XLSX.write(libro, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = await agregarGraficasExcel(
      archivo,
      calculosExportados
    );

    const nombre = cual === "todos"
      ? "Historial_Estadistica.xlsx"
      : "Ejercicio_Estadistica.xlsx";

    const enlace = document.createElement("a");
    const url = URL.createObjectURL(blob);

    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

  } catch (error) {
    console.error("Error al exportar Excel:", error);
    alert("No se pudo generar el archivo Excel.");
  }
}
