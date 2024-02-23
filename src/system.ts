// import { Gui } from 'toosoon-gui';

import Component from './component';
import Entity from './entity';
import { ECSState, Listener } from './types';
import { Iterator } from './utils';
import World from './world';

/**
 * Represent the logic that transforms component data of an entity from its current state to its next state
 * A system runs on entities that have a specific set of component types
 *
 * @exports
 * @class System
 * @abstract
 */
export default abstract class System {
  /**
   * Static reference to System id
   */
  static id = 1;

  /**
   * Unique identifier of an instance of this system
   */
  readonly id: number;

  /**
   * IDs of the types of components this system expects the entity to have before it can act on
   * Note: If you want to create a system that acts on all entities, enter [-1]
   */
  readonly componentTypes: number[] = [];

  /**
   * An array of states that allow the update function to be called
   */
  readonly states: string[] = [];

  /**
   * The maximum times per second this system should be updated
   */
  readonly frequency: number;

  readonly listeners: { [event: string]: Listener[] } = {};

  /**
   * Reference to the ECS World, changed at runtime during interactions
   */
  public world!: World;

  // protected gui!: Gui;

  /**
   * Add this system GUI to GUI Systems folder
   *
   * @param {Gui} gui
   */
  // public addGUI?(gui: Gui): void;

  /**
   * Allow to trigger any event. Systems interested in this event will be notified immediately
   *
   * Injected by ECS at runtime
   *
   * @param {string} event
   * @param {any} data
   */
  public trigger?: (event: string, data: unknown) => void;

  /**
   * Called when:
   * - An entity with the characteristics (components) expected by this system is added in the world
   * - This system is added in the world and this world has one or more entities with the characteristics expected by this system
   * - An existing entity in the same world receives a new component at runtime and all of its new components match the standard expected by this system
   *
   * @param {Entity} entity
   */
  public enter?(entity: Entity): void;

  /**
   * Called when:
   * - An entity with the characteristics (components) expected by this system is removed from the world
   * - This system is removed from the world and this world has one or more entities with the characteristics expected by this system
   * - An existing entity in the same world loses a component at runtime and its new component set no longer matches the standard expected by this system
   *
   * @param {Entity} entity
   */
  public exit?(entity: Entity): void;

  /**
   * Called when this system was added to the world
   */
  public onAdded?(): void;

  /**
   * Called when this system is removed from the world
   */
  public onRemoved?(): void;

  /**
   * Called when the world state changes
   *
   * @param {string} newState
   * @param {string} prevState
   */
  public onStateChange?(newState: string, prevState: string): void;

  /**
   * Called when an expected feature of this system is added or removed from the entity
   *
   * @param {Entity} entity
   * @param {Component} [added]
   * @param {Component} [removed]
   */
  public change?(entity: Entity, added?: Component, removed?: Component): void;

  /**
   * Called before updating entities available for this system
   * It is only called when there are entities with the characteristics expected by this system
   *
   * @param {number} time
   * @param {number} delta
   * @param {Entity[]} entities
   */
  public beforeUpdateAll?(time: number, delta: number, entities: Entity[]): void;

  /**
   * Called in updates, limited to the value set by the `frequency` property
   *
   * @param {number} time
   * @param {number} delta
   * @param {Entity} entity
   */
  public update?(time: number, delta: number, entity: Entity): void;

  /**
   * Called after performing update of entities available for this system
   * It is only called when there are entities with the characteristics expected by this system
   *
   * @param {number} time
   * @param {number} delta
   * @param {Entity[]} entities
   */
  public afterUpdateAll?(time: number, delta: number, entities: Entity[]): void;

  /**
   * @param {number[]} componentTypes IDs of the types of components this system expects the entity to have before it can act on
   * @param {string[]} [states='Any'] An array of states that allow the update function to be called
   * @param {number} [frequency=0]    The maximum times per second this system should be updated
   */
  constructor(componentTypes: number[], states: string[] | number = [ECSState.Any], frequency: number = 0) {
    // Handle second argument as frequency
    if (typeof states === 'number') {
      frequency = states;
      states = [ECSState.Any];
    }

    this.id = System.id++;
    this.componentTypes = componentTypes;
    this.states = states;
    this.frequency = frequency;
  }

  /**
   * Allow the system to listen for a specific event that occurred during any update
   *
   * In callback, the system has access to the existing entities in the world that are processed by this system,
   * in the form of an Iterator, and the raw data sent by the event trigger.
   *
   * @param {string} event
   * @param {Listener} listener
   * @param {boolean} once
   */
  protected addListener(event: string, listener: Listener, once?: boolean): void {
    if (!this.listeners.hasOwnProperty(event)) {
      this.listeners[event] = [];
    }

    if (once) {
      const callback = listener.bind(this);

      listener = (data, entities) => {
        callback(data, entities);

        const index = this.listeners[event].indexOf(listener);

        if (index >= 0) {
          this.listeners[event].splice(index, 1);
        }

        if (this.listeners[event].length === 0) {
          delete this.listeners[event];
        }
      };
    }

    this.listeners[event].push(listener);
  }

  /**
   * Remove an event listener from this system
   *
   * @param {string} event
   */
  protected removeListener(event: string): void {
    if (this.listeners.hasOwnProperty(event)) {
      delete this.listeners[event];
    }
  }

  /**
   * Search in the world for all entities that have a specific set of components
   *
   * @param {number[]} componentTypes
   * @returns {Iterator}
   */
  protected query(componentTypes: number[]): Iterator<Entity> {
    return this.world.query(componentTypes);
  }

  /**
   * Remove all listeners from this system
   */
  public destroy(): void {
    for (let event in this.listeners) {
      this.removeListener(event);
    }
  }
}
