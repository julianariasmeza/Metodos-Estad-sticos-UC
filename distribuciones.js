/* Distribuciones discretas: binomial y Poisson */

function logFactorial(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("El factorial requiere un entero no negativo.");
  }
  let suma = 0;
  for (let i = 2; i <= n; i++) suma += Math.log(i);
  return suma;
}

function binomialPMF(n, p, k) {
  if (!Number.isInteger(n) || n < 0 ||
      !Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error("Parámetros binomiales inválidos.");
  }

  if (!Number.isInteger(k) || k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;

  const logP =
    logFactorial(n) -
    logFactorial(k) -
    logFactorial(n - k) +
    k * Math.log(p) +
    (n - k) * Math.log1p(-p);

  return Math.exp(logP);
}

function poissonPMF(lambda, k) {
  if (!Number.isFinite(lambda) || lambda < 0) {
    throw new Error("Lambda debe ser no negativo.");
  }

  if (!Number.isInteger(k) || k < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;

  return Math.exp(
    -lambda + k * Math.log(lambda) - logFactorial(k)
  );
}

function binomialCDF(n, p, k) {
  if (k < 0) return 0;
  if (k >= n) return 1;

  let suma = 0;
  for (let i = 0; i <= Math.floor(k); i++) {
    suma += binomialPMF(n, p, i);
  }
  return Math.max(0, Math.min(1, suma));
}

function poissonCDF(lambda, k) {
  if (k < 0) return 0;

  let suma = 0;
  for (let i = 0; i <= Math.floor(k); i++) {
    suma += poissonPMF(lambda, i);
  }
  return Math.max(0, Math.min(1, suma));
}

function calcularDiscreta(tipo, modo, a, b, n, p, lambda) {
  const binomial = tipo === "binomial";

  const pmf = k => binomial
    ? binomialPMF(n, p, k)
    : poissonPMF(lambda, k);

  const cdf = k => binomial
    ? binomialCDF(n, p, k)
    : poissonCDF(lambda, k);

  let resultado;

  switch (modo) {
    case "exacta":
      resultado = pmf(a);
      break;
    case "menor":
      resultado = cdf(a - 1);
      break;
    case "mayor":
      resultado = 1 - cdf(a);
      break;
    case "entre":
      resultado = cdf(b - 1) - cdf(a);
      break;
    default:
      throw new Error("Tipo de probabilidad no válido.");
  }

  return Math.max(0, Math.min(1, resultado));
}
