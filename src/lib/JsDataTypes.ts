import DataTypes from './DataTypes'
import { AnyType, ArrayType, BooleanType, DateType, IntegerType, NumberType, ObjectType, StringType } from './JsType'

export const JsDataTypes = new DataTypes()

JsDataTypes.register('any', new AnyType(JsDataTypes))
JsDataTypes.register('string', new StringType(JsDataTypes))
JsDataTypes.register('boolean', new BooleanType(JsDataTypes))
JsDataTypes.register('number', new NumberType(JsDataTypes))
JsDataTypes.register('integer', new IntegerType(JsDataTypes))
JsDataTypes.register('date', new DateType(JsDataTypes))
JsDataTypes.register('array', new ArrayType(JsDataTypes))
JsDataTypes.register('object', new ObjectType(JsDataTypes))

export default JsDataTypes
