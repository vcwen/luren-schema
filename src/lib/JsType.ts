/* tslint:disable: max-classes-per-file */
import Ajv = require('ajv')
import _ from 'lodash'
import { DateTime } from 'luxon'
import { IDENTICAL_JSON_SCHEMA_PROPS } from '../constants'
import { IJsonSchema } from '../types'
import { DataTypes } from './DataTypes'
import { IJsSchema } from './JsSchema'
import { copyProperties } from './utils'
import { ValidationResult } from './ValidationResult'

const ajv = new Ajv({ useDefaults: true })

export interface IJsType {
  type: string
  serialize: (value: any, schema: IJsSchema) => any
  deserialize: (value: any, schema: IJsSchema) => any
  validate(value: any, schema: IJsSchema): ValidationResult
  deserializationValidate(value: any, schema: IJsSchema): ValidationResult
  toJsonSchema(schema: IJsSchema): IJsonSchema
}

export abstract class JsType implements IJsType {
  public abstract type: string
  public abstract validate(value: any, schema: IJsSchema): ValidationResult
  public serialize(value: any | undefined, schema: IJsSchema): any {
    value = this.getExpectedValue(value, schema)
    if (_.isNil(value)) {
      return
    }
    const res = this.validate(value, schema)
    if (!res.valid) {
      throw res.error!
    }
    return value
  }
  public deserializationValidate(
    value: any | undefined,
    schema: IJsSchema
  ): ValidationResult {
    if (_.isNil(value)) {
      return ValidationResult.ok()
    }
    const jsonSchema = this.toJsonSchema(schema)
    const valid = ajv.validate(jsonSchema, value) as boolean
    if (valid) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(ajv.errorsText())
    }
  }
  public deserialize(value: any, schema: IJsSchema): any {
    if (_.isNil(value)) {
      // default value is validated when set
      return this.getDefaultValue(schema)
    } else {
      const result = this.deserializationValidate(value, schema)
      if (!result.valid) {
        throw result.error!
      }
      return value
    }
  }

  public abstract toJsonSchema(schema: IJsSchema): IJsonSchema
  protected getExpectedValue(value: any, schema: IJsSchema) {
    if (_.isNil(value)) {
      return schema.default
    } else {
      return value
    }
  }
  protected getDefaultValue(schema: IJsSchema): any {
    if (!_.isNil(schema.default)) {
      const value = schema.default
      const res = this.validate(value, schema)
      if (res.valid) {
        return value
      } else {
        throw res.error!
      }
    }
  }
}

export abstract class PrimitiveType extends JsType {
  public validate(value: any, schema: IJsSchema): ValidationResult {
    if (_.isNil(value)) {
      return ValidationResult.ok()
    } else {
      const valid = ajv.validate(schema, value) as boolean
      if (valid) {
        return ValidationResult.ok()
      } else {
        return ValidationResult.error(ajv.errorsText())
      }
    }
  }
  public toJsonSchema(schema: IJsSchema): IJsonSchema {
    const jsonSchema: IJsonSchema = { type: schema.type }
    if (!_.isNil(schema.default)) {
      // primitive types do not need serialization
      jsonSchema.default = schema.default
    }
    copyProperties(jsonSchema, schema, IDENTICAL_JSON_SCHEMA_PROPS)
    return jsonSchema
  }
}

export abstract class JsCompositeType extends JsType {
  protected dataTypes: DataTypes
  constructor(dataTypes: DataTypes) {
    super()
    this.dataTypes = dataTypes
  }
}

export class NullType extends JsType {
  public type: string = 'null'
  public validate(val: any) {
    return _.isNil(val)
      ? ValidationResult.ok()
      : ValidationResult.error(`Invalidate null value:${val}`)
  }

  public serialize(value: any | undefined) {
    const res = this.validate(value)
    if (!res.valid) {
      throw res.error!
    }
    return null
  }
  public deserialize(value: any | undefined) {
    const res = this.deserializationValidate(value)
    if (!res.valid) {
      throw res.error!
    }
    return null
  }

  public deserializationValidate(val: any) {
    return _.isNil(val)
      ? ValidationResult.ok()
      : ValidationResult.error(`Invalidate null value:${val}`)
  }
  public toJsonSchema(): IJsonSchema {
    return { type: 'null' }
  }
}

export class AnyType extends JsType {
  public type: string = 'any'
  public validate() {
    return ValidationResult.ok()
  }
  public deserializationValidate() {
    return ValidationResult.ok()
  }
  public toJsonSchema(): IJsonSchema {
    return {}
  }
}

