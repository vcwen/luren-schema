import { Map } from 'immutable'
import _ from 'lodash'
import {
  AnyType,
  ArrayType,
  BooleanType,
  DateType,
  IJsType,
  IntegerType,
  NumberType,
  ObjectType,
  StringType
} from './JsType'

export class DataTypes {
  public static register(type: string, jsType: IJsType) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, jsType)
  }
  public static update(type: string, jsType: IJsType) {
    this._types = this._types.set(type, jsType)
  }
  public static get(type: string) {
    const jsType = this._types.get(type)
    if (!jsType) {
      throw new Error(`Unknown js type: ${type}`)
    } else {
      return jsType
    }
  }
  private static _types = Map<string, IJsType>()
}

DataTypes.register('any', new AnyType())
DataTypes.register('string', new StringType())
DataTypes.register('boolean', new BooleanType())
DataTypes.register('number', new NumberType())
DataTypes.register('integer', new IntegerType())
DataTypes.register('date', new DateType())
DataTypes.register('array', new ArrayType())
DataTypes.register('object', new ObjectType())

export default DataTypes
