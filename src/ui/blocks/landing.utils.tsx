const GRADIENT_ALIGN = 0.3;

export function getLandingLogoGradient() {
  const color1 = [ 255, 255, 255, 1 ];
  const color2 = [ 255, 0, 85, 1 ];
  const stop = 50;
  const step = 10;

  const gradients = [];

  for (let i = 0; i <= stop; i += step) {
    let r, g, b, a;

    if (i >= step * GRADIENT_ALIGN) {
      r = calcColor(0, i - step * GRADIENT_ALIGN);
      g = calcColor(1, i - step * GRADIENT_ALIGN);
      b = calcColor(2, i - step * GRADIENT_ALIGN);
      a = calcColor(3, i - step * GRADIENT_ALIGN);

      gradients.push(
        `rgba(${r}, ${g}, ${b}, ${a}) ${i}%`
      );
    }

    r = calcColor(0, i);
    g = calcColor(1, i);
    b = calcColor(2, i);
    a = calcColor(3, i);

    gradients.push(
      i === 0 ? '#f0f0f0' : `rgba(${r}, ${g}, ${b}, ${a}) ${i}%`
    );
  }

  const r = calcColor(0, stop);
  const g = calcColor(1, stop);
  const b = calcColor(2, stop);
  const a = calcColor(3, stop);

  gradients.push(
    `rgba(${r}, ${g}, ${b}, ${a}) 100%`
  );

  function calcColor(p, i) {
    return Math.floor(color1[p] + (color2[p] - color1[p]) * i / stop);
  }

  return `linear-gradient(0deg, ${gradients.join(', ')})`;
}

export const gradient2 = `linear-gradient(135deg, transparent 0%, transparent 16%, #f9f87140 16%, #f9f87140 18%, transparent 18%, transparent 22%, #f9f87180 22%, #f9f87180 24%, transparent 24%)`;
