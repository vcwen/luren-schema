import DataTypes from './DataTypes'
import {
  AnyType,
  ArrayType,
  BooleanType,
  DateType,
  IntegerType,
  NumberType,
  ObjectType,
  StringType
} from './JsType'
import deepFreeze from 'deep-freeze'

export const JsTypes = new DataTypes()
JsTypes.register('any', new AnyType())
JsTypes.register('string', new StringType())
JsTypes.register('boolean', new BooleanType())
JsTypes.register('number', new NumberType())
JsTypes.register('integer', new IntegerType())
JsTypes.register('date', new DateType())
JsTypes.register('array', new ArrayType(JsTypes))
JsTypes.register('object', new ObjectType(JsTypes))

export default JsTypes