export class StringType extends PrimitiveType {
  public type: string = 'string'
}

export class BooleanType extends PrimitiveType {
  public type: string = 'boolean'
}

export class NumberType extends PrimitiveType {
  public type: string = 'number'
}

export class IntegerType extends PrimitiveType {
  public type: string = 'integer'
}

export class DateType extends JsType {
  public type: string = 'date'
  public validate(value: any): ValidationResult {
    if (_.isNil(value)) {
      return ValidationResult.ok()
    }
    if (value instanceof Date) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid date value: ${value}`)
    }
  }
  public serialize(value: any | undefined, schema: IJsSchema) {
    value = this.getExpectedValue(value, schema)
    if (_.isNil(value)) {
      return
    }
    const res = this.validate(value)
    if (!res.valid) {
      throw res.error!
    }
    const format = schema.format
    if (format) {
      const timezone = schema.timezone || 'utc'
      const val = DateTime.fromJSDate(value).setZone(timezone)
      switch (format) {
        case 'time': {
          return val.toFormat('HH:mm:ssZZ')
        }
        case 'date': {
          return val.toISODate()
        }
        default:
          return value.toISOString()
      }
    } else {
      return value.toISOString()
    }
  }
  public deserialize(value: any, schema: IJsSchema) {
    if (_.isNil(value)) {
      return this.getDefaultValue(schema)
    } else {
      const res = this.deserializationValidate(value, schema)
      if (!res.valid) {
        throw res.error
      }
      const dateString = value as string
      const format = schema.format
      if (format) {
        const timezone = schema.timezone || 'utc'
        switch (format) {
          case 'time': {
            const val = DateTime.fromFormat(dateString, 'HH:mm:ssZZ', {
              zone: timezone
            })
            return val.toJSDate()
          }
          case 'date': {
            const val = DateTime.fromISO(dateString, { zone: timezone })
            return val.toJSDate()
          }
          default:
            return new Date(dateString)
        }
      } else {
        return new Date(dateString)
      }
    }
  }
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'string', format: 'date-time' }
    copyProperties(jsonSchema, schema, IDENTICAL_JSON_SCHEMA_PROPS)
    if (!_.isNil(schema.default)) {
      jsonSchema.default = this.serialize(schema.default, schema)
    }
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ArrayType extends JsCompositeType {
  public type: string = 'array'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'array' }
    const items = schema.items
    let jsonItems: IJsonSchema | IJsonSchema[] | undefined
    if (items) {
      if (Array.isArray(items)) {
        jsonItems = items.map((item) => {
          const jsType = this.dataTypes.get(item.type)
          return jsType.toJsonSchema(item)
        })
      } else {
        const jsType = this.dataTypes.get(items.type)
        jsonItems = jsType.toJsonSchema(items)
      }
    }
    if (jsonItems) {
      jsonSchema.items = jsonItems
    }
    copyProperties(jsonSchema, schema, IDENTICAL_JSON_SCHEMA_PROPS)
    if (schema.default) {
      jsonSchema.default = this.serialize(schema.default, schema)
    }

    return jsonSchema
  }
  public validate(val: any, schema: IJsSchema): ValidationResult {
    if (_.isNil(val)) {
      return ValidationResult.ok()
    }
    if (Array.isArray(val)) {
      const itemSchema = schema.items
      if (itemSchema) {
        if (Array.isArray(itemSchema)) {
          for (let i = 0; i < val.length; i++) {
            const jsType = this.dataTypes.get(itemSchema[i].type)
            const res = jsType.validate(val[i], itemSchema[i])
            if (!res.valid) {
              return ValidationResult.error(res.error!.chainProp(`[${i}]`))
            }
          }
        } else {
          for (let i = 0; i < val.length; i++) {
            const jsType = this.dataTypes.get(itemSchema.type)
            const res = jsType.validate(val[i], itemSchema)
            if (!res.valid) {
              return ValidationResult.error(res.error!.chainProp(`[${i}]`))
            }
          }
        }
      }
      if (schema.minItems && val.length < schema.minItems) {
        ValidationResult.error(
          `The array must at least have ${schema.minItems} items, it actually has ${val.length} items`
        )
      }
      if (schema.maxItems && val.length > schema.maxItems) {
        ValidationResult.error(
          `The array must at most have ${schema.minItems} items, it actually has ${val.length} items `
        )
      }
      if (schema.uniqueItems) {
        const uniqueArray = _.uniq(val)
        if (uniqueArray.length < val.length) {
          ValidationResult.error(
            `Each of the items in an array is unique: ${val}`
          )
        }
      }
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid array:${val}`)
    }
  }
  public deserializationValidate(
    val: any,
    schema: IJsSchema
  ): ValidationResult {
    if (_.isNil(val)) {
      return ValidationResult.ok()
    }
    if (Array.isArray(val)) {
      const itemSchema = schema.items
      if (itemSchema) {
        if (Array.isArray(itemSchema)) {
          for (let i = 0; i < val.length; i++) {
            const jsType = this.dataTypes.get(itemSchema[i].type)
            const res = jsType.deserializationValidate(val[i], itemSchema[i])
            if (!res.valid) {
              return ValidationResult.error(res.error!.chainProp(`[${i}]`))
            }
          }
        } else {
          for (let i = 0; i < val.length; i++) {
            const jsType = this.dataTypes.get(itemSchema.type)
            const res = jsType.deserializationValidate(val[i], itemSchema)
            if (!res.valid) {
              return ValidationResult.error(res.error!.chainProp(`[${i}]`))
            }
          }
        }
      }
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`Invalid array:${val}`)
    }
  }
  public serialize(value: any, schema: IJsSchema) {
    value = this.getExpectedValue(value, schema)
    if (_.isNil(value)) {
      return
    }
    const res = this.validate(value, schema)
    if (!res.valid) {
      throw res.error!
    }
    if (Array.isArray(value)) {
      if (schema.items) {
        if (Array.isArray(schema.items)) {
          const val: any[] = []
          for (let i = 0; i < value.length; i++) {
            const jsType = this.dataTypes.get(schema.items[i].type)
            val.push(jsType.serialize(value[i], schema.items[i]))
          }
          return val
        } else {
          const itemSchema = schema.items
          if (itemSchema) {
            const jsType = this.dataTypes.get(itemSchema.type)
            return value.map((item) => jsType.serialize(item, itemSchema))
          }
        }
      } else {
        return value
      }
    }
  }
  public deserialize(value: any | undefined, schema: IJsSchema) {
    if (_.isNil(value)) {
      return this.getDefaultValue(schema)
    }
    const res = this.deserializationValidate(value, schema)
    if (!res.valid) {
      throw res.error
    }
    if (Array.isArray(value)) {
      if (schema.items) {
        if (Array.isArray(schema.items)) {
          const val: any[] = []
          for (let i = 0; i < value.length; i++) {
            const jsType = this.dataTypes.get(schema.items[i].type)
            val.push(jsType.deserialize(value[i], schema.items[i]))
          }
          return val
        } else {
          const itemSchema = schema.items
          if (itemSchema) {
            const jsType = this.dataTypes.get(itemSchema.type)
            return value.map((item) => jsType.deserialize(item, itemSchema))
          }
        }
      } else {
        return value
      }
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ObjectType extends JsCompositeType {
  public type: string = 'object'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'object' }
    const properties = schema.properties
    if (!properties || _.isEmpty(properties)) {
      return jsonSchema
    }
    const props = Object.getOwnPropertyNames(properties)
    if (!_.isEmpty(props)) {
      jsonSchema.properties = {}
      for (const prop of props) {
        const propSchema = properties[prop]
        const jsType = this.dataTypes.get(propSchema.type)
        Reflect.set(
          jsonSchema.properties,
          prop,
          jsType.toJsonSchema(propSchema)
        )
      }
    }
    if (schema.required) {
      jsonSchema.required = schema.required
    }
    copyProperties(jsonSchema, schema, IDENTICAL_JSON_SCHEMA_PROPS)
    if (schema.default) {
      jsonSchema.default = this.serialize(schema.default, schema)
    }
    return jsonSchema
  }
  public validate(data: any, schema: IJsSchema): ValidationResult {
    if (_.isNil(data)) {
      return ValidationResult.ok()
    }
    if (typeof data !== 'object') {
      return ValidationResult.error(`Invalid object value: ${data}`)
    }
    const properties = schema.properties || {}
    const requiredProps = schema.required || []

    const propNames = Object.getOwnPropertyNames(properties)
    if (!_.isEmpty(propNames) && schema.additionalProperties === false) {
      const receivedProps = Object.getOwnPropertyNames(data)
      const additionalProps = _.difference(receivedProps, propNames)
      if (!_.isEmpty(additionalProps)) {
        return ValidationResult.error(
          `additional props ${additionalProps} are not allowed.`
        )
      }
    }

    for (const prop of propNames) {
      const propSchema = properties[prop]
      const value = Reflect.get(data, prop)
      if (requiredProps.includes(prop) && _.isNil(value)) {
        return ValidationResult.error(`${prop} is required`)
      }
      const jsType = this.dataTypes.get(propSchema.type)
      const res = jsType.validate(value, propSchema)
      if (!res.valid) {
        return ValidationResult.error(res.error!.chainProp(prop))
      }
    }
    return ValidationResult.ok()
  }
  public deserializationValidate(
    data: any,
    schema: IJsSchema
  ): ValidationResult {
    if (_.isNil(data)) {
      return ValidationResult.ok()
    }
    if (typeof data !== 'object') {
      return ValidationResult.error(`Invalid object value: ${data}`)
    }
    const properties = schema.properties || {}
    const requiredProps = schema.required || []

    const propNames = Object.getOwnPropertyNames(properties)
    if (!_.isEmpty(propNames) && schema.additionalProperties === false) {
      const receivedProps = Object.getOwnPropertyNames(data)
      const additionalProps = _.difference(receivedProps, propNames)
      if (!_.isEmpty(additionalProps)) {
        return ValidationResult.error(
          `additional props ${additionalProps} are not allowed.`
        )
      }
    }
    for (const prop of propNames) {
      const propSchema = properties[prop]
      const value = Reflect.get(data, prop)
      if (requiredProps.includes(prop) && _.isNil(value)) {
        return ValidationResult.error(`${prop} is required`)
      }
      const jsType = this.dataTypes.get(propSchema.type)
      const res = jsType.deserializationValidate(value, propSchema)
      if (!res.valid) {
        return ValidationResult.error(res.error!.chainProp(prop))
      }
    }
    return ValidationResult.ok()
  }
  public serialize(data: any | undefined, schema: IJsSchema) {
    data = this.getExpectedValue(data, schema)
    if (_.isNil(data)) {
      return this.getDefaultValue(schema)
    }
    const res = this.validate(data, schema)
    if (!res.valid) {
      throw res.error
    }
    const properties = schema.properties
    const json: any = {}
    if (properties) {
      const props = Object.getOwnPropertyNames(properties)
      for (const prop of props) {
        const propSchema = properties[prop]
        const jsType = this.dataTypes.get(propSchema.type)
        const value = jsType.serialize(Reflect.get(data, prop), propSchema)
        if (value === undefined) {
          continue
        }
        Reflect.set(json, prop, value)
      }
      if (
        schema.additionalProperties !== false &&
        schema.ignoreAdditionalProps === false
      ) {
        const dataProps = Object.getOwnPropertyNames(data)
        for (const dataProp of dataProps) {
          if (!props.includes(dataProp)) {
            const value = Reflect.get(data, dataProp)
            if (value === undefined) {
              continue
            }
            Reflect.set(json, dataProp, value)
          }
        }
      }
    } else {
      Object.assign(json, data)
    }
    return json
  }
  public deserialize(data: any | undefined, schema: IJsSchema) {
    if (_.isNil(data)) {
      data = this.getDefaultValue(schema)
    }
    const res = this.deserializationValidate(data, schema)
    if (!res.valid) {
      throw res.error
    }
    const properties = schema.properties
    if (properties && !_.isEmpty(properties)) {
      const obj = schema.classConstructor ? new schema.classConstructor() : {}
      const propNames = Object.getOwnPropertyNames(properties)
      for (const prop of propNames) {
        const propSchema = properties[prop]
        if (!propSchema || propSchema.virtual) {
          // ignore readonly props since there's no setter
          continue
        }
        const jsType = this.dataTypes.get(propSchema.type)
        const value = jsType.deserialize(Reflect.get(data, prop), propSchema)
        if (value === undefined) {
          continue
        }
        Reflect.set(obj, prop, value)
      }
      if (
        schema.additionalProperties !== false &&
        schema.ignoreAdditionalProps === false
      ) {
        const dataProps = Object.getOwnPropertyNames(data)
        for (const dataProp of dataProps) {
          if (!propNames.includes(dataProp)) {
            const value = Reflect.get(data, dataProp)
            if (value === undefined) {
              continue
            }
            Reflect.set(obj, dataProp, value)
          }
        }
      }
      return obj
    } else {
      return data
    }
  }
}
