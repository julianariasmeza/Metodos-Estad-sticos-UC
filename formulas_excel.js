/* Fórmulas editables para las distribuciones estadísticas */

function prepararFormulaExcel(d) {
  const tipo = d.tipo;
  const modo = d.modo;

  const esBinomial = tipo === "binomial";
  const esPoisson = tipo === "poisson";
  const esDiscreta = esBinomial || esPoisson;

  const esAproximacion =
    tipo === "normal_binomial" ||
    tipo === "normal_poisson";

  if (esDiscreta) {
    const funcion = esBinomial
      ? (k, acumulada) =>
          `_xlfn.BINOM.DIST(${k},B8,B11,${acumulada})`
      : (k, acumulada) =>
          `_xlfn.POISSON.DIST(${k},B12,${acumulada})`;

    if (modo === "exacta") {
      return funcion("B9", "FALSE");
    }

    if (modo === "menor") {
      return funcion("B9-1", "TRUE");
    }

    if (modo === "mayor") {
      return `1-${funcion("B9", "TRUE")}`;
    }

    return `${funcion("B10-1", "TRUE")}-${funcion("B9", "TRUE")}`;
  }

  const normal = z => `_xlfn.NORM.S.DIST(${z},TRUE)`;

  if (esAproximacion) {
    if (modo === "menor") {
      return normal("B15");
    }

    if (modo === "mayor") {
      return `1-${normal("B14")}`;
    }

    return `${normal("B15")}-${normal("B14")}`;
  }

  if (modo === "menor") {
    return normal("B14");
  }

  if (modo === "mayor") {
    return `1-${normal("B14")}`;
  }

  return `${normal("B15")}-${normal("B14")}`;
}
