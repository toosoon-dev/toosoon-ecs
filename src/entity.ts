import Component from './component';
import { Susbcription } from './types';

/**
 * Representation of an entity in ECS
 *
 * @exports
 * @class Entity
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
  public components: { [key: number]: Component[] } = {};

  /**
   * Array of subscriptions attached to this entity activity
   */
  private subscriptions: Susbcription[] = [];

  public active: boolean = true;

  /**
   * Called when this entity is added to the world
   */
  public onAdded?(): void;

  /**
   * Called when this entity is removed from the world
   */
  public onRemoved?(): void;

  constructor() {
    this.id = Entity.id++;
  }

  /**
   * Add a component to this entity
   *
   * @param {Component} component
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

    this.subscriptions.forEach((subscription) => subscription(this, component, undefined));
  }

  /**
   * Remove a component from this entity
   *
   * @param {Component} component
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

      this.subscriptions.forEach((subscription) => subscription(this, undefined, component));
    }
  }

  /**
   * Allow interested parties to receive information when this entity's component list is updated
   *
   * @param {Susbcription} susbcription
   * @returns {Function}
   */
  public subscribe(susbcription: Susbcription): () => Entity {
    this.subscriptions.push(susbcription);

    return () => {
      const index = this.subscriptions.indexOf(susbcription);
      if (index >= 0) {
        this.subscriptions.splice(index, 1);
      }
      return this;
    };
  }

  /**
   * Get all components with a specified type
   *
   * @param {number} type
   * @returns {Component[]}
   */
  public getComponents(type: number): Component[] {
    return [...this.components[type]];
  }
}
