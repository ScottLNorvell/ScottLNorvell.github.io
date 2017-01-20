import { fakeJsonPAdResponse } from 'player-frontend/utils/fake-jsonp-ad-response';

let alreadyRan = false;
export function watchScriptSrc() {
  try {
    if (!alreadyRan) {
      Object.defineProperty(
        HTMLScriptElement.prototype,
        'src',
        {
          configurable: true,
          enumerable: false,
          get() {
            return this._src || '';
          },
          set(src) {
            const replacementSrc = swapOutScriptSrc(src);
            this._src = replacementSrc;
            this.setAttribute('src', replacementSrc);
          }
        }
      );
      alreadyRan = true;
    } else {
      console.warn('you already ran `watchScriptSrc`. This only needs to happen ONCE.');
    }
  } catch (e) {
    console.error("Oh dear! This browser won't let me overwrite `src` getter/setter for <script> tags :(", e);
  }
}

const stubMap = new Map();

export function stubJsonPResponse(pattern, ad, times = 1, callbackKey = 'cbfn') {
  stubMap.set(pattern, { ad, times, callbackKey });
}

export function restoreJsonPResponses() {
  stubMap.clear();
}

export function getSourceUrlForAd(ad, callbackFnName) {
  const blob = new Blob([fakeJsonPAdResponse(callbackFnName, ad)]);
  const url = URL.createObjectURL(blob);
  return url;
}

function swapOutScriptSrc(src) {
  for (let [pattern, meta] of stubMap) {
    if (pattern.test(src) && meta.times > 0) {
      meta.times--;
      const { ad, callbackKey } = meta;
      const { [callbackKey]: callbackFnName } = objectifyParams(src);

      if (callbackFnName) {
        return getSourceUrlForAd(ad, callbackFnName);
      }
    }
  }

  return src;
}

export function objectifyParams(url) {
  const paramString = url.split(/[?;]/)[1];
  if (paramString) {
    return paramString.split('&').reduce((acc, param) => {
      const [k, v] = param.split('=');
      acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
  } else {
    return {};
  }
}
