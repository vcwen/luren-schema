import { Map } from 'immutable'
import _ from 'lodash'
import { IJsSchema } from './JsSchema'
import { IJsType, IJsTypeOptions } from './JsType'
import ValidationResult from './ValidationResult'

export class DataTypes<T extends IJsType = IJsType> {
  private _types = Map<string, T>()
  public register(type: string, jsType: T) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, jsType)
  }
  public update(type: string, jsType: T) {
    this._types = this._types.set(type, jsType)
  }
  public get(type: string) {
    const jsType = this._types.get(type)
    if (!jsType) {
      throw new Error(`Unknown js type: ${type}`)
    } else {
      return jsType
    }
  }
  public validate(data: any, schema: IJsSchema, options?: IJsTypeOptions): ValidationResult {
    const jsType = this.get(schema.type)
    return jsType.validate(data, schema, options)
  }

  public serialize(data: any, schema: IJsSchema, options?: IJsTypeOptions) {
    const jsType = this.get(schema.type)
    return jsType.serialize(data, schema, options)
  }

  public deserialize(json: any, schema: IJsSchema, options?: IJsTypeOptions) {
    const jsType = this.get(schema.type)
    const data = jsType.deserialize(json, schema, options)
    return data
  }
  public toJsonSchema(schema: IJsSchema) {
    const jsType = this.get(schema.type)
    return jsType.toJsonSchema(schema)
  }
}

export default DataTypes
