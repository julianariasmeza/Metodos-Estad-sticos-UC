function dibujarDistribucionDiscreta(tipo, modo, a, b, n, p, lambda) {
  const canvas = document.getElementById("graficaCalculadora");
  // Mismo sistema de coordenadas que la campana normal.
  const W = 800;
  const H = 360;
  const escala = 2;

  canvas.width = W * escala;
  canvas.height = H * escala;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const esBinomial = tipo === "binomial";
  const media = esBinomial ? n * p : lambda;
  const sigma = esBinomial
    ? Math.sqrt(n * p * (1 - p))
    : Math.sqrt(lambda);

  const maxK = esBinomial
    ? n
    : Math.max(15, Math.ceil(media + 4 * sigma), a,
        modo === "entre" ? b : 0);

  const centro = modo === "entre" ? (a + b) / 2 : a;
  const radio = Math.max(10, Math.ceil(4 * sigma));

  let inicio = Math.max(0, Math.floor(Math.min(media, centro) - radio));
  let fin = Math.min(maxK, Math.ceil(Math.max(media, centro) + radio));

  if (fin - inicio > 120) {
    inicio = Math.max(0, Math.floor(centro - 60));
    fin = Math.min(maxK, inicio + 120);
  }

  const valores = [];

  for (let k = inicio; k <= fin; k++) {
    const prob = esBinomial
      ? binomialPMF(n, p, k)
      : poissonPMF(lambda, k);

    valores.push({ k, prob });
  }

  const maxProb = Math.max(...valores.map(v => v.prob), 0.01);

  const izquierda = 65;
  const derecha = W - 45;
  const arriba = 65;
  const abajo = H - 65;

  const ancho = (derecha - izquierda) / valores.length;
  const alturaUtil = abajo - arriba;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#172b4d";
  ctx.font = "bold 23px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    esBinomial ? "Distribución binomial" : "Distribución de Poisson",
    W / 2, 35
  );

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(izquierda, arriba);
  ctx.lineTo(izquierda, abajo);
  ctx.lineTo(derecha, abajo);
  ctx.stroke();

  valores.forEach(({ k, prob }, i) => {
    const x = izquierda + i * ancho + ancho * 0.12;
    const h = prob / maxProb * alturaUtil * 0.88;

    let seleccionado = false;

    if (modo === "exacta") seleccionado = k === a;
    if (modo === "menor") seleccionado = k < a;
    if (modo === "mayor") seleccionado = k > a;
    if (modo === "entre") seleccionado = k > a && k < b;

    ctx.fillStyle = seleccionado ? "#e67e22" : "#4682b4";
    ctx.fillRect(
      x, abajo - h,
      Math.max(1, ancho * 0.76),
      h
    );

    if (valores.length <= 35 || i % 5 === 0) {
      ctx.fillStyle = "#333";
      ctx.font = "13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        String(k),
        x + ancho * 0.38,
        abajo + 20
      );
    }
  });

  ctx.font = "15px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#333";
  ctx.fillText("Número de ocurrencias (k)", W / 2, H - 15);

  ctx.fillStyle = "#e67e22";
  ctx.fillRect(W - 220, 47, 14, 14);
  ctx.fillStyle = "#333";
  ctx.font = "13px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Probabilidad solicitada", W - 200, 59);
}
