/**
 * Writable signal implementation with listener storage and dispatch.
 * @module
 */
import { ExtendedSignal } from './extended-signal.ts';
import { ReadableSignal } from './index.ts';
import { Listener, WritableSignal } from './interfaces.ts';

/**
 * A writable signal that synchronously notifies its registered listeners.
 *
 * @example
 * ```ts
 * import { Signal } from '@hoodie/signals';
 *
 * const status = new Signal<string>();
 * status.add((value) => console.log(value));
 * status.dispatch('ready');
 * ```
 */
export class Signal<T> extends ExtendedSignal<T> implements WritableSignal<T>, ReadableSignal<T> {
    protected _listeners: Set<Listener<T>> = new Set<Listener<T>>();

    /** Set the fallback listener used when a signal has no instance-level fallback. */
    public static setDefaultListener(listener: Listener<any>) {
        Signal._staticDefaultListener = listener;
    }

    private static _staticDefaultListener: Listener<any> = () => {
        // default static listener is a noop
    };

    /** Create a signal with no registered listeners. */
    constructor() {
        super({
            add: (listener) => {
                this._listeners.add(listener);
            },
            remove: (listener) => {
                this._listeners.delete(listener);
            },
        });
    }

    /** Notify every registered listener with a payload. */
    public dispatch(payload: T): void {
        if (this._listeners.size === 0) {
            const instanceDefaultListener = this._instanceDefaultListener;
            instanceDefaultListener(payload);
            return;
        }

        this._listeners.forEach((callback) => callback.call(undefined, payload));
    }

    /** Set the listener called when this signal has no registered listeners. */
    public setDefaultListener(listener: Listener<T>) {
        this._instanceDefaultListener = listener;
    }

    /** Remove all listeners and detach this signal's derived-signal hooks. */
    public clear() {
        this._parentPostClearHooks.forEach((hook) => hook());
        this._parentPostClearHooks.length = 0;
        this._listeners = new Set();
    }

    private _instanceDefaultListener: Listener<T> = (payload) =>
        Signal._staticDefaultListener(payload);
}
