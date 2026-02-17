# ECS API

## World <a id="world"></a>

The very definition of the ECS World.

- [new World(id?, systems?)](#world-contructor)
  - `static` [.Entity](#world-static-entity): `typeof Entity`
  - `static` [.Component](#world-static-component): `typeof Component`
  - `static` [.System](#world-static-system): `typeof System`
  - [.id](#world-id): `string`
  - [.timeScale](#world-time-scale): `number`
  - [.setState(state)](#world-set-state-method): `void`
  - [.addEntity(entity)](#world-add-entity-method): `void`
  - [.removeEntity(id, dispose?)](#world-remove-entity-method): `void`
  - [.addSystem(system)](#world-add-system-method): `void`
  - [.removeSystem(id)](#world-remove-system-method): `void`
  - [.query(componentTypes)](#world-query-method): `Iterator`
  - [.queryEntitiesByComponent(componentType)](#world-query-entities-by-component-method): `Entity[]`
  - [.update()](#world-update-method): `void`
  - [.destroy()](#world-destroy-method): `void`
  - [.getEntity(id)](#world-get-entity-method): `Entity | undefined`
  - [.getSystem(id)](#world-get-system-method): `System | undefined`
  - [.getActiveSystems()](#world-get-system-method): `System[]`
  - [.logActiveSystems()](#world-log-active-systems-method): `void`

### Contructor <a id="world-contructor"></a>

| Parameter | Type       | Default | Description                          |
| --------- | ---------- | ------- | ------------------------------------ |
| [id]      | `string`   | `''`    | The world unique identifier.         |
| [systems] | `System[]` | `[]`    | Initial systems to add to the world. |

### Properties

##### `static` World.`Entity` <a id="world-static-entity"></a>

Static reference to [`Entity`](#entity) class.

```ts
static World.Entity: typeof Entity;
```

##### `static` World.`Component` <a id="world-static-component"></a>

Static reference to [`Component`](#component) class.

```ts
static World.Component: typeof Component;
```

##### `static` World.`System` <a id="world-static-system"></a>

Static reference to [`System`](#system) class.

```ts
static World.System: typeof System;
```

##### .`id` <a id="world-id"></a>

The world unique identifier.

```ts
World.id: readonly string;
```

##### .`timeScale` <a id="world-time-scale"></a>

Allow you to apply slow motion effect on systems.
When `timeScale` is 1, the timestamp and delta parameters received by the systems are consistent with the actual timestamp.
When `timeScale` is 0.5, the values received by systems will be half of the actual value.

> ATTENTION! The systems continue to be invoked obeying their normal frequencies, what changes is only the values received in the timestamp and delta parameters.

```ts
World.timeScale: number;
```

### Methods

##### .`setState(state)` <a id="world-set-state-method"></a>

Update the world state.

- `state`: New world state.

```ts
World.setState(state: string): void;
```

##### .`addEntity(entity)` <a id="world-add-entity-method"></a>

Add an entity to the world.

- `entity`: Entity to add to the world.

```ts
World.addEntity(entity: Entity): void;
```

##### .`removeEntity(id, dispose?)` <a id="world-remove-entity-method"></a>

Remove an entity from the world.

- `id`: Entity (id) to remove from the world.
- `[dispose=true]`

```ts
World.removeEntity(id: number | Entity, dispose?: boolean): void;
```

##### .`addSystem(system)` <a id="world-add-system-method"></a>

Add a system to the world.

- `system`: System to add to the world.

```ts
World.addSystem(system: System): void;
```

##### .`removeSystem(id)` <a id="world-remove-system-method"></a>

Remove a system from the world.

- `id`: System (id) to remove from the world.

```ts
World.removeSystem(id: number | System): void;
```

##### .`query(componentTypes)` <a id="world-query-method"></a>

Search for all entities that have a specific set of components.

- `componentTypes`: Component types to search for.

```ts
World.query(componentTypes: number[]): Iterator<Entity>;
```

##### .`queryEntitiesByComponent(componentType)` <a id="world-query-entities-by-component-method"></a>

Search for all entities that have a specific component.

- `componentType`: Component type to search for.

```ts
World.queryEntitiesByComponent(componentType: number): Entity[];
```

##### .`update()` <a id="world-update-method"></a>

Call the `update` method of the systems in the world.

```ts
World.update(): void;
```

##### .`destroy()` <a id="world-destroy-method"></a>

Remove all entities and systems in the world.

```ts
World.destroy(): void;
```

##### .`getEntity(id)` <a id="world-get-entity-method"></a>

Get an entity by id.

- `id`: Entity id.

```ts
World.getEntity(id: number): Entity | undefined;
```

##### .`getSystem(id)` <a id="world-get-system-method"></a>

Get a system by id.

- `id`: System id.

```ts
World.getSystem(id: number): System | undefined;
```

##### .`getActiveSystems(state?)` <a id="world-get-active-systems-method"></a>

Get all active systems, or matching a specified `state`.

- `[state]`: State to match (default is the world current `state`).

```ts
World.getActiveSystems(state?: string): System[];
```

##### .`logActiveSystems()` <a id="world-log-active-systems-method"></a>

Log in the console an array of active systems, or matching a specified `state`.

- `[state]`: State to match.

```ts
World.logActiveSystems(state?: string): void;
```

## Entity <a id="entity"></a>

Representation of an entity in ECS.

- new Entity()
  - `static` [.id](#entity-static-id): `number`
  - [.id](#entity-id): `number`
  - [.components](#entity-components): `Record<number, Component[]>`
  - [.active](#entity-entity): `boolean`
  - [.add(component)](#entity-add-method): `void`
  - [.remove(component)](#entity-remove-method): `void`
  - [.onAdded?()](#entity-on-added-method): `void`
  - [.onRemoved?()](#entity-on-removed-method): `void`
  - [.subscribe(susbcription)](#entity-subscribe-method): `Function`
  - [.getComponents(type)](#entity-get-components-method): `Component[]`

### Properties

##### `static` Entity.`id` <a id="entity-static-id"></a>

Static reference to Entity id.

```ts
static Entity.id: number;
```

##### .`id` <a id="entity-id"></a>

Unique identifier of an instance of the entity.

```ts
Entity.id: readonly number;
```

##### .`components` <a id="entity-components"></a>

List of components attached to the entity.

```ts
Entity.components: Record<number, Component[]>;
```

##### .`active` <a id="entity-active"></a>

```ts
Entity.active: boolean;
```

### Methods

##### .`add(component)` <a id="entity-add-method"></a>

Add a component to the entity.

- `component`: Component to add to the entity.

```ts
Entity.add(component: Component): void;
```

##### .`remove(component)` <a id="entity-remove-method"></a>

Remove a component from the entity.

- `component`: Component to remove from the entity.

```ts
Entity.remove(component: Component): void;
```

##### .`onAdded?()` <a id="entity-on-added-method"></a>

Called when the entity is added to the world.

```ts
Entity.onAdded?(): void;
```

##### .`onRemoved?()` <a id="entity-on-removed-method"></a>

Called when the entity is removed from the world.

```ts
Entity.onRemoved?(): void;
```

##### .`subscribe(susbcription)` <a id="entity-subscribe-method"></a>

Allow interested parties to receive information when the entity's component list is updated.

- `susbcription`: Callback to call when the entity's component list is updated.

```ts
Entity.subscribe(susbcription: Function): Function;
```

##### .`getComponents(type)` <a id="entity-get-components-method"></a>

Get all components with a specified type.

- `type`: Unique component type identifier.

```ts
Entity.getComponents(type: number): Component[];
```

## System <a id="system"></a>

Represent the logic that transforms component data of an entity from its current state to its next state. A system runs on entities that have a specific set of component types.

- [new System(componentTypes, states?, frequency?)](#system-contructor)
  - `static` [.id](#system-static-id): `number`
  - [.id](#system-id): `number`
  - [.componentTypes](#system-component-types): `number[]`
  - [.states](#system-states): `string[]`
  - [.frequency](#system-frequency): `number`
  - [.listeners](#system-listeners): `Record<string, Function[]>`
  - [.world](#system-world): `World`
  - [.trigger?(event, data)](#system-trigger-method): `void`
  - [.enter?(entity)](#system-enter-method): `void`
  - [.exit?(entity)](#system-exit-method): `void`
  - [.onAdded?()](#system-on-added-method): `void`
  - [.onRemoved?()](#system-on-removed-method): `void`
  - [.onStateChange?(newState, previousState)](#system-on-state-change-method): `void`
  - [.change?(entity, added?, removed?)](#system-change-method): `void`
  - [.update?(time, delta, entity)](#system-update-method): `void`
  - [.beforeUpdateAll?(time, delta, entities)](#system-before-update-all-method): `void`
  - [.afterUpdateAll?(time, delta, entities)](#after-before-update-all-method): `void`
  - [.destroy()](#system-destroy-method): `void`

### Contructor <a id="system-contructor"></a>

| Parameter      | Type       | Default   | Description                                                                                |
| -------------- | ---------- | --------- | ------------------------------------------------------------------------------------------ |
| componentTypes | `number[]` |           | IDs of the types of components the system expects the entity to have before it can act on. |
| [states]       | `string[]` | `['Any']` | An array of states that allow the `update` method to be called.                            |
| [frequency]    | `number`   | `0`       | The maximum times per second this system should be updated.                                |

### Properties

##### `static` System.`id` <a id="system-static-id"></a>

Static reference to System id.

```ts
static System.id: number;
```

##### .`id` <a id="system-id"></a>

Unique identifier of an instance of the system.

```ts
System.id: readonly number;
```

##### .`componentTypes` <a id="system-component-types"></a>

IDs of the types of components the system expects the entity to have before it can act on. If you want to create a system that acts on all entities, enter `[-1]`.

```ts
System.componentTypes: readonly number[];
```

##### .`states` <a id="system-states"></a>

An array of states that allow the `update` method to be called.

```ts
System.states: readonly string[];
```

##### .`frequency` <a id="system-frequency"></a>

The maximum times per second the system should be updated.

```ts
System.frequency: readonly number;
```

##### .`listeners` <a id="system-listeners"></a>

```ts
System.listeners: readonly Record<string, Function[]>;
```

##### .`world` <a id="system-world"></a>

Reference to the ECS world.

```ts
System.world!: World;
```

### Methods

##### .`trigger(event, data)` <a id="system-trigger-method"></a>

Allow to trigger any event. Systems interested in this event will be notified immediately.

- `event`: Event key name.
- `data`: Event data.

```ts
System.trigger?: (event: string, data: unknown) => void;
```

##### .`enter(entity)` <a id="system-enter-method"></a>

Called when:

1. An entity with the characteristics (components) expected by the system is added in the world.
2. The system is added in the world and this world has one or more entities with the characteristics expected by the system.
3. An existing entity in the same world receives a new component at runtime and all of its new components match the standard expected by the system.

- `entity`: Entity matching the system standard.

```ts
System.enter?(entity: Entity): void;
```

##### .`exit(entity)` <a id="system-exit-method"></a>

Called when:

1.  An entity with the characteristics (components) expected by the system is removed from the world.
2.  The system is removed from the world and this world has one or more entities with the characteristics expected by this system.
3.  An existing entity in the same world loses a component at runtime and its new component set no longer matches the standard expected by the system.

- `entity`: Entity un-matching the system standard.

```ts
System.exit?(entity: Entity): void;
```

##### .`onAdded()` <a id="system-on-added-method"></a>

Called when the system is added to the world.

```ts
System.onAdded?(): void;
```

##### .`onRemoved()` <a id="system-on-removed-method"></a>

Called when the system is removed from the world.

```ts
System.onRemoved?(): void;
```

##### .`onStateChange(newState, previousState)` <a id="system-on-state-change-method"></a>

Called when the world state changes.

- `newState`: New world state.
- `previousState`: Previous world state.

```ts
System.onStateChange?(newState: string, previousState: string): void;
```

##### .`change(entity, added?, removed?)` <a id="system-change-method"></a>

Called when an expected feature of the system is added or removed from the entity.

- `entity`: Updated entity.
- `[added]`: Component added to the entity.
- `[removed]`: Component removed from the entity.

```ts
System.change?(entity: Entity, added?: Component, removed?: Component): void;
```

##### .`update(time, delta, entity)` <a id="system-update-method"></a>

Called in updates, limited to the value set by the `frequency` property.

- `time`: World current game time.
- `delta`: Elapsed time since last update.
- `entity`: Updated entity.

```ts
System.update?(time: number, delta: number, entity: Entity): void;
```

##### .`beforeUpdateAll(time, delta, entities)` <a id="system-before-update-all-method"></a>

Called before updating entities available for the system.

> It is only called when there are entities with the characteristics expected by the system.

- `time`: World current game time.
- `delta`: Elapsed time since last update.
- `entities`: Updated entities.

```ts
System.beforeUpdateAll?(time: number, delta: number, entities: Entity[]): void;
```

##### .`afterUpdateAll(time, delta, entities)` <a id="system-after-update-all-method"></a>

Called after performing update of entities available for the system.

> It is only called when there are entities with the characteristics expected by the system.

- `time`: World current game time.
- `delta`: Elapsed time since last update.
- `entities`: Updated entities.

```ts
System.afterUpdateAll?(time: number, delta: number, entities: Entity[]): void;
```

##### .`destroy()` <a id="system-destroy-method"></a>

```ts
System.destroy(): void;
```

## Component <a id="component"></a>

Representation of a component in ECS.

- [new Component\<T\>(type, data)](#component-contructor)
  - `static` [.type](#component-static-type): `number`
  - [.type](#component-type): `number`
  - [.data](#component-data): `T`
  - [.attributes](#component-attributes): `any`
  - `static` [.allFrom(entity)](#component-static-all-from-method): `Array<Component<T>>`
  - `static` [.oneFrom(entity)](#component-static-one-from-method): `Component<T>`

### Contructor <a id="component-contructor"></a>

| Parameter | Type     | Default | Description                              |
| --------- | -------- | ------- | ---------------------------------------- |
| type      | `number` |         | Unique identifier of the component type. |
| data      | `T`      |         | Initial values stored by the component.  |

### Properties

##### `static` Component.`type` <a id="component-static-type"></a>

Unique reference to the component type id.

```ts
static Component.type: number;
```

##### .`type` <a id="component-type"></a>

Unique identifier of the component type.

```ts
Component.type: readonly number;
```

##### .`data` <a id="component-data"></a>

Values stored by the component.

```ts
Component<T>.data: T;
```

##### .`attributes` <a id="component-attributes"></a>

Secondary values used to save miscellaneous data required by some specialized systems.

```ts
Component.attributes: any;
```

### Methods

##### `static` Component.`allFrom(entity)` <a id="#component-static-all-from-method"></a>

Return all instances of the component from entity.

- `entity`: Entity to get the components from.

```ts
static Component<T>.allFrom(entity: Entity): Array<Component<T>>;
```

##### `static` Component.`oneFrom(entity)` <a id="#component-static-one-from-method"></a>

Return the first instance of the component from entity.

- `entity`: Entity to get the component from.

```ts
static Component<T>.oneFrom(entity: Entity): Component<T>;
```
