export function modalOnShow(isShown) {
  const el = document.getElementById('mini');

  if (el) {
    const padding = (window.innerWidth - document.body.clientWidth);

    if (isShown) {
      if (!padding) {
        return;
      }

      el.className = el.className.replace(' scroll-y', '');
      el.className += ' no-scroll';
      el.style.paddingRight = padding + 'px';
      // el.style.scrollbarGutter = 'stable';
    } else {
      if (padding) {
        return;
      }

      el.className = el.className.replace(' no-scroll', '');
      el.className += ' scroll-y';
      el.style.paddingRight = '0';
      // el.style.scrollbarGutter = 'auto';
    }
  }
}
