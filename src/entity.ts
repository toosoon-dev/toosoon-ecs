import type Component from './component';
import type { Susbcription } from './types';

/**
 * Representation of an entity in ECS
 *
 * @exports
 * @class Entity
 * @abstract
 */
export default abstract class Entity {
  /**
   * Static reference to Entity id
   */
  static id: number = 1;

  /**
   * Unique identifier of an instance of this entity
   */
  readonly id: number;

  /**
   * List of components attached to this entity
   */
  public components: Record<number, Component[]> = {};

  /**
   * Array of subscriptions attached to this entity activity
   */
  private _subscriptions: Susbcription[] = [];

  public active: boolean = true;

  constructor() {
    this.id = Entity.id++;
  }

  /**
   * Add a component to this entity
   *
   * @param {Component} component Component to add to this entity
   */
  public add(component: Component): void {
    const type = component.type;

    if (!this.components.hasOwnProperty(type)) {
      this.components[type] = [];
    }

    if (this.components[type].indexOf(component) >= 0) {
      return;
    }

    this.components[type].push(component);

    this._subscriptions.forEach((subscription) => subscription(this, component, undefined));
  }

  /**
   * Remove a component from this entity
   *
   * @param {Component} component Component to remove from this entity
   */
  public remove(component: Component): void {
    const type = component.type;

    if (!this.components.hasOwnProperty(type)) {
      return;
    }

    const index = this.components[type].indexOf(component);
    if (index >= 0) {
      this.components[type].splice(index, 1);

      if (this.components[type].length < 1) {
        delete this.components[type];
      }

      this._subscriptions.forEach((subscription) => subscription(this, undefined, component));
    }
  }

  /**
   * Called when this entity is added to the world
   */
  public onAdded?(): void;

  /**
   * Called when this entity is removed from the world
   */
  public onRemoved?(): void;

  /**
   * Allow interested parties to receive information when this entity's component list is updated
   *
   * @param {Susbcription} susbcription Callback to call when this entity's component list is updated
   * @returns {Function}
   */
  public subscribe(susbcription: Susbcription): () => Entity {
    this._subscriptions.push(susbcription);

    return () => {
      const index = this._subscriptions.indexOf(susbcription);
      if (index >= 0) {
        this._subscriptions.splice(index, 1);
      }
      return this;
    };
  }

  /**
   * Get all components with a specified type
   *
   * @param {number} type Unique component type identifier
   * @returns {Component[]}
   */
  public getComponents(type: number): Component[] {
    return [...this.components[type]];
  }
}
