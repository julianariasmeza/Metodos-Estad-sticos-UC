async function calcularDistribucionAproximada(registrar = true) {
  const tipo = document.getElementById("tipo").value;
  const modo = document.getElementById("probabilidad").value;

  const a = Number(document.getElementById("limite").value);
  const b = Number(document.getElementById("limiteB").value);
  const n = Number(document.getElementById("muestra").value);
  const p = Number(document.getElementById("probExito").value);
  const lambda = Number(document.getElementById("lambda").value);

  const esBinomial = tipo === "normal_binomial";
  const nombre = esBinomial
    ? "Aproximación normal a la binomial"
    : "Aproximación normal a Poisson";

  if (document.getElementById("limite").value.trim() === "") {
    mostrarError("Ingresá el límite de probabilidad.");
    return;
  }

  let r;

  try {
    r = calcularAproximacionNormal(tipo, modo, a, b, n, p, lambda);
  } catch (error) {
    mostrarError(error.message);
    return;
  }

  const expresiones = {
    exacta: `P(X=${a})`,
    menor: `P(X<${a})`,
    mayor: `P(X>${a})`,
    entre: `P(${a}<X<${b})`
  };

  const expresion = expresiones[modo];
  const prob = Number(r.probabilidad.toFixed(4));
  const porcentaje = prob * 100;

  const inferior = r.limiteInferior;
  const superior = r.limiteSuperior;

  let html = "";

  html += "<div class='paso'><h3>1. Datos</h3>";
  html += `<p><strong>${nombre}</strong></p>`;

  if (esBinomial) {
    html += `\\[n=${n},\\quad p=${fT(p)}\\]`;
    html += "\\[\\mu=np\\]";
    html += `\\[\\mu=${n}(${fT(p)})=${fT(r.media)}\\]`;
    html += "\\[\\sigma=\\sqrt{np(1-p)}\\]";
  } else {
    html += `\\[\\lambda=${fT(lambda)}\\]`;
    html += "\\[\\mu=\\lambda,\\quad\\sigma=\\sqrt{\\lambda}\\]";
  }

  html += `\\[\\mu=${fT(r.media)},\\quad\\sigma=${fT(r.sigma)}\\]`;
  html += `\\[${expresion}\\]</div>`;

  html += "<div class='paso'><h3>2. Corrección por continuidad</h3>";

  if (inferior !== null && superior !== null) {
    html += `\\[P(${fT(inferior)}<Y<${fT(superior)})\\]`;
  } else if (inferior !== null) {
    html += `\\[P(Y>${fT(inferior)})\\]`;
  } else {
    html += `\\[P(Y<${fT(superior)})\\]`;
  }

  html += "</div>";

  html += "<div class='paso'><h3>3. Estandarización</h3>";
  html += "\\[Z=\\frac{x-\\mu}{\\sigma}\\]";

  if (inferior !== null) {
    html += `\\[Z_1=\\frac{${fT(inferior)}-${fT(r.media)}}{${fT(r.sigma)}}=${fT(r.zInferior)}\\]`;
  }

  if (superior !== null) {
    html += `\\[Z_2=\\frac{${fT(superior)}-${fT(r.media)}}{${fT(r.sigma)}}=${fT(r.zSuperior)}\\]`;
  }

  html += "</div>";

  html += "<div class='paso'><h3>4. Probabilidad</h3>";
  html += `\\[${expresion}\\approx${fT(prob, 4)}\\]`;
  html += "</div>";

  html += "<div class='resultado'><h3>5. Interpretación</h3>";
  html += `La probabilidad aproximada es del ${formato(porcentaje)} %.`;
  html += "</div>";

  const salida = document.getElementById("salida");
  const temporal = document.createElement("div");
  temporal.innerHTML = html;
  const pasos = Array.from(temporal.children).map(el => el.outerHTML);

  salida.innerHTML = html;

  const modoGrafica = inferior !== null && superior !== null
    ? "entre"
    : inferior !== null ? "mayor" : "menor";

  dibujarCampana(
    "graficaCalculadora",
    r.media,
    r.sigma,
    inferior !== null ? inferior : superior,
    superior !== null ? superior : 0,
    modoGrafica,
    false
  );

  if (window.MathJax && MathJax.typesetPromise) {
    await MathJax.typesetPromise([salida]);
  }

  actual = {
    datosExcel: {
      tipo, modo, a,
      b: modo === "entre" ? b : null,
      n: esBinomial ? n : null,
      p: esBinomial ? p : null,
      lambda: esBinomial ? null : lambda,
      media: r.media,
      sigma: r.sigma,
      limiteInferior: inferior,
      limiteSuperior: superior
    },
    tipo: nombre,
    titulo: expresion,
    resumen: `${formato(porcentaje)} %`,
    img: document.getElementById("graficaCalculadora")
      .toDataURL("image/png"),
    pasos
  };

  if (registrar) {
    historial.push(actual);
    if (historial.length > 20) historial.shift();
    renderHistorial();
  }

  actualizarBotones();
}
