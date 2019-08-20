import DataTypes from './DataTypes'
import { AnyType, ArrayType, BooleanType, DateType, IntegerType, NumberType, ObjectType, StringType } from './JsType'

export const JsTypes = new DataTypes()

JsTypes.register('any', new AnyType(JsTypes))
JsTypes.register('string', new StringType(JsTypes))
JsTypes.register('boolean', new BooleanType(JsTypes))
JsTypes.register('number', new NumberType(JsTypes))
JsTypes.register('integer', new IntegerType(JsTypes))
JsTypes.register('date', new DateType(JsTypes))
JsTypes.register('array', new ArrayType(JsTypes))
JsTypes.register('object', new ObjectType(JsTypes))

export default JsTypes
