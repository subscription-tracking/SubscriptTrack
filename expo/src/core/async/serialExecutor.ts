/** Hata sonrasındaki işleri de yürütür; her çağrı kendi sonucunu alır. */
export function createSerialExecutor() {
  let chain: Promise<unknown> = Promise.resolve();
  return <T>(work: () => Promise<T>): Promise<T> => {
    const next = chain.then(work);
    chain = next.catch(() => undefined);
    return next;
  };
}
