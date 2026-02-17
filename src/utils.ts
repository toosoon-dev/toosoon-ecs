type NextCallback<T> = (index: number) => T | void;

type TestCallback<T> = (item: T) => boolean | void;

type MapCallback<T, P> = (item: T) => P;

/**
 * Utility class for asynchronous access to a list
 *
 * @exports
 * @class Iterator
 * @template T
 */
export class Iterator<T> {
  private _next: NextCallback<T>;
  private _cache: T[] = [];
  private _end = false;

  /**
   * @param {Function} next
   */
  constructor(next: NextCallback<T>) {
    this._next = next;
  }

  /**
   * Allow iteration across all items
   *
   * @param {Function} test
   */
  public each(test: TestCallback<T>): void {
    let index = 0;
    while (true) {
      let value;
      if (this._cache.length <= index) {
        if (this._end) {
          break;
        }

        value = this._next(index++);
        if (typeof value === 'undefined') {
          this._end = true;
          break;
        }
        this._cache.push(value);
      } else {
        value = this._cache[index++];
      }

      if (test(value) === false) {
        break;
      }
    }
  }

  /**
   * Return the value of the first element that satisfies the provided testing function
   *
   * @param {Function} test
   * @returns {T|undefined}
   */
  public find(test: TestCallback<T>): T | undefined {
    let out;
    this.each((item) => {
      if (test(item)) {
        out = item;
        return false;
      }
    });
    return out;
  }

  /**
   * Create an array with all elements that pass the test implemented by the provided function
   *
   * @param {Function} test
   * @returns {T[]}
   */
  public filter(test: TestCallback<T>): T[] {
    const list: T[] = [];
    this.each((item) => {
      if (test(item)) {
        list.push(item);
      }
    });
    return list;
  }

  /**
   * Create a new array with the results of calling a provided function on every element in this iterator
   *
   * @template P
   * @param {Function} callback
   * @returns {P[]}
   */
  public map<P>(callback: MapCallback<T, P>): P[] {
    const list: P[] = [];
    this.each((item) => {
      list.push(callback(item));
    });
    return list;
  }
}
