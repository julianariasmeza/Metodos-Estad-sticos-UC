function generarSustitucionDiscreta(tipo, modo, a, b, n, p, lambda) {
  const termino = k => {
    if (tipo === "binomial") {
      return String.raw`\binom{${n}}{${k}}(${fT(p)})^{${k}}(1-${fT(p)})^{${n}-${k}}`;
    }
    return String.raw`\frac{e^{-${fT(lambda)}}(${fT(lambda)})^{${k}}}{${k}!}`;
  };

  const maximo = tipo === "binomial" ? n : Infinity;

  if (modo === "exacta") {
    return String.raw`\[P(X=${a})=${a > maximo ? "0" : termino(a)}\]`;
  }

  let inicio = 0;
  let fin = 0;
  let complemento = false;

  if (modo === "menor") {
    fin = Math.min(a - 1, maximo);
  } else if (modo === "mayor") {
    inicio = 0;
    fin = Math.min(a, maximo);
    complemento = true;
  } else if (modo === "entre") {
    inicio = a + 1;
    fin = Math.min(b - 1, maximo);
  }

  if (fin < inicio) {
    return String.raw`\[P= ${complemento ? "1" : "0"}\]`;
  }

  const cantidad = fin - inicio + 1;

  if (cantidad > 6) {
    const suma = tipo === "binomial"
      ? String.raw`\sum_{k=${inicio}}^{${fin}}\binom{${n}}{k}(${fT(p)})^k(1-${fT(p)})^{${n}-k}`
      : String.raw`\sum_{k=${inicio}}^{${fin}}\frac{e^{-${fT(lambda)}}(${fT(lambda)})^k}{k!}`;

    return String.raw`\[P=${complemento ? "1-" : ""}${suma}\]`;
  }

  const expresion = Array.from(
    {length: cantidad},
    (_, i) => termino(inicio + i)
  ).join("+");

  return String.raw`\[P=${complemento ? "1-\left(" : ""}${expresion}${complemento ? "\right)" : ""}\]`;
}
