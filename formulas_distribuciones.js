function mostrarFormulasDistribucion() {
  const tipo = document.getElementById("tipo")?.value;
  const contenedor = document.getElementById("contenidoFormulas");

  if (!contenedor) return;

  const formulas = {
    normal: String.raw`
      <p><strong>Distribución normal</strong></p>
      \[
      Z=\frac{X-\mu}{\sigma}
      \]
      \[
      f(x)=\frac{1}{\sigma\sqrt{2\pi}}
      e^{-\frac{(x-\mu)^2}{2\sigma^2}}
      \]
    `,

    muestreo: String.raw`
      <p><strong>Distribución de la media muestral</strong></p>
      \[
      \mu_{\bar X}=\mu
      \]
      \[
      \sigma_{\bar X}=\frac{\sigma}{\sqrt{n}}
      \]
      \[
      Z=\frac{\bar X-\mu}{\sigma/\sqrt{n}}
      \]
    `,

    binomial: String.raw`
      <p><strong>Distribución binomial</strong></p>
      \[
      P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}
      \]
      \[
      \mu=np
      \]
      \[
      \sigma=\sqrt{np(1-p)}
      \]
    `,

    poisson: String.raw`
      <p><strong>Distribución de Poisson</strong></p>
      \[
      P(X=k)=\frac{e^{-\lambda}\lambda^k}{k!}
      \]
      \[
      \mu=\lambda,\qquad \sigma=\sqrt{\lambda}
      \]
    `,

    normal_binomial: String.raw`
      <p><strong>Aproximación normal a la binomial</strong></p>
      \[
      \mu=np
      \]
      \[
      \sigma=\sqrt{np(1-p)}
      \]
      \[
      Z=\frac{X-\mu}{\sigma}
      \]
      <p><strong>Corrección por continuidad:</strong> se ajusta el límite en 0,5 según el evento.</p>
    `,

    normal_poisson: String.raw`
      <p><strong>Aproximación normal a Poisson</strong></p>
      \[
      \mu=\lambda
      \]
      \[
      \sigma=\sqrt{\lambda}
      \]
      \[
      Z=\frac{X-\mu}{\sigma}
      \]
      <p><strong>Corrección por continuidad:</strong> se ajusta el límite en 0,5 según el evento.</p>
    `
  };

  contenedor.innerHTML = formulas[tipo] || "";

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([contenedor]).catch(console.error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const selector = document.getElementById("tipo");

  selector?.addEventListener("change", mostrarFormulasDistribucion);

  mostrarFormulasDistribucion();
});
