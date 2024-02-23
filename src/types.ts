import Component from './component';
import Entity from './entity';
import { Iterator } from './utils';

export enum ECSState {
  Any = 'Any'
}

export type Susbcription = (entity: Entity, added?: Component, removed?: Component) => void;

export type Listener = (data: unknown, entities: Iterator<Entity>) => void;
