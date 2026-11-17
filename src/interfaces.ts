/**
 * Type contracts for signals, listeners, caches, and payload inference.
 * @module
 */
import { CollectionCache, ValueCache } from './caches.ts';

/** Callback invoked with a signal payload. */
export type Listener<T> = (payload: T) => void;

/** Basic listener registration supported by every signal. */
export interface BaseSignal<T> {
    /**
     * Add a listener to the signal that will be called when the Signal is dispatched.
     * @param listener Function that will be called with the dispatched payload.
     * @param tags Object that can be used to unsubscribe the given listener.
     */
    add(listener: Listener<T>, ...tags: any[]): void;
    /** Remove a listener or all listeners associated with a tag. */
    remove(listenerOrTag: any): void;
}

/** A signal that can be observed and transformed but not directly dispatched. */
export interface ReadableSignal<T> extends BaseSignal<T> {
    /**
     * Add a listener to the `Signal` that will be called when the `Signal` is **dispatched ONLY ONCE**
     * and is then removed from the underlying `Signal` again.
     * @param listener Function that will be called with the dispatched payload.
     * @param tags Object that can be used to unsubscribe the given listener.
     */
    addOnce(listener: Listener<T>, ...tags: any[]): void;

    /**
     * Add a listener to the `Signal` that will be called when the `Signal` is dispatched, **only with fresh payloads**,
     * not with cached values if there is an underlying `CachedSignal` in the chain.
     * @param listener Function that will be called with the dispatched payload.
     * @param tags Object that can be used to unsubscribe the given listener.
     */
    addFresh(listener: Listener<T>, ...tags: any[]): void;

    /**
     * Chain another `Signal` with this `Signal`. This new `Signal` has its own listeners
     * and can be cleared without clearing the underlying `Signal`,
     * which might have side-effects.
     * @param child `Signal` that will be dispatched when this `Signal` will be dispatched.
     */
    chain(child?: ReadableSignal<unknown> & WritableSignal<unknown>): ReadableSignal<T>;

    /**
     * Create a derived `ReadableSignal` that filters the payloads with the filter-function
     * and dispatches only when the filter-function returns `true`.
     * @param filter function that accepts the payload returns a boolean whether this Signal should be dispatched
     */
    filter<U extends T>(filter: (payload: T) => payload is U): ReadableSignal<U>;
    filter(filter: (payload: T) => boolean): ReadableSignal<T>;

    /**
     * Create a derived `ReadableSignal` that calls the transform-function on each dispatched payload,
     * dispatching the return values of this transform function.
     * @param transform
     */
    map<U>(transform: (payload: T) => U): ReadableSignal<U>;

    /**
     * Create a `Signal` that dispatches when ever this or one of the given `Signal`s is dispatched.
     */
    merge<U, C extends Cache<unknown>>(...signals: CachedSignal<U, C>[]): CachedSignal<T | U, C>;
    merge<U>(...signals: ReadableSignal<U>[]): ReadableSignal<T | U>;

    /**
     * Returns a `Promise<T>` that will resolve the next time this underlying Signal dispatches.
     * @param rejectSignal a Signal that when it dispatches causes the promise to reject.
     */
    promisify(rejectSignal?: ReadableSignal<any>): Promise<T>;

    /**
     * Create a derived `ReadableSignal` that calls the peek-function on each dispatched payload.
     * The peek-function's return value is ignored.
     * Like map, but without modifying the payload.
     *
     * *Careful*: the values are still mutable and are not copied for simplicity/performance reasons, so a malicious peek-function may modify properties on the payload.
     * The peek-function is called before subsequent listeners
     * @param peekaboo
     */
    peek(peekaboo: (payload: T) => void): ReadableSignal<T>;

    /**
     * Create a derived `ReadableSignal` that dispatches when ever this or one of the given `Signal`s is dispatched.
     * This `Signal` can no longer be dispatched even if the underlying `Signal` was a `WritableSignal`.
     */
    readOnly(): ReadableSignal<T>;

    /**
     * Create a derived `ReadableSignal` that caches payloads in a `ValueCache<T>`.
     * Any listener that is added to this `Signal` will immediately be called with values from the Cache.
     */
    cache(): CachedSignal<T, ValueCache<T>>;
    /**
     * Create a derived `ReadableSignal` that caches payloads in a given `Cache<T>`
     * Any listener that is added to this `Signal` will immediately be called with values from the Cache.
     * @param cache Cache that stores payloads.
     */
    cache(cache: ValueCache<T>): CachedSignal<T, ValueCache<T>>;
    cache(cache: CollectionCache<T>): CachedSignal<T, CollectionCache<T>>;
    cache<NC extends Cache<T>>(cache: NC): CachedSignal<T, NC>;

    /**
     * Create a derived `ReadableSignal` that accumulates previous payloads using the given `accumulator` and dispatches the accumulated value each time.
     */
    reduce<U>(accumulator: Accumulator<T, U>, initialValue: U): ReadableSignal<U>;
}

