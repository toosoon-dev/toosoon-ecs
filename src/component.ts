import type Entity from './entity';

type ComponentClassType<P> = (new (data: P) => Component<P>) & {
  /**
   * Unique reference to this component type id
   */
  readonly type: number;

  /**
   * Return all instances of this component from entity
   *
   * @param {Entity} entity
   * @returns {Component[]}
   */
  allFrom(entity: Entity): Array<Component<P>>;

  /**
   * Return the first instance of this component from entity
   *
   * @param {Entity} entity
   * @returns {Component}
   */
  oneFrom(entity: Entity): Component<P>;
};

/**
 * Representation of a component in ECS
 *
 * @exports
 * @class Component
 * @abstract
 * @template {any} [T=any]
 */
export default abstract class Component<T = any> {
  /**
   * Static reference to Component type
   */
  static type: number = 1;

  /**
   * Unique identifier of this component type
   */
  public readonly type: number;

  /**
   * Values stored by this component
   */
  public data: T;

  /**
   * Secondary values used to save miscellaneous data required by some specialized systems
   */
  public attributes: any = {};

  /**
   * @param {number} type Unique identifier of this component type
   * @param {T} data Initial values stored by this component
   */
  constructor(type: number, data: T) {
    this.type = type;
    this.data = data;
  }

  /**
   * Register a new component class
   *
   * @returns {ComponentClassType}
   */
  static register<P>(): ComponentClassType<P> {
    const type = Component.type++;

    class CustomComponent extends Component<P> {
      /**
       * Static reference to this custom component type
       */
      static type = type;

      /**
       * Create a new instance of this custom component
       *
       * @param {P} data
       */
      constructor(data: P) {
        super(type, data);
      }

      /**
       * Static method returning all instances of this component from entity
       *
       * @param {Entity} entity Entity to get the components from
       * @returns {Component[]}
       */
      static allFrom(entity: Entity): CustomComponent[] {
        return [...entity.components[type]];
      }

      /**
       * Static method returning the first instance of this component from entity
       *
       * @param {Entity} entity Entity to get the component from
       * @returns {Component}
       */
      static oneFrom(entity: Entity): CustomComponent {
        return entity.components?.[type]?.[0];
      }
    }

    return CustomComponent as ComponentClassType<P>;
  }
}
