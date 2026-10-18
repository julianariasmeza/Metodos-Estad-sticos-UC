/* Aproximaciones normales con corrección por continuidad */

function calcularAproximacionNormal(tipo, modo, a, b, n, p, lambda) {
  let media, sigma;

  if (tipo === "normal_binomial") {
    if (!Number.isInteger(n) || n < 1 ||
        !Number.isFinite(p) || p <= 0 || p >= 1) {
      throw new Error("Se requiere n positivo y 0 < p < 1.");
    }
    media = n * p;
    sigma = Math.sqrt(n * p * (1 - p));
  } else if (tipo === "normal_poisson") {
    if (!Number.isFinite(lambda) || lambda <= 0) {
      throw new Error("Lambda debe ser mayor que cero.");
    }
    media = lambda;
    sigma = Math.sqrt(lambda);
  } else {
    throw new Error("Distribución no válida.");
  }

  if (!Number.isInteger(a) || a < 0 ||
      (modo === "entre" && (!Number.isInteger(b) || b <= a))) {
    throw new Error("Los límites deben ser enteros válidos.");
  }

  let limiteInferior = null;
  let limiteSuperior = null;

  if (modo === "exacta") {
    limiteInferior = a - 0.5;
    limiteSuperior = a + 0.5;
  } else if (modo === "menor") {
    limiteSuperior = a - 0.5;
  } else if (modo === "mayor") {
    limiteInferior = a + 0.5;
  } else if (modo === "entre") {
    limiteInferior = a + 0.5;
    limiteSuperior = b - 0.5;
  } else {
    throw new Error("Tipo de probabilidad no válido.");
  }

  const zInferior = limiteInferior === null
    ? null : redondearZ((limiteInferior - media) / sigma);

  const zSuperior = limiteSuperior === null
    ? null : redondearZ((limiteSuperior - media) / sigma);

  let probabilidad;

  if (zInferior === null) {
    probabilidad = normalCDF(zSuperior);
  } else if (zSuperior === null) {
    probabilidad = 1 - normalCDF(zInferior);
  } else {
    probabilidad = normalCDF(zSuperior) - normalCDF(zInferior);
  }

  return {
    media,
    sigma,
    limiteInferior,
    limiteSuperior,
    zInferior,
    zSuperior,
    probabilidad: Math.max(0, Math.min(1, probabilidad))
  };
}