/** A readable signal whose cache replays previously dispatched payloads to listeners. */
export interface CachedSignal<T, C extends Cache<unknown> = ValueCache<T>> extends BaseSignal<T> {
    /**
     * @internal this tag is not used anywhere,
     * it's only there so that the interfaces are not recombined by typescript,
     * do not remove
     */
    readonly _phantom_cache_: C;

    /**
     * Add a listener to the `Signal` that will be called when the `Signal` is **dispatched ONLY ONCE**
     * and is then removed from the underlying `Signal` again.
     * @param listener Function that will be called with the dispatched payload.
     * @param tags Object that can be used to unsubscribe the given listener.
     */
    addOnce(listener: Listener<T>, ...tags: any[]): void;

    /**
     * Add a listener to the `Signal` that will be called when the `Signal` is dispatched, **only with fresh payloads**,
     * not with cached values if there is an underlying `CachedSignal` in the chain.
     * @param listener Function that will be called with the dispatched payload.
     * @param tags Object that can be used to unsubscribe the given listener.
     */
    addFresh(listener: Listener<T>, ...tags: any[]): void;

    /**
     * Chain another `Signal` with this `Signal`. This new `Signal` has its own listeners
     * and can be cleared without clearing the underlying `Signal`,
     * which might have side-effects.
     * @param child `Signal` that will be dispatched when this `Signal` will be dispatched.
     */
    chain(child?: ReadableSignal<unknown> & WritableSignal<unknown>): CachedSignal<T, C>;

    /**
     * Create a derived `ReadableSignal` that filters the payloads with the filter-function
     * and dispatches only when the filter-function returns `true`.
     * @param filter function that accepts the payload returns a boolean whether this Signal should be dispatched
     */
    filter<U extends T>(filter: (payload: T) => payload is U): CachedSignal<U, C>;
    filter(filter: (payload: T) => boolean): CachedSignal<T, C>;

    /**
     * Create a derived `ReadableSignal` that calls the transform-function on each dispatched payload,
     * dispatching the return values of this transform function.
     * @param transform
     */
    map<U>(transform: (payload: T) => U): CachedSignal<U, C>;

    /**
     * Create a `Signal` that dispatches when ever this or one of the given `Signal`s is dispatched.
     */
    merge<U, UC extends Cache<U>>(...signals: CachedSignal<U, UC>[]): CachedSignal<T | U, UC | C>;
    merge<U>(...signals: ReadableSignal<U>[]): CachedSignal<T | U, C>;

    /**
     * Returns a `Promise<T>` that will resolve the next time this underlying Signal dispatches.
     * @param rejectSignal a Signal that when it dispatches causes the promise to reject.
     */
    promisify(rejectSignal?: ReadableSignal<any>): Promise<T>;

    /**
     * Create a derived `ReadableSignal` that calls the peek-function on each dispatched payload.
     * The peek-function's return value is ignored.
     * Like map, but without modifying the payload.
     *
     * *Careful*: the values are still mutable and are not copied for simplicity/performance reasons, so a malicious peek-function may modify properties on the payload.
     * The peek-function is called before subsequent listeners
     * @param peekaboo
     */
    peek(peekaboo: (payload: T) => void): CachedSignal<T, C>;

    /**
     * Create a derived `ReadableSignal` that dispatches when ever this or one of the given `Signal`s is dispatched.
     * This `Signal` can no longer be dispatched even if the underlying `Signal` was a `WritableSignal`.
     */
    readOnly(): CachedSignal<T, C>;

    /**
     * @deprecated Please try to avoid caching an already cached Signal.
     */

    cache<NC extends Cache<T>>(cache: NC): CachedSignal<T, NC>;
    /**
     * @deprecated Please try to avoid caching an already cached Signal.
     */
    cache(): CachedSignal<T, ValueCache<T>>;

    /**
     * Create a derived `ReadableSignal` that accumulates previous payloads using the given `accumulator` and dispatches the accumulated value each time.
     */
    reduce<U>(accumulator: Accumulator<T, U>, initialValue: U): CachedSignal<U, C>;
}

/** A signal that can publish payloads and clear its listeners. */
export interface WritableSignal<T> {
    /** Dispatch a payload to registered listeners. */
    dispatch: (payload: T) => void;
    /**
     * set a listener to be called if no other listeners are available.
     */
    setDefaultListener(listener: Listener<T>): void;

    /**
     * deletes all listeners
     */
    clear(): void;
}

/** Storage interface accepted by a cached signal. */
export interface Cache<T = unknown> {
    /** Store a newly dispatched payload. */
    add(payload: T): void;
    /** Visit stored payloads in replay order. */
    forEach(callback: (payload: T) => void): void;
    /** Remove stored payloads if the cache supports clearing. */
    clear?(): void;
}

/** Combines the previous accumulated value with each new payload. */
export type Accumulator<T, U> = (accumulator: U, current: T) => any;

/** Extract the payload type accepted by a signal. */
export type PayloadOf<S extends BaseSignal<any>> = S extends BaseSignal<infer T> ? T : never;

/** Convert a signal type to its readable interface. */
export type ReadOnlyVersionOf<S extends BaseSignal<any>> = S extends BaseSignal<infer T>
    ? ReadableSignal<T>
    : never;
