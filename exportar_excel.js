/* Exportación de cálculos estadísticos a Excel */

function descargarExcel(cual) {
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

  lista.forEach((calculo, indice) => {
    const d = calculo.datosExcel;

    if (!d) return;

    const muestreo = d.tipo === "muestreo";
    const entre = d.modo === "entre";

    const desviacion = muestreo
      ? d.sigma / Math.sqrt(d.n)
      : d.sigma;

    const za = Math.round(
      ((d.a - d.media) / desviacion) * 100
    ) / 100;

    const zb = entre
      ? Math.round(
          ((d.b - d.media) / desviacion) * 100
        ) / 100
      : null;

    const phi = z => normalCDF(z);

    const prob = d.modo === "menor"
      ? phi(za)
      : d.modo === "mayor"
        ? 1 - phi(za)
        : phi(zb) - phi(za);

    const filas = [
      ["MÉTODOS ESTADÍSTICOS II"],
      ["Distribución", calculo.tipo],
      ["Tipo de probabilidad", calculo.titulo],
      [],
      ["1. DATOS"],
      ["Media (μ)", d.media],
      ["Desviación estándar (σ)", d.sigma],
      ["Tamaño de muestra (n)", muestreo ? d.n : ""],
      ["Límite a", d.a],
      ["Límite b", entre ? d.b : ""],
      [],
      ["2. PROCEDIMIENTO"],
      ["Desviación utilizada",
        {f: muestreo ? "B7/SQRT(B8)" : "B7",
         v: desviacion}],
      ["Z(a)",
        {f: "ROUND((B9-B6)/B13,2)", v: za}],
      ["Z(b)", entre
        ? {f: "ROUND((B10-B6)/B13,2)", v: zb}
        : ""],
      [],
      ["3. PROBABILIDAD"],
      ["Probabilidad",
        {
          f: d.modo === "menor"
            ? "NORM.S.DIST(B14,TRUE)"
            : d.modo === "mayor"
              ? "1-NORM.S.DIST(B14,TRUE)"
              : "NORM.S.DIST(B15,TRUE)-NORM.S.DIST(B14,TRUE)",
          v: prob
        }],
      ["Porcentaje", {f: "B18*100", v: prob * 100}],
      [],
      ["4. INTERPRETACIÓN"],
      ["Probabilidad aproximada (%)", prob * 100],
      ["Nota", "Z redondeado a dos decimales antes de consultar la normal."]
    ];

    const hoja = XLSX.utils.aoa_to_sheet(filas);

    hoja["!cols"] = [
      {wch: 43},
      {wch: 48}
    ];

    hoja["B18"].z = "0.0000";
    hoja["B19"].z = '0.00" %"';

    XLSX.utils.book_append_sheet(
      libro, hoja, "Ejercicio " + (indice + 1)
    );
  });

  if (!libro.SheetNames.length) {
    alert("Recalculá los ejercicios para exportarlos.");
    return;
  }

  XLSX.writeFile(
    libro,
    cual === "todos"
      ? "Historial_Estadistica.xlsx"
      : "Distribucion_Normal.xlsx"
  );
}
