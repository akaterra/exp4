import { alertsStore } from '../blocks/alerts';

export function processing(target, prop, descriptor) {
  const fn = descriptor.value;

  descriptor.value = async function *(...args) {
    this.isProcessing = true;

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
      alertsStore.push(e?.message ?? e);

      throw e;
    } finally {
      this.isProcessing = false;
    }
  }

  return descriptor;
}

export function processingRequest(target, prop, descriptor) {
  const fn = descriptor.value;

  descriptor.value = async function (...args) {
    const showLoaderTimeout = setTimeout(() => {
      alertsStore.showLoader();
    }, 500);

    try {
      return await fn.call(this, ...args);
    } catch (e) {
      alertsStore.push(e?.message ?? e);

      throw e;
    } finally {
      clearTimeout(showLoaderTimeout);

      if (alertsStore.isLoaderShownIteration) {
        setTimeout(() => {
          alertsStore.hideLoader();
        }, 500);
      }
    }
  }
}

// export function flowToPromise(generator) {
//   return new Promise((resolve, reject) => {
//     try {
//       const generatorState = fn.call(this, ...args);
//       let val;

//       while (true) {
//         const next = generatorState.next(await val);
//         val = next.value;

//         yield val;

//         if (next.done) {
//           break;
//         }
//       }
//     } catch (e) {
//       alertsStore.push(e?.message ?? e);

//       throw e;
//     } finally {
//       this.isProcessing = false;
//     }
//   });
// }
