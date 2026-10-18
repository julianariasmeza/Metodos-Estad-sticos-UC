async function calcularDistribucionDiscreta(registrar = true) {
  const tipo = document.getElementById("tipo").value;
  const modo = document.getElementById("probabilidad").value;

  const a = Number(document.getElementById("limite").value);
  const b = Number(document.getElementById("limiteB").value);
  const n = Number(document.getElementById("muestra").value);
  const p = Number(document.getElementById("probExito").value);
  const lambda = Number(document.getElementById("lambda").value);

  const esBinomial = tipo === "binomial";
  const nombre = esBinomial
    ? "Distribución binomial"
    : "Distribución de Poisson";

  if (
    document.getElementById("limite").value.trim() === "" ||
    !Number.isInteger(a) || a < 0
  ) {
    mostrarError("El valor k debe ser un entero no negativo.");
    return;
  }

  if (
    modo === "entre" &&
    (!Number.isInteger(b) || b <= a)
  ) {
    mostrarError("El límite b debe ser un entero mayor que a.");
    return;
  }

  if (esBinomial &&
      (!Number.isInteger(n) || n < 1 ||
       !Number.isFinite(p) || p < 0 || p > 1 ||
       document.getElementById("probExito").value.trim() === "")) {
    mostrarError("Ingresá n positivo y p entre 0 y 1.");
    return;
  }

  if (!esBinomial &&
      (!Number.isFinite(lambda) || lambda < 0 ||
       document.getElementById("lambda").value.trim() === "")) {
    mostrarError("Lambda debe ser un número no negativo.");
    return;
  }

  const prob = calcularDiscreta(tipo, modo, a, b, n, p, lambda);
  const resultado = Number(prob.toFixed(4));
  const porcentaje = resultado * 100;

  const expresiones = {
    exacta: `P(X=${a})`,
    menor: `P(X<${a})`,
    mayor: `P(X>${a})`,
    entre: `P(${a}<X<${b})`
  };

  const expresion = expresiones[modo];

  let html = "";

  html += "<div class='paso'><h3>1. Datos</h3>";
  html += `<p><strong>${nombre}</strong></p>`;

  if (esBinomial) {
    html += `\\[n=${n},\\quad p=${fT(p)}\\]`;
  } else {
    html += `\\[\\lambda=${fT(lambda)}\\]`;
  }

  html += `\\[${expresion}\\]</div>`;

  html += "<div class='paso'><h3>2. Fórmula</h3>";

  if (esBinomial) {
    html += "\\[P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}\\]";
  } else {
    html += "\\[P(X=k)=\\frac{e^{-\\lambda}\\lambda^k}{k!}\\]";
  }

  html += "</div>";

  html += "<div class='paso'><h3>3. Probabilidad</h3>";
  html += `\\[${expresion}=${fT(resultado, 4)}\\]`;
  html += "</div>";

  html += "<div class='resultado'><h3>4. Interpretación</h3>";
  html += `La probabilidad solicitada es aproximadamente del ${formato(porcentaje)} %.`;
  html += "</div>";

  const salida = document.getElementById("salida");
  const temporal = document.createElement("div");
  temporal.innerHTML = html;
  const pasos = Array.from(temporal.children).map(el => el.outerHTML);

  salida.innerHTML = html;

  const canvas = document.getElementById("graficaCalculadora");
  dibujarDistribucionDiscreta(tipo, modo, a, b, n, p, lambda);

  if (window.MathJax && MathJax.typesetPromise) {
    await MathJax.typesetPromise([salida]);
  }

  actual = {
    datosExcel: {
      tipo, modo, a,
      b: modo === "entre" ? b : null,
      n: esBinomial ? n : null,
      p: esBinomial ? p : null,
      lambda: esBinomial ? null : lambda
    },
    tipo: nombre,
    titulo: expresion,
    resumen: `${formato(porcentaje)} %`,
    img: canvas.toDataURL("image/png"),
    pasos
  };

  if (registrar) {
    historial.push(actual);
    if (historial.length > 20) historial.shift();
    renderHistorial();
  }

  actualizarBotones();
}
