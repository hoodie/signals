/**
 * Cache implementations used to replay past payloads to late listeners.
 * @module
 */
import type { Cache } from './interfaces.ts';

/** Base cache for payloads stored in an array. */
export abstract class ArrayCache<T> implements Cache<T> {
    protected _payloads: T[] = [];
    /** Store a payload according to the concrete cache's policy. */
    public abstract add(value: T): void;

    /** Visit every cached payload in insertion order. */
    public forEach(callback: (value: T) => void): void {
        this._payloads.forEach((value) => callback(value));
    }

    /** Remove all cached payloads. */
    public clear(): void {
        this._payloads.length = 0;
    }
}

/**
 * Holds exactly one payload.
 * Late listeners will get the very last payload.
 */
export class ValueCache<T> extends ArrayCache<T> {
    /** Identifies this cache implementation. */
    public readonly kind = 'valueCache';
    /** Replace the previous payload with the new one. */
    public add(value: T): void {
        this._payloads = [value];
    }
}

/**
 * Holds all payloads up to a given capacity.
 * Late listeners will get at max the `capacity` latest payloads.
 */
export class CapacityCollectionCache<T> implements Cache<T> {
    private _payloads: T[] = [];

    /** Identifies this cache implementation. */
    public readonly kind = 'capacityCache';

    /** Create a cache that retains at most `capacity` payloads. */
    constructor(private readonly _capacity: number) {
        if (_capacity <= 0) {
            throw new Error(`constructing a cache with a capacity of ${_capacity} makes no sense`);
        }
    }

    /** Store a payload, discarding the oldest one when at capacity. */
    public add(value: T): void {
        this._payloads = [...this._payloads.slice(-this._capacity + 1), value];
    }

    /** Visit cached payloads from oldest to newest. */
    public forEach(callback: (value: T) => void): void {
        for (const value of this._payloads) {
            callback(value);
        }
    }
}

/**
 * Holds all payloads.
 * Late listeners will get all previous payloads.
 */
export class CollectionCache<T> extends ArrayCache<T> {
    /** Identifies this cache implementation. */
    public readonly kind = 'collectionCache';

    /** Create a collection cache that retains only the latest `capacity` payloads. */
    public static withCapacity<T>(capacity: number): CapacityCollectionCache<T> {
        return new CapacityCollectionCache(capacity);
    }

    /** Append a payload to the cache. */
    public add(value: T): void {
        this._payloads.push(value);
    }
}

/**
 * Holds all payloads grouped by a certain predicate.
 * Late listeners will receive the latest payload from each of these categories.
 */
export class GroupingCache<T, G> implements Cache<T> {
    private readonly _payloads = new Map<G, T>();

    /** Identifies this cache implementation. */
    public readonly kind = 'groupingCache';

    /** Create a grouping cache whose key is selected from each payload. */
    public static byProperty<T>(
        groupPredicate: (payload: T) => T[keyof T],
    ): GroupingCache<T, T[keyof T]> {
        return new GroupingCache(groupPredicate);
    }

    /** Create a cache that groups payloads using `groupPredicate`. */
    constructor(private readonly _groupPredicate: (payload: T) => G) {}

    /** Store the payload as the latest value for its group. */
    public add(payload: T): void {
        const group = this._groupPredicate(payload);
        this._payloads.set(group, payload);
    }

    /** Visit the latest cached payload from each group. */
    public forEach(callback: (payload: T) => void): void {
        for (const payload of this._payloads.values()) {
            callback(payload);
        }
    }
}
