/**
 * Internal association between listener callbacks and their removal tags.
 * @module
 */
import type { Listener } from './interfaces.ts';

/** Track listeners by tag and tags by listener. */
export class TagMap<T> {
    private readonly _tagToListeners = new WeakMap<any, Set<Listener<T>>>();

    private readonly _listenerToTags = new WeakMap<Listener<T>, Set<any>>();

    /** Associate a listener with each supplied tag. */
    public setListeners(listener: Listener<T>, ...tags: any[]) {
        const tagSet = this._listenerToTags.get(listener) || new Set();
        tags.forEach((tag) => {
            const listenerSet = this._tagToListeners.get(tag) || new Set();
            listenerSet.add(listener);
            tagSet.add(tag);
            this._tagToListeners.set(tag, listenerSet);
        });
        this._listenerToTags.set(listener, tagSet);
    }

    /** Return all listeners associated with a tag. */
    public getListeners(tag: any): Set<Listener<T>> {
        return this._tagToListeners.get(tag) || new Set();
    }

    /** Return all tags associated with a listener. */
    public getTags(listener: Listener<T>): Set<any> {
        return this._listenerToTags.get(listener) || new Set();
    }

    /** Remove a listener and its tag associations. */
    public clearListener(listener: Listener<T>) {
        const tags = this.getTags(listener);
        this._listenerToTags.delete(listener);
        tags.forEach((tag) => {
            const listenerSet = this.getListeners(tag);
            listenerSet.delete(listener);
            if (listenerSet.size === 0) {
                this._tagToListeners.delete(tag);
            }
        });
    }
}
