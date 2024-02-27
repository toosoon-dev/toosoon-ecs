# ECS API

## World

The very definition of the ECS World.

- [new World()](#world-contructor)
  - `static` [.Entity](#world-static-entity): `Class<Entity>`
  - `static` [.Component](#world-static-component): `Class<Component>`
  - `static` [.System](#world-static-system): `Class<System>`
  - [.id](#world-id): `string`
  - [.timeScale](#world-time-scale): `number`
  - [.setState(state)](#world-set-state-method)
  - [.addEntity(entity)](#world-add-entity-method)
  - [.removeEntity(id)](#world-remove-entity-method)
  - [.addSystem(system)](#world-add-system-method)
  - [.removeSystem(id)](#world-remove-system-method)
  - [.query(componentTypes)](#world-query-method): `Iterator`
  - [.queryEntitiesByComponent(componentType)](#world-query-entities-by-component-method): `Entity[]`
  - [.update()](#world-update-method)
  - [.destroy()](#world-destroy-method)
  - [.getEntity(id)](#world-get-entity-method): `Entity | undefined`
  - [.getSystem(id)](#world-get-system-method): `System | undefined`
  - [.getActiveSystems()](#world-get-system-method): `System[]`
  - [.logActiveSystems()](#world-log-active-systems-method)

### Contructor <a id="world-contructor"></a>

| Parameter | Type       | Default | Description                          |
| --------- | ---------- | ------- | ------------------------------------ |
| id        | `string`   | `''`    | The world unique identifier.         |
| systems   | `System[]` | `[]`    | Initial systems to add to the world. |

### Properties

##### `static` Entity <a id="world-static-entity"></a>

Static reference to Entity class.

```ts
static World.Entity: Class<Entity>;
```

##### `static` Component <a id="world-static-component"></a>

Static reference to Component class.

```ts
static World.Component: Class<Component>;
```

##### `static` System <a id="world-static-system"></a>

Static reference to System class.

```ts
static World.System: Class<System>;
```

##### id <a id="world-id"></a>

The world unique identifier.

```ts
World.id: readonly string;
```

##### timeScale <a id="world-time-scale"></a>

Allow you to apply slow motion effect on systems.
When timeScale is 1, the timestamp and delta parameters received by the systems are consistent with the actual timestamp.
When timeScale is 0.5, the values received by systems will be half of the actual value.

> ATTENTION! The systems continue to be invoked obeying their normal frequencies, what changes is only the values received in the timestamp and delta parameters.

```ts
World.timeScale: number;
```

### Methods

##### setState(state) <a id="world-set-state-method"></a>

Update the world state.

```ts
World.setState(state: string): void;
```

##### addEntity(entity) <a id="world-add-entity-method"></a>

Add an entity to the world.

```ts
World.addEntity(entity: Entity): void;
```

##### removeEntity(id) <a id="world-remove-entity-method"></a>

Remove an entity from the world.

```ts
World.removeEntity(id: number | Entity, dispose?: boolean): void;
```

##### addSystem(system) <a id="world-add-system-method"></a>

Add a system to the world.

```ts
World.addSystem(system: System): void;
```

##### removeSystem(id) <a id="world-remove-system-method"></a>

Remove a system from the world.

```ts
World.removeSystem(id: number | System): void;
```

##### query(componentTypes) <a id="world-query-method"></a>

Search for all entities that have a specific set of components.

```ts
World.query(componentTypes: number[]): Iterator<Entity>;
```

##### queryEntitiesByComponent(componentType) <a id="world-query-entities-by-component-method"></a>

Search for all entities that have a specific component.

```ts
World.queryEntitiesByComponent(componentType: number): Entity[];
```

##### update() <a id="world-update-method"></a>

Call the `update` method of the systems in the world.

```ts
World.update(): void;
```

##### destroy() <a id="world-destroy-method"></a>

Remove all entities and systems in the world.

```ts
World.destroy(): void;
```

##### getEntity(id) <a id="world-get-entity-method"></a>

Get an entity by id.

```ts
World.getEntity(id: number): Entity | undefined;
```

##### getSystem(id) <a id="world-get-system-method"></a>

Get a system by id.

```ts
World.getSystem(id: number): System | undefined;
```

##### getActiveSystems() <a id="world-get-active-systems-method"></a>

Get all active systems, or matching a specified `state`.

```ts
World.getActiveSystems(state?: string): System[];
```

##### logActiveSystems() <a id="world-log-active-systems-method"></a>

Log in the console an array of active systems, or matching a specified `state`.

```ts
World.logActiveSystems(state?: string): void;
```

## Entity

Representation of an entity in ECS.

- new Entity()
  - `static` [.id](#entity-static-id): `number`
  - [.id](#entity-id): `number`
  - [.components](#entity-components): `{ [key: number]: Component[] }`
  - [.active](#entity-entity): `boolean`
  - [.add(component)](#entity-add-method)
  - [.remove(component)](#entity-remove-method)
  - [.onAdded?()](#entity-on-added-method)
  - [.onRemoved?()](#entity-on-removed-method)
  - [.subscribe(susbcription)](#entity-subscribe-method): `Function`
  - [.getComponents(type)](#entity-get-components-method): `Component[]`

### Properties

##### `static` id <a id="entity-static-id"></a>

Static reference to Entity id.

```ts
static Entity.id: number;
```

##### id <a id="entity-id"></a>

Unique identifier of an instance of the entity.

```ts
Entity.id: readonly number;
```

##### components <a id="entity-components"></a>

List of components attached to the entity.

```ts
Entity.components: { [key: number]: Component[] };
```

### Methods

##### add(component) <a id="entity-add-method"></a>

Add a component to the entity.

```ts
Entity.add(component: Component): void;
```

##### remove(component) <a id="entity-remove-method"></a>

Remove a component from the entity.

```ts
Entity.remove(component: Component): void;
```

##### onAdded?() <a id="entity-on-added-method"></a>

Called when the entity is added to the world.

```ts
Entity.onAdded?(): void;
```

##### onRemoved?() <a id="entity-on-removed-method"></a>

Called when the entity is removed from the world.

```ts
Entity.onRemoved?(): void;
```

##### subscribe(susbcription) <a id="entity-subscribe-method"></a>

Allow interested parties to receive information when the entity's component list is updated.

```ts
Entity.subscribe(susbcription: Function): Function;
```

##### getComponents(type) <a id="entity-get-components-method"></a>

Get all components with a specified type.

```ts
Entity.getComponents(type: number): Component[];
```

## System

Represent the logic that transforms component data of an entity from its current state to its next state. A system runs on entities that have a specific set of component types.

- [new System([componentTypes])](#system-contructor)
  - `static` [.id](#system-static-id): `number`
  - [.id](#system-id): `number`
  - [.componentTypes](#system-component-types): `number[]`
  - [.states](#system-states): `string[]`
  - [.frequency](#system-frequency): `number`
  - [.listeners](#system-listeners): `{ [event: string]: Function[] }`
  - [.world](#system-world): `World`
  - [.trigger?(event, data)](#system-trigger-method)
  - [.enter?(entity)](#system-enter-method)
  - [.exit?(entity)](#system-exit-method)
  - [.onAdded?()](#system-on-added-method)
  - [.onRemoved?()](#system-on-removed-method)
  - [.onStateChange?(newState, prevState)](#system-on-state-change-method)
  - [.change?(entity)](#system-change-method)
  - [.update?(time, delta, entity)](#system-update-method)
  - [.beforeUpdateAll?(time, delta, entities)](#system-before-update-all-method)
  - [.afterUpdateAll?(time, delta, entities)](#after-before-update-all-method)
  - [.destroy()](#system-destroy-method)

### Contructor <a id="system-contructor"></a>

| Parameter      | Type       | Default   | Description                                                                                |
| -------------- | ---------- | --------- | ------------------------------------------------------------------------------------------ |
| componentTypes | `number[]` |           | IDs of the types of components the system expects the entity to have before it can act on. |
| states         | `string[]` | `['Any']` | An array of states that allow the `update` method to be called.                            |
| frequency      | `number`   | `0`       | The maximum times per second this system should be updated.                                |

### Properties

##### `static` id <a id="system-static-id"></a>

Static reference to System id.

```ts
static System.id: number;
```

##### id <a id="system-id"></a>

Unique identifier of an instance of the system.

```ts
System.id: readonly number;
```

##### componentTypes <a id="system-component-types"></a>

IDs of the types of components the system expects the entity to have before it can act on. If you want to create a system that acts on all entities, enter `[-1]`.

```ts
System.componentTypes: readonly number[];
```

##### states <a id="system-states"></a>

An array of states that allow the `update` method to be called.

```ts
System.states: readonly string[];
```

##### frequency <a id="system-frequency"></a>

The maximum times per second the system should be updated.

```ts
System.frequency: readonly number;
```

##### listeners <a id="system-listeners"></a>

<!--  -->

```ts
System.listeners: readonly { [event: string]: Function[] };
```

##### world <a id="system-world"></a>

Reference to the ECS world.

```ts
System.world!: World;
```

### Methods

##### trigger(event, data) <a id="system-trigger-method"></a>

Allow to trigger any event. Systems interested in this event will be notified immediately.

```ts
System.trigger?: (event: string, data: unknown) => void;
```

##### enter(entity) <a id="system-enter-method"></a>

```ts
System.enter?(entity: Entity): void;
```

##### exit(entity) <a id="system-exit-method"></a>

```ts
System.exit?(entity: Entity): void;
```

##### onAdded() <a id="system-on-added-method"></a>

```ts
System.onAdded?(): void;
```

##### onRemoved() <a id="system-on-removed-method"></a>

```ts
System.onRemoved?(): void;
```

##### onStateChange(newState, prevState) <a id="system-on-state-change-method"></a>

```ts
System.onStateChange?(newState: string, prevState: string): void;
```

##### change(entity) <a id="system-change-method"></a>

```ts
System.change?(entity: Entity, added?: Component, removed?: Component): void;
```

##### update(time, delta, entity) <a id="system-update-method"></a>

```ts
System.update?(time: number, delta: number, entity: Entity): void;
```

##### beforeUpdateAll(time, delta, entities) <a id="system-before-update-all-method"></a>

```ts
System.beforeUpdateAll?(time: number, delta: number, entities: Entity[]): void;
```

##### afterUpdateAll(time, delta, entities) <a id="system-after-update-all-method"></a>

```ts
System.afterUpdateAll?(time: number, delta: number, entities: Entity[]): void;
```

##### destroy() <a id="system-destroy-method"></a>

```ts
System.destroy(): void;
```

## Component

- Component
  - `static` [register\<P\>()](#component-static-register-method): `Class<Component<T>>`

### Methods

##### `static` register\<P\>() <a id="component-static-register-method"></a>

Register a new component class.

```ts
static Component.register<P>(): Class<Component<P>>;
```

## Component\<T\>

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

##### `static` type <a id="component-static-type"></a>

Unique reference to the component type id.

```ts
static Component<T>.type: number;
```

##### type <a id="component-type"></a>

Unique identifier of the component type.

```ts
Component<T>.type: readonly number;
```

##### data <a id="component-data"></a>

Values stored by the component.

```ts
Component<T>.data: T;
```

##### attributes <a id="component-attributes"></a>

Secondary values used to save miscellaneous data required by some specialized systems.

```ts
Component<T>.attributes: any;
```

### Methods

##### `static` allFrom(entity) <a id="#component-static-all-from-method"></a>

Return all instances of the component from entity.

```ts
static Component<T>.allFrom(entity: Entity): Array<Component<T>>;
```

##### `static` oneFrom(entity) <a id="#component-static-one-from-method"></a>

Return the first instance of the component from entity.

```ts
static Component<T>.oneFrom(entity: Entity): Component<T>;
```
