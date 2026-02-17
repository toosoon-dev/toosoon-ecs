import { now } from 'toosoon-utils/functions';

import Component from './component';
import Entity from './entity';
import System from './system';

import { Iterator } from './utils';
import { ECSState } from './types';
import type { Listener } from './types';

/**
 * The very definition of the ECS World
 *
 * @exports
 * @class
 */
export default class World {
  /**
   * Static reference to Entity class
   */
  public static Entity = Entity;

  /**
   * Static reference to Component class
   */
  public static Component = Component;

  /**
   * Static reference to System class
   */
  public static System = System;

  /**
   * This world unique identifier
   */
  readonly id: string;

  /**
   * All systems in this world
   */
  private _systems: System[] = [];

  /**
   * All entities in this world
   */
  private _entities: Entity[] = [];

  /**
   * Index the systems that must be run for each entity
   */
  private _entitySystems: Record<number, System[]> = {};

  /**
   * Record the last instant a system was run in this world for an entity, using real time
   */
  private _entitySystemLastUpdate: Record<number, Record<number, number>> = {};

  /**
   * Record the last instant a system was run in this world for an entity, using game time
   */
  private _entitySystemLastUpdateGame: Record<number, Record<number, number>> = {};

  /**
   * Save subscriptions made to entities
   */
  private _entitySubscription: Record<number, () => void> = {};

  /**
   * Save queries
   */
  private _queryCache: Record<number, Entity[]> = {};

  /**
   * World state determining which systems are updated
   */
  private _state = '';

  /**
   * Allow you to apply slow motion effect on systems
   * When `timeScale` is 1, the timestamp and delta parameters received by the systems are consistent with the actual timestamp
   * When `timeScale` is 0.5, the values received by systems will be half of the actual value
   *
   * ATTENTION! The systems continue to be invoked obeying their normal frequencies, what changes is only the values received in the timestamp and delta parameters
   *
   */
  public timeScale: number = 1;

  /**
   * Last execution of update method
   */
  private _lastUpdate: number = now();

  /**
   * The timestamp of the game, different from the real world, is updated according to timeScale
   * If at no time does the timeScale change, the value is the same as the current timestamp
   *
   * This value is sent to the systems update method
   */
  private _gameTime: number = 0;

  /**
   * @param {string} [id='']
   * @param {System[]} [systems=[]]
   */
  constructor(id: string = '', systems: System[] = []) {
    this.id = id;
    systems.forEach((system) => this.addSystem(system));
  }

  /**
   * Injection for the system trigger method
   *
   * @param {string} event Event key name
   * @param {any} data Event data
   */
  private _systemTrigger = (event: string, data: any): void => {
    this._systems.forEach((system) => {
      const listeners: Record<string, Listener[]> = system.listeners;
      if (listeners.hasOwnProperty(event) && listeners[event].length > 0) {
        this._inject(system);
        const entitiesIterator = this.query(system.componentTypes);
        listeners[event].forEach((listener) => listener(data, entitiesIterator));
      }
    });
  };

  /**
   * Update this world state
   *
   * @param {string} state New world state
   */
  public setState(state: string): void {
    const oldState = this._state;
    this._state = state;
    this._systems.forEach((system) => system.onStateChange?.(state, oldState));
  }

  /**
   * Add an entity to this world
   *
   * @param {Entity} entity Entity to add to this world
   */
  public addEntity(entity: Entity): void {
    if (!entity || this._entities.includes(entity)) {
      return;
    }

    this._entities.push(entity);
    this._entitySystemLastUpdate[entity.id] = {};
    this._entitySystemLastUpdateGame[entity.id] = {};

    // Remove entity subscription
    if (this._entitySubscription.hasOwnProperty(entity.id)) {
      this._entitySubscription[entity.id]();
      delete this._entitySubscription[entity.id];
    }

    // Add new subscription
    this._entitySubscription[entity.id] = entity.subscribe((entity, added, removed) => {
      this._onEntityUpdate(entity, added, removed);
      this._indexEntity(entity);
    });

    entity.onAdded?.();

    this._indexEntity(entity);
  }

