# TOOSOON ECS

Library providing Entity-Component-System (ECS) classes.

**Credits**: [ecs-lib](https://github.com/nidorx/ecs-lib)

## Installation

Yarn:

```properties
$ yarn add toosoon-ecs
```

NPM:

```properties
$ npm install toosoon-ecs
```

## Documentation

Entity-Component-System (ECS) is a distributed and compositional architectural design pattern that is mostly used in game development. It enables flexible decoupling of domain-specific behaviour, which overcomes many of the drawbacks of traditional object-oriented inheritance.

### World

A `World` instance is used to describe your game world. The World is a container for Entities, Components, and Systems.

```ts
import World from 'toosoon-ecs';

const world = new World();
```

### Component

Represents the different facets of an entity, such as position, velocity, geometry, physics, and hit points for example. Components store only raw data for one aspect of the object, and how it interacts with the world.

In other words, the component labels the entity as having this particular aspect.

```ts
import { Component } from 'toosoon-ecs';

export interface Box {
  width: number;
  height: number;
  depth: number;
}

export const BoxComponent = Component.register<Box>();
```

The register method generates a new class that represents this type of component, which has a unique identifier. You also have access to the type id from the created instances.

```ts
const boxComponent = new BoxComponent({ width: 10, height: 10, depth: 10 });
console.log(boxComponent.type === BoxComponent.type); // true (in this case type = 1)
```

#### Raw data access

Component instance displays raw data by property `data`.

```ts
boxComponent.data.width = 33;
console.log(boxComponent.data.width); // 33
```

#### Secondary attributes

A component can have attributes. Attributes are secondary values used to save miscellaneous data required by some specialized systems.

```ts
boxComponent.attributes.specializedSystemMetadata = 33;
console.log(boxComponent.attributes.specializedSystemMetadata); // 33
```

### Entity

The entity is a general purpose object. An entity is what you use to describe an object in your game. It consists only of a unique ID and the list of components that make up this entity.

```ts
import { Entity } from 'toosoon-ecs';
import { Box, BoxComponent } from '../components/BoxComponent';
import { ColorComponent } from '../components/ColorComponent';

export default class CubeEntity extends Entity {
  constructor(box: Box, color: string) {
    super();

    this.add(new BoxComponent(box));
    this.add(new ColorComponent(color));
  }
}
```

#### Adding and removing from the world

You can add multiple instances of the same entity in the world. Each entity is given a unique identifier at creation time.

```ts
const cube = new CubeEntity({ width: 10, height: 10, depth: 10 }, '#FF0000');

world.addEntity(cube);

world.removeEntity(cube);
world.removeEntity(cube.id);
```

#### Adding and removing components

At any point in the entity's life cycle, you can add or remove components, using `add` and `remove` methods.

```ts
cube.add(boxComponent);
cube.remove(boxComponent);
```

Entities can have more than one component per type, it is up to the developer to control the addition and removal of entity components.

```ts
cube.add(new BoxComponent({ width: 10, height: 10, depth: 10 }));
cube.add(new BoxComponent({ width: 20, height: 20, depth: 20 }));
```

#### Subscribing to changes

You can be informed when a component is added or removed from an entity by simply subscribing to the entity.

```ts
const unsubscribe = cube.subscribe((entity) => console.log(entity));

unsubscribe();
```

#### Accessing components

To gain access to the components of an entity, simply use the `allFrom` and `oneFrom` methods of the `Component` class to get all or the first instance of this component respectively.

```ts
BoxComponent.allFrom(cube).forEach((boxComponent) => console.log(boxComponent.data.height));

const boxComponent = BoxComponent.oneFrom(cube);
console.log(boxComponent.data.height);
```

### System

Represents the logic that transforms component data of an entity from its current state to its next state. A system runs on entities that have a specific set of component types.

Each system runs continuously (as if each system had its own thread).

A system has a strong connection with component types. You must define which components this system works on in the `System` abstract class constructor.

If the `update` method is implemented, it will be called for every update in the world if the system `states` array includes the current state of the world. Whenever an entity with the characteristics expected by this system is added or removed on the world, or it components is changed, the system is informed via the `enter`, `exit` and `change` methods. Alongside, when the world state changes, the system is informed via the `onStateChange` method.

```ts
import { Entity, System } from 'toosoon-ecs';
import KeyboardState from '../utils/KeyboardState';
import { BoxComponent } from '../components/BoxComponent';
import { Object3DComponent } from '../components/Object3DComponent';

export default class KeyboardSystem extends System {
  constructor() {
    super([Object3DComponent.type, BoxComponent.type]);
  }

  update(time: number, delta: number, entity: Entity): void {
    const { data: object3D } = Object3DComponent.oneFrom(entity);
    if (KeyboardState.pressed('right')) {
      object3D.translateX(0.3);
    } else if (KeyboardState.pressed('left')) {
      object3D.translateX(-0.3);
    } else if (KeyboardState.pressed('up')) {
      object3D.translateZ(-0.3);
    } else if (KeyboardState.pressed('down')) {
      object3D.translateZ(0.3);
    }
  }
}
```

#### Adding and removing from the world

To add or remove a system to the world, simply use the `addSystem` and `removeSystem` methods.

```ts
const keyboardSystem = new KeyboardSystem();

world.addSystem(keyboardSystem);
world.removeSystem(keyboardSystem);
```

#### Global systems

You can also create systems that receive updates from all entities, regardless of existing components. To do this, simply enter `[-1]` in the system builder. This functionality may be useful for debugging and other rating mechanisms for your game.

```ts
import { Entity, System } from 'toosoon-ecs';

// Log all entities
export default class LogSystem extends System {
  constructor() {
    super([-1]);
  }

  update(time: number, delta: number, entity: Entity): void {
    console.log(entity);
  }
}
```

#### Limiting frequency (FPS)

It is possible to limit the maximum number of invocations that the `update` method can perform per second (FPS) by simply entering the `frequency` parameter in the class constructor. This control is useful for example to limit the processing of physics systems to a specific frequency in order to decrease the processing cost.

```ts
export default class PhysicsSystem extends System {
  constructor() {
    super([Object3DComponent.type], 25); // FPS limit
  }

  // Will run at 25 FPS
  update(time: number, delta: number, entity: Entity): void {
    //... physics stuff
  }
}
```

#### Time Scaling - Slow motion effect

A very interesting feature is the TIMESCALE. This allows you to change the rate that time passes in the game, also known as the timescale. You can set the timescale by changing the `timeScale` property of the world.

A time scale of 1 means normal speed. 0.5 means half the speed and 2.0 means twice the speed. If you set the game's timescale to 0.1, it will be ten times slower but still smooth - a good slow motion effect!

The timescale works by changing the value returned in the `time` and `delta` arguments of the system `update` method. This means that the behaviors are affected and any movement using `delta`. If you do not use `delta` in your motion calculations, motion will not be affected by the timescale! Therefore, to use the timescale, simply use the `delta` correctly in all movements.

> ATTENTION! The systems continue to be invoked obeying their normal frequencies, what changes is only the values received in the `time` and `delta` parameters.

#### Pausing

You can set the timescale to 0. This stops all movement. It is an easy way to pause the game. Go back to 1 and the game will resume.

You may find that you can still do things like shoot using the game controls. You can get around this by placing your main game events in a group and activating/deactivating that group while pausing and not pausing.

It's also a good way to test if you used `delta` correctly. If you used it correctly, setting the timescale to 0 will stop everything in the game. If you have not used it correctly, some objects may keep moving even if the game should be paused! In this case, you can check how these objects are moved and make sure you are using `delta` correctly.

#### World states

It is also possible to limit the `update` invocations by entering the world `states` parameter in the class constructor. The system will then only be updated when the world current state matches the system's states.

```ts
export default class LoaderSystem extends System {
  constructor() {
    super([-1], [WorldState.Loading], 25);
  }

  // Will only run while the world state is `Loading` (at 25 FPS)
  update(time: number, delta: number, entity: Entity): void {
    // ... loader animations
  }
}
```

> If the second parameter is a `number`, it will be passed as the `frequency`, otherwise it will be interpreted as the `states` and the third parameter will be passed as the `frequency`.

In order to update all the systems according to the world state, it is necessary to manually set the different states based on your game logic.

```ts
world.setState(WorldState.Loading);

loader.load().then(() => {
  world.setState(WorldState.Setup);
});
```

#### Before and After update

If necessary, the system can be informed before and after executing the update of its entities in this interaction (respecting the execution frequency defined for that system).

```ts
import { Entity, System } from 'tooson-ecs';

// Log all entities every 2 seconds (0.5 FPS)
export default class LogSystem extends System {
  constructor() {
    super([-1], 0.5);
  }

  beforeUpdateAll(time: number): void {
    console.log('Before update');
  }

  update(time: number, delta: number, entity: Entity): void {
    console.log(entity);
  }

  afterUpdateAll(time: number, entities: Entity[]): void {
    console.log('After update');
  }
}
```

#### Enter - When adding new entities

Called when:

- An entity with the characteristics (components) expected by this system is added in the world.
- This system is added in the world and this world has one or more entities with the characteristics expected by this system.
- An existing entity in the same world receives a new component at runtime and all of its new components match the standard expected by this system.

It can be used for initialization of new components in this entity, or even registration of this entity in a more complex management system.

```ts
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';
import { Entity, System } from 'toosoon-ecs';
import { BoxComponent } from '../components/BoxComponent';
import { ColorComponent } from '../components/ColorComponent';
import { Object3DComponent } from '../components/Object3DComponent';

export default class CubeFactorySystem extends System {
  constructor() {
    super([ColorComponent.type, BoxComponent.type]);
  }

  enter(entity: Entity): void {
    const object = Object3DComponent.oneFrom(entity);

    if (!object) {
      const box = BoxComponent.oneFrom(entity).data;
      const color = ColorComponent.oneFrom(entity).data;

      const geometry = new BoxGeometry(box.width, box.height, box.depth);
      const material = new MeshBasicMaterial({ color });
      const cube = new Mesh(geometry, material);

      // Add new component to entity
      entity.add(new Object3DComponent(cube));
    }
  }
}
```

#### Change - When you add or remove components

A system can also be informed when adding or removing components of an entity by simply implementing the `change` method.

```ts
import { Component, Entity, System } from 'toosoon-ecs';

// Log all entities every 2 seconds (0.5 FPS)
export default class LogSystem extends System {
  constructor() {
    super([-1], 0.5);
  }

  change(entity: Entity, added?: Component<any>, removed?: Component<any>): void {
    console.log(entity, added, removed);
  }
}
```

#### Exit - When removing entities

Called when:

- An entity with the characteristics (components) expected by this system is removed from the world.
- This system is removed from the world and this world has one or more entities with the characteristics expected by this system.
- An existing entity in the same world loses a component at runtime and its new component set no longer matches the standard expected by this system.

Can be used to clean memory and references.

```ts
import { Scene } from 'three';
import { Entity, System } from 'toosoon-ecs';
import { Object3DComponent } from '../components/Object3DComponent';

export default class SceneObjectSystem extends System {
  private scene: Scene;

  constructor(scene: Scene) {
    super([Object3DComponent.type]);

    this.scene = scene;
  }

  exit(entity: Entity): void {
    const model = Object3DComponent.oneFrom(entity);
    this.scene.remove(model.data);
  }
}
```

## API

See full documentation [here](./docs/API.md).

## License

MIT License, see [LICENSE](https://github.com/toosoon-dev/toosoon-ecs/tree/master/LICENSE) for details
