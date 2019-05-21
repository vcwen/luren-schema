import { Map } from 'immutable'
import _ from 'lodash'
import { ITypeOptions } from '../types'

export class DataTypes<T extends ITypeOptions> {
  private _types = Map<string, T>()
  public add(type: string, options: T) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, options)
  }
  public update(type: string, options: T) {
    this._types = this._types.set(type, options)
  }
  public get(type: string) {
    return this._types.get(type)
  }
}