  /**
   * Remove an entity from this world
   *
   * @param {number|Entity} id Entity (id) to remove from this world
   * @param {boolean} [dispose=true]
   */
  public removeEntity(id: number | Entity, dispose: boolean = true): void {
    // Handle `id` argument as `Entity`
    let entity = typeof id === 'number' ? (this.getEntity(id) as Entity) : id;

    if (!entity) {
      return;
    }

    // Clear up _queryCache
    const removeCached: number[] = [];
    Object.keys(this._queryCache).forEach((component) => {
      const type = Number(component);
      if (entity.getComponents(type).length > 0) {
        removeCached.push(type);
      }
    });

    removeCached.forEach((cache) => {
      delete this._queryCache[cache];
    });

    const index = this._entities.indexOf(entity);
    if (index >= 0) {
      this._entities.splice(index, 1);
    }

    // Remove entity subscription
    if (this._entitySubscription.hasOwnProperty(entity.id)) {
      this._entitySubscription[entity.id]();
      delete this._entitySubscription[entity.id];
    }

    // Call system exit
    this._entitySystems[entity.id]?.forEach((system) => {
      if (system.exit) {
        this._inject(system);
        system.exit(entity);
      }
    });

    entity.onRemoved?.();

    // Remove associative indexes
    delete this._entitySystems[entity.id];
    delete this._entitySystemLastUpdate[entity.id];
    delete this._entitySystemLastUpdateGame[entity.id];

    if (dispose) {
      entity = null as any;
    }
  }

  /**
   * Add a system to this world
   *
   * @param {System} system System to add to this world
   */
  public addSystem(system: System): void {
    if (this._systems.includes(system)) {
      return;
    }

    this._systems.push(system);

    // Index entities
    this._entities.forEach((entity) => {
      this._indexEntity(entity, system);
    });

    // Call system enter
    this._entities.forEach((entity) => {
      if (entity.active) {
        const systems = this._entitySystems[entity.id];
        if (systems && systems.includes(system)) {
          if (system.enter) {
            this._inject(system);
            system.enter(entity);
          }
        }
      }
    });

    this._inject(system);
    system.onAdded?.();
  }

  /**
   * Remove a system from this world
   *
   * @param {number|System} id System (id) to remove from this world
   */
  public removeSystem(id: number | System): void {
    // Handle `id` argument as `System`
    const system = typeof id === 'number' ? (this.getSystem(id) as System) : id;

    if (!system) {
      return;
    }

    // Call system exit
    this._entities.forEach((entity) => {
      if (entity.active) {
        const systems = this._entitySystems[entity.id];
        if (systems?.includes(system)) {
          if (system.exit) {
            this._inject(system);
            system.exit(entity);
          }
        }
      }
    });

    const index = this._systems.indexOf(system);
    this._systems.splice(index, 1);

    if (system.world === this) {
      system.destroy();
      system.onRemoved?.();
      system.world = undefined as any;
      system.trigger = undefined;
    }

    // Index entities
    this._entities.forEach((entity) => this._indexEntity(entity, system));
  }

  /**
   * Search for all entities that have a specific set of components
   *
   * @param {number[]} componentTypes Component types to search for
   * @returns {Iterator}
   */
  public query(componentTypes: number[]): Iterator<Entity> {
    let index = 0;

    return new Iterator<Entity>(() => {
      outside: for (let l = this._entities.length; index < l; index++) {
        const entity = this._entities[index];

        // Prevent unnecessary processing
        if (componentTypes.includes(-1)) {
          return entity;
        }

        // Allow to query for all entities in this world. -1 = All components
        const entityComponentIDs: number[] = [-1].concat(
          Object.keys(entity.components).map((key) => Number.parseInt(key, 10))
        );

        for (let i = 0, j = componentTypes.length; i < j; i++) {
          if (!entityComponentIDs.includes(componentTypes[i])) {
            continue outside;
          }
        }

        // Entity has all the components
        return entity;
      }
    });
  }

