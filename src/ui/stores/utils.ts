import { alertsStore } from '../blocks/alerts';

let isProcessingCount = 0;

export function saveJson(content: Array<Record<string, unknown>>, target: 'clipboard' | 'download', filename?) {
  return saveContent(content, 'json', target, filename);
}

export function saveCsv(content: Array<Record<string, unknown>>, target: 'clipboard' | 'download', filename?) {
  const csvContent: unknown[][] = [];
  const csvTitles: string[] = [];
  const csvValuesMapping = {};
  csvContent.push(csvTitles);

  for (const items of content) {
    const row: unknown[] = [];

    for (const [ key, val ] of Object.entries(items)) {
      if (!csvValuesMapping.hasOwnProperty(key)) {
        csvValuesMapping[key] = csvTitles.length;
        csvTitles.push(key);
      }

      row[csvValuesMapping[key]] = typeof val === 'string' ? val.replace(/,/g, '\\,') : val;
    }

    csvContent.push(row);
  }

  const csv = csvContent.map((row) => row.join(',')).join('\n');

  return saveContent(csv, 'csv', target, filename);
}

export function saveTextAligned(content: Array<Record<string, unknown>>, target: 'clipboard' | 'download', filename?) {
  const csvContent: string[][] = [];
  const csvTitles: string[] = [];
  const csvValuesMapping: Record<string, [ number, number ]> = {};
  csvContent.push(csvTitles);

  for (const items of content) {
    const row: string[] = [];

    for (const [ key, val ] of Object.entries(items)) {
      if (!csvValuesMapping.hasOwnProperty(key)) {
        csvValuesMapping[key] = [ csvTitles.length, key.length ];
        csvTitles.push(key);
      }

      row[csvValuesMapping[key][0]] = val != null ? String(val) : '';
      const len = row[csvValuesMapping[key][0]].length;

      if (len > csvValuesMapping[key][1]) {
        csvValuesMapping[key][1] = len;
      }
    }

    csvContent.push(row);
  }

  const pos = Object.values(csvValuesMapping);
  const text = csvContent
    .map(
      (items) => items
        .map((item, i) => item + ' '.repeat(pos[i][1] - item.length))
        .join('     ')
    )
    .join('\n');

  return saveContent(text, 'txt', target, filename);
}

export async function saveContent(content, contentType, target: 'clipboard' | 'download', filename?) {
  switch (contentType) {
    case 'json':
      content = JSON.stringify(content, undefined, 2);
      break;
  }
  
  switch (target) {
    case 'clipboard':
      await navigator.clipboard.writeText(content);

      break;
    case 'download':
      const downloadEl = document.getElementById('download');

      if (downloadEl) {
        downloadEl.setAttribute('href', `data:text/${contentType};charset=utf-8,` + encodeURIComponent(content));
        downloadEl.setAttribute('download', `${filename}.${contentType}`);
        downloadEl.click();
      }    
  }
}

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

export function *splitFilterTokens(str, forFilter?) {
  if (!str) {
    return;
  }

  for (const token of forFilter ? str.split(/[^\d\w\-\:]+/) : str.split(/[^\d\w]+/)) {
    if (token) {
      yield token.toLowerCase();
    }
  }
}

