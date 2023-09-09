import { alertsStore } from '../blocks/alerts';

let isProcessingCount = 0;

export function processing(target, prop, descriptor) {
  const fn = descriptor.value;

  descriptor.value = async function *(...args) {
    this.isProcessing = true;
    isProcessingCount += 1;

    try {
      const generatorState = fn.call(this, ...args);
      let val;

      while (true) {
        const next = generatorState.next(await val);
        val = next.value;

        yield val;

        if (next.done) {
          break;
        }
      }
    } catch (e) {
      if (isProcessingCount <= 1) {
        alertsStore.push(e?.message ?? e);
      }

      throw e;
    } finally {
      this.isProcessing = false;
      isProcessingCount -= 1;
    }
  }

  return descriptor;
}

export function processingRequest(target, prop, descriptor) {
  const fn = descriptor.value;

  descriptor.value = async function (...args) {
    const showLoaderTimeout = alertsStore.isLoaderShownIteration === 0 ? setTimeout(() => {
      alertsStore.showLoader();
    }, 500) : null;

    if (alertsStore.isShown) {
      alertsStore.showLoader();
    }

    try {
      return await fn.call(this, ...args);
    } catch (e) {
      // alertsStore.push(e?.message ?? e);

      throw e;
    } finally {
      clearTimeout(showLoaderTimeout);

      if (alertsStore.isLoaderShownIteration > 0) {
        setTimeout(() => {
          alertsStore.hideLoader();
        }, 500);
      }
    }
  }
}
