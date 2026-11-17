/**
 * Typed signals for synchronously publishing values to listeners and deriving new signals.
 *
 * @module
 * @example
 * ```ts
 * import { Signal } from '@hoodie/signals';
 *
 * const changed = new Signal<string>();
 * changed.add((value) => console.log(value));
 * changed.dispatch('ready');
 * ```
 */
export * from './interfaces.ts';
export { Signal } from './signal.ts';
export { ExtendedSignal } from './extended-signal.ts';
export { errorSignal, timeoutSignal } from './utility-signal.ts';
export { CollectionCache, ValueCache } from './caches.ts';
