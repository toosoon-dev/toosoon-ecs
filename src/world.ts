import now from 'toosoon-utils/now';

import Component from './component';
import Entity from './entity';
import System from './system';
import { ECSState, Listener } from './types';
import { Iterator } from './utils';

/**
 * The very definition of the ECS World
 *
 * @exports
 * @class
 */
export default class World {
  public static Entity = Entity;
  public static Component = Component;
  public static System = System;

  public id = '';

  /**
   * All systems in this world
   */
  private systems: System[] = [];

  /**
   * All entities in this world
   */
  private entities: Entity[] = [];

  /**
   * Index the systems that must be run for each entity
   */
  private entitySystems: { [key: number]: System[] } = {};

  /**
   * Record the last instant a system was run in this world for an entity, using real time
   */
  private entitySystemLastUpdate: { [key: number]: { [key: number]: number } } = {};

  /**
   * Record the last instant a system was run in this world for an entity, using game time
   */
  private entitySystemLastUpdateGame: { [key: number]: { [key: number]: number } } = {};

  /**
   * Save subscriptions made to entities
   */
  private entitySubscription: { [key: number]: () => void } = {};

  /**
   * Save queries
   */
  private queryCache: { [key: number]: Entity[] } = {};

  /**
   * World state determining which systems are updated
   */
  private state = '';

  /**
   * Allow you to apply slow motion effect on systems
   * When timeScale is 1, the timestamp and delta parameters received by the systems are consistent with the actual timestamp
   * When timeScale is 0.5, the values received by systems will be half of the actual value
   *
   * ATTENTION! The systems continue to be invoked obeying their normal frequencies, what changes is only the values received in the timestamp and delta parameters
   *
   */
  public timeScale: number = 1;

  /**
   * Last execution of update method
   */
  private lastUpdate: number = now();

  /**
   * The timestamp of the game, different from the real world, is updated according to timeScale
   * If at no time does the timeScale change, the value is the same as the current timestamp
   *
   * This value is sent to the systems update method
   */
  private gameTime: number = 0;

  /**
   * @param {string} id
   * @param {System[]} [systems=[]]
   */
  constructor(id: string, systems: System[] = []) {
    this.id = id;
    systems.forEach((system) => this.addSystem(system));
  }

  /**
   * Log in the console an array of currently active systems
   */
  public logActiveSystems(): void {
    console.log('logActiveSystems()', this.getActiveSystems());
  }

  /**
   * Injection for the system trigger method
   *
   * @param {string} event
   * @param {any} data
   */
  private systemTrigger = (event: string, data: unknown): void => {
    this.systems.forEach((system) => {
      const listeners: { [event: string]: Listener[] } = system.listeners;
      if (listeners.hasOwnProperty(event) && listeners[event].length > 0) {
        this.inject(system);
        const entitiesIterator = this.query(system.componentTypes);
        listeners[event].forEach((listener) => listener(data, entitiesIterator));
      }
    });
  };

  /**
   * Update state
   *
   * @param {string} state
   */
  public setState(state: string): void {
    const oldState = this.state;
    this.state = state;
    this.systems.forEach((system) => system.onStateChange?.(state, oldState));
  }

  /**
   * Add an entity to this world
   *
   * @param {Entity} entity
   */
  public addEntity(entity: Entity): void {
    if (!entity || this.entities.includes(entity)) {
      return;
    }

    this.entities.push(entity);
    this.entitySystemLastUpdate[entity.id] = {};
    this.entitySystemLastUpdateGame[entity.id] = {};

    // Remove entity subscription
    if (this.entitySubscription.hasOwnProperty(entity.id)) {
      this.entitySubscription[entity.id]();
      delete this.entitySubscription[entity.id];
    }

    // Add new subscription
    this.entitySubscription[entity.id] = entity.subscribe((entity, added, removed) => {
      this.onEntityUpdate(entity, added, removed);
      this.indexEntity(entity);
    });

    entity.onAdded?.();

    this.indexEntity(entity);
  }

  /**
   * Remove an entity from this world
   *
   * @param {Entity|number} instance
   * @param {boolean} [dispose=true]
   */
  public removeEntity(instance: Entity | number, dispose: boolean = true): void {
    let entity = (typeof instance === 'number' ? this.getEntity(instance) : instance) as Entity;

    if (!entity) {
      return;
    }

    // Clear up queryCache
    const removeCached: number[] = [];
    Object.keys(this.queryCache).forEach((component) => {
      const index = Number(component);
      if (entity.getComponent(index).length > 0) {
        removeCached.push(index);
      }
    });

    removeCached.forEach((cache) => {
      delete this.queryCache[cache];
    });

    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }

    // Remove entity subscription
    if (this.entitySubscription.hasOwnProperty(entity.id)) {
      this.entitySubscription[entity.id]();
      delete this.entitySubscription[entity.id];
    }

    // Call system exit
    this.entitySystems[entity.id]?.forEach((system) => {
      if (system.exit) {
        this.inject(system);
        system.exit(entity);
      }
    });

    entity.onRemoved?.();

    // Remove associative indexes
    delete this.entitySystems[entity.id];
    delete this.entitySystemLastUpdate[entity.id];
    delete this.entitySystemLastUpdateGame[entity.id];

    if (dispose) {
      entity = null as any;
    }
  }

  /**
   * Add a system to this world
   *
   * @param {System} system
   */
  public addSystem(system: System): void {
    if (this.systems.includes(system)) {
      return;
    }

    this.systems.push(system);

    // Index entities
    this.entities.forEach((entity) => {
      this.indexEntity(entity, system);
    });

    // Call system enter
    this.entities.forEach((entity) => {
      if (entity.active) {
        const systems = this.entitySystems[entity.id];
        if (systems && systems.includes(system)) {
          if (system.enter) {
            this.inject(system);
            system.enter(entity);
          }
        }
      }
    });

    this.inject(system);
    system.onAdded?.();
  }

  /**
   * Remove a system from this world
   *
   * @param {System} system
   */
  public removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index >= 0) {
      // Call system exit
      this.entities.forEach((entity) => {
        if (entity.active) {
          const systems = this.entitySystems[entity.id];
          if (systems?.includes(system)) {
            if (system.exit) {
              this.inject(system);
              system.exit(entity);
            }
          }
        }
      });

      this.systems.splice(index, 1);

      if (system.world === this) {
        system.destroy();
        system.onRemoved?.();
        system.world = undefined as any;
        system.trigger = undefined;
      }

      // Index entities
      this.entities.forEach((entity) => this.indexEntity(entity, system));
    }
  }

  /**
   * Search for all entities that have a specific set of components
   *
   * @param {number[]} componentTypes
   * @returns {Iterator}
   */
  public query(componentTypes: number[]): Iterator<Entity> {
    let index = 0;

    return new Iterator<Entity>(() => {
      outside: for (let l = this.entities.length; index < l; index++) {
        const entity = this.entities[index];

        // Prevent unnecessary processing
        if (componentTypes.includes(-1)) {
          return entity;
        }

        // Allow to query for all entities in the world. -1 = All components
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
   * @param {number} componentType
   * @returns {Entity[]}
   */
  public queryEntitiesByComponent(componentType: number): Entity[] {
    if (this.queryCache.hasOwnProperty(componentType)) {
      return this.queryCache[componentType];
    }

    const entities: Entity[] = [];
    this.entities.forEach((entity) => {
      const entityComponentIDs: number[] = [-1].concat(
        Object.keys(entity.components).map((key) => Number.parseInt(key, 10))
      );

      if (entityComponentIDs.includes(componentType)) {
        entities.push(entity);
      }
    });

    if (entities.length > 0) {
      this.queryCache[componentType] = entities;
    }

    return entities;
  }

  /**
   * Inject the execution context into the system
   *
   * A system can exist on several worlds at the same time, ECS ensures that global methods will always reference the
   * currently running world.
   *
   * @param {System} system
   * @returns {System}
   */
  private inject(system: System): System {
    system.world = this;
    system.trigger = this.systemTrigger;
    return system;
  }

  /**
   * Index an entity for a specific system
   *
   * @param {Entity} entity
   * @param {System} system
   */
  private indexEntitySystem = (entity: Entity, system: System): void => {
    const index = this.entitySystems[entity.id].indexOf(system);

    if (!this.systems.includes(system)) {
      if (index >= 0) {
        this.entitySystems[entity.id].splice(index, 1);
        delete this.entitySystemLastUpdate[entity.id][system.id];
        delete this.entitySystemLastUpdateGame[entity.id][system.id];
      }
      return;
    }

    const systemComponentTypes = system.componentTypes;

    for (let a = 0, l = systemComponentTypes.length; a < l; a++) {
      // Allow a system to receive updates from all entities in the world. -1 = All components
      let entityComponentIDs: number[] = [-1].concat(
        Object.keys(entity.components).map((key) => Number.parseInt(key, 10))
      );
      if (!entityComponentIDs.includes(systemComponentTypes[a])) {
        if (index >= 0) {
          // Inform the system of relationship removal
          if (system.exit) {
            this.inject(system);
            system.exit(entity);
          }

          this.entitySystems[entity.id].splice(index, 1);
          delete this.entitySystemLastUpdate[entity.id][system.id];
          delete this.entitySystemLastUpdateGame[entity.id][system.id];
        }
        return;
      }
    }

    // Entity has all the components this system needs
    if (index < 0) {
      this.entitySystems[entity.id].push(system);
      this.entitySystemLastUpdate[entity.id][system.id] = now();
      this.entitySystemLastUpdateGame[entity.id][system.id] = this.gameTime;

      // Informs the system about the new relationship
      if (system.enter) {
        this.inject(system);
        system.enter(entity);
      }
    }
  };

  /**
   * Index an entity
   *
   * @param {Entity} entity
   * @param {System} [system]
   */
  private indexEntity(entity: Entity, system?: System): void {
    if (!this.entitySystems.hasOwnProperty(entity.id)) {
      this.entitySystems[entity.id] = [];
    }

    if (system) {
      // Index entity for a specific system
      this.indexEntitySystem(entity, system);
    } else {
      // Index the entire entity
      this.systems.forEach((system) => this.indexEntitySystem(entity, system));
    }
  }

  /**
   * Call the `change` method of the systems in this world when an entity receives or loses components
   *
   * @param {Entity} entity
   * @param {Component} [added]
   * @param {Component} [removed]
   */
  private onEntityUpdate(entity: Entity, added?: Component, removed?: Component): void {
    const systems = this.entitySystems[entity.id];
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
      this.inject(system);
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

    this.gameTime += (time - this.lastUpdate) * this.timeScale;
    this.lastUpdate = time;

    // Save systems & entities to update
    const updated: { [key: string]: { system: System; delta: number; entities: Entity[] } } = {};

    this.entities.forEach((entity) => {
      if (!entity.active) {
        this.removeEntity(entity);
        return;
      }

      const systems = this.entitySystems[entity.id];
      if (!systems) {
        return;
      }

      const entityLastUpdates = this.entitySystemLastUpdate[entity.id];
      const entityLastUpdatesGame = this.entitySystemLastUpdateGame[entity.id];
      let elapsed, elapsedScaled, interval;

      this.getActiveSystems().forEach((system) => {
        const id = `${system.id}`;

        if (system.update) {
          // Create a new "update" for current system
          if (!updated.hasOwnProperty(id)) {
            elapsed = time - entityLastUpdates[system.id];
            elapsedScaled = this.gameTime - entityLastUpdatesGame[system.id];

            // Limit FPS
            if (system.frequency > 0) {
              interval = 1000 / system.frequency;
              if (elapsed < interval) {
                return;
              }

              // Adjust for interval not being a multiple of RAF's interval (16.7ms)
              entityLastUpdates[system.id] = time - (elapsed % interval);
              entityLastUpdatesGame[system.id] = this.gameTime;
            } else {
              entityLastUpdates[system.id] = time;
              entityLastUpdatesGame[system.id] = this.gameTime;
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
      this.inject(system);
      system.beforeUpdateAll?.(this.gameTime, delta, entities);
      entities.forEach((entity) => system.update?.(this.gameTime, delta, entity));
      system.afterUpdateAll?.(this.gameTime, delta, entities);
    });
  }

  /**
   * Remove all entities and systems
   */
  public destroy(): void {
    this.entities.forEach((entity) => this.removeEntity(entity));
    this.systems.forEach((system) => this.removeSystem(system));
  }

  /**
   * Get an entity by id
   *
   * @param {number} id
   * @returns {Entity|undefined}
   */
  public getEntity(id: number): Entity | undefined {
    return this.entities.find((entity) => entity.id === id);
  }

  /**
   * Get all active systems
   *
   * @returns {System[]}
   */
  public getActiveSystems(): System[] {
    return this.systems.filter((system) => {
      system.states.includes(ECSState.Any) || system.states.includes(this.state);
    });
  }
}