  /**
   * Search for all entities that have a specific component
   *
   * @param {number} componentType Component type to search for
   * @returns {Entity[]}
   */
  public queryEntitiesByComponent(componentType: number): Entity[] {
    if (this._queryCache.hasOwnProperty(componentType)) {
      return this._queryCache[componentType];
    }

    const entities: Entity[] = [];
    this._entities.forEach((entity) => {
      const entityComponentIDs: number[] = [-1].concat(
        Object.keys(entity.components).map((key) => Number.parseInt(key, 10))
      );

      if (entityComponentIDs.includes(componentType)) {
        entities.push(entity);
      }
    });

    if (entities.length > 0) {
      this._queryCache[componentType] = entities;
    }

    return entities;
  }

  /**
   * Inject the execution context into the system
   * A system can exist on several worlds at the same time, ECS ensures that global methods will always reference the
   * currently running world
   *
   * @param {System} system System to inject in this world
   * @returns {System}
   */
  private _inject(system: System): System {
    system.world = this;
    system.trigger = this._systemTrigger;
    return system;
  }

  /**
   * Index an entity for a specific system
   *
   * @param {Entity} entity Entity to index
   * @param {System} system System to index
   */
  private _indexEntitySystem = (entity: Entity, system: System): void => {
    const index = this._entitySystems[entity.id].indexOf(system);

    if (!this._systems.includes(system)) {
      if (index >= 0) {
        this._entitySystems[entity.id].splice(index, 1);
        delete this._entitySystemLastUpdate[entity.id][system.id];
        delete this._entitySystemLastUpdateGame[entity.id][system.id];
      }
      return;
    }

    const systemComponentTypes = system.componentTypes;

    for (let a = 0, l = systemComponentTypes.length; a < l; a++) {
      // Allow a system to receive updates from all entities in this world. -1 = All components
      let entityComponentIDs: number[] = [-1].concat(
        Object.keys(entity.components).map((key) => Number.parseInt(key, 10))
      );
      if (!entityComponentIDs.includes(systemComponentTypes[a])) {
        if (index >= 0) {
          // Inform the system of relationship removal
          if (system.exit) {
            this._inject(system);
            system.exit(entity);
          }

          this._entitySystems[entity.id].splice(index, 1);
          delete this._entitySystemLastUpdate[entity.id][system.id];
          delete this._entitySystemLastUpdateGame[entity.id][system.id];
        }
        return;
      }
    }

    // Entity has all the components this system needs
    if (index < 0) {
      this._entitySystems[entity.id].push(system);
      this._entitySystemLastUpdate[entity.id][system.id] = now();
      this._entitySystemLastUpdateGame[entity.id][system.id] = this._gameTime;

      // Informs the system about the new relationship
      if (system.enter) {
        this._inject(system);
        system.enter(entity);
      }
    }
  };

  /**
   * Index an entity
   *
   * @param {Entity} entity Entity to index
   * @param {System} [system] System to index
   */
  private _indexEntity(entity: Entity, system?: System): void {
    if (!this._entitySystems.hasOwnProperty(entity.id)) {
      this._entitySystems[entity.id] = [];
    }

    if (system) {
      // Index entity for a specific system
      this._indexEntitySystem(entity, system);
    } else {
      // Index the entire entity
      this._systems.forEach((system) => this._indexEntitySystem(entity, system));
    }
  }

