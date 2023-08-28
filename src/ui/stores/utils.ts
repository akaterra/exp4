import { alertsStore } from '../blocks/alerts';

export function processing(target, prop, descriptor) {
  const fn = descriptor.value;

  descriptor.value = async function *(...args) {
    this.isProcessing = true;

    try {
      const g = fn.call(this, ...args);
      let val;

      while (true) {
        const next = g.next(await val);
        val = next.value;

        yield val;

        if (next.done) {
          break;
        }
      }
    } catch (e) {
      alertsStore.push(e?.message ?? e);

      throw e;
    } finally {
      this.isProcessing = false;
    }
  }

  return descriptor;
}
