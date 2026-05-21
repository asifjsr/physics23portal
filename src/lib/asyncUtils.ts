export const withTimeout = (promise: Promise<any>, ms: number, fallbackValue?: any): Promise<any> => {
  let timeoutId: any;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error('TIMEOUT'));
      }
    }, ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }).catch(err => {
      clearTimeout(timeoutId);
      throw err;
    }),
    timeoutPromise
  ]);
};

export const safeAsync = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    console.error('safeAsync caught error:', error);
    return fallback;
  }
};