  /**
   * Call the `change` method of the systems in this world when an entity receives or loses components
   *
   * @param {Entity} entity Updated entity
   * @param {Component} [added] Component added to the entity
   * @param {Component} [removed] Component removed from the entity
   */
  private _onEntityUpdate(entity: Entity, added?: Component, removed?: Component): void {
    const systems = this._entitySystems[entity.id];
    if (!systems) {
      return;
    }

    // Save systems to notify
    const toNotify: System[] = [];

    systems.forEach((system) => {
      const needsNotify =
        system.componentTypes.includes(-1) ||
        (added && system.componentTypes.includes(added.type)) ||
        (removed && system.componentTypes.includes(removed.type));

      if (system.change && needsNotify) {
        toNotify.push(system);
      }
    });

    // Notify systems
    toNotify.forEach((system) => {
      this._inject(system);
      const all = system.componentTypes.includes(-1);
      system.change?.(
        entity,
        // Send only the list of components this system expects
        all ? added : added && system.componentTypes.includes(added.type) ? added : undefined,
        all ? removed : removed && system.componentTypes.includes(removed.type) ? removed : undefined
      );
    });
  }

  /**
   * Call the `update` method of the systems in this world
   */
  public update(): void {
    const time = now();

    this._gameTime += (time - this._lastUpdate) * this.timeScale;
    this._lastUpdate = time;

    // Save systems & entities to update
    const updated: Record<string, { system: System; delta: number; entities: Entity[] }> = {};

    this._entities.forEach((entity) => {
      if (!entity.active) {
        this.removeEntity(entity);
        return;
      }

      const systems = this._entitySystems[entity.id];
      if (!systems) {
        return;
      }

      const entityLastUpdates = this._entitySystemLastUpdate[entity.id];
      const entityLastUpdatesGame = this._entitySystemLastUpdateGame[entity.id];
      let elapsed, elapsedScaled, interval;

      this.getActiveSystems().forEach((system) => {
        const id = `${system.id}`;

        if (system.update) {
          // Create a new "update" for current system
          if (!updated.hasOwnProperty(id)) {
            elapsed = time - entityLastUpdates[system.id];
            elapsedScaled = this._gameTime - entityLastUpdatesGame[system.id];

            // Limit FPS
            if (system.frequency > 0) {
              interval = 1000 / system.frequency;
              if (elapsed < interval) {
                return;
              }

              // Adjust for interval not being a multiple of RAF's interval (16.7ms)
              entityLastUpdates[system.id] = time - (elapsed % interval);
              entityLastUpdatesGame[system.id] = this._gameTime;
            } else {
              entityLastUpdates[system.id] = time;
              entityLastUpdatesGame[system.id] = this._gameTime;
            }

            // Create current system's "update"
            updated[id] = { system, delta: elapsedScaled / 1000, entities: [] };
          }

          // Add entity to current system's "update"
          updated[id].entities.push(entity);
        }
      });
    });

    // Update systems
    Object.values(updated).forEach(({ system, delta, entities }) => {
      this._inject(system);
      system.beforeUpdateAll?.(this._gameTime, delta, entities);
      entities.forEach((entity) => system.update?.(this._gameTime, delta, entity));
      system.afterUpdateAll?.(this._gameTime, delta, entities);
    });
  }

  /**
   * Remove all entities and systems in this world
   */
  public destroy(): void {
    this._entities.forEach((entity) => this.removeEntity(entity));
    this._systems.forEach((system) => this.removeSystem(system));
  }

  /**
   * Get an entity by id
   *
   * @param {number} id Entity id
   * @returns {Entity|undefined}
   */
  public getEntity(id: number): Entity | undefined {
    return this._entities.find((entity) => entity.id === id);
  }

  /**
   * Get a system by id
   *
   * @param {number} id System id
   * @returns {System|undefined}
   */
  public getSystem(id: number): System | undefined {
    return this._systems.find((system) => system.id === id);
  }

  /**
   * Get all active systems
   *
   * @param {[string]} [state] State to match
   * @returns {System[]}
   */
  public getActiveSystems(state: string = this._state): System[] {
    return this._systems.filter((system) => system.states.includes(ECSState.Any) || system.states.includes(state));
  }

  /**
   * Log in the console an array of active systems
   */
  public logActiveSystems(state?: string): void {
    console.log('logActiveSystems()', this.getActiveSystems(state));
  }
}
