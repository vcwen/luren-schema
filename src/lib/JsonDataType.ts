import { IJsSchema, ITypeJsonOptions } from '../types'
import { getJsonOptions, getJsonDeserialize, getJsonValidate, getJsonSerialize } from './utils'
import { Map } from 'immutable'
import _ from 'lodash'

export class JsonDataType {
  private _types = Map<string, ITypeJsonOptions>()
  public add(type: string, processor: ITypeJsonOptions) {
    if (this._types.has(type)) {
      throw new Error(`type:${type} already exists`)
    }
    this._types = this._types.set(type, processor)
  }
  public get(type: string) {
    return this._types.get(type)
  }
}

class StringJsonProcessor implements ITypeJsonOptions {
  public type: string = 'string'
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'string') {
      return [true, '']
    } else {
      return [false, `Invalid string:${val}`]
    }
  }
  public serialize(_1: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      return typeof val === 'string' ? val : JSON.stringify(val)
    }
  }
  public deserialize(schema: IJsSchema, val?: string) {
    if (val === undefined) {
      return schema.defaultVal
    } else {
      return val
    }
  }
}
class BooleanJsonProcessor implements ITypeJsonOptions {
  public type: string = 'boolean'
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'boolean') {
      return [true, '']
    } else {
      return [false, `Invalid boolean: ${val}`]
    }
  }
  public serialize(_1: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      return val ? true : false
    }
  }
  public deserialize(schema: IJsSchema, val?: boolean) {
    if (val === undefined) {
      return schema.default
    } else {
      return val
    }
  }
}

class NumberJsonProcessor implements ITypeJsonOptions {
  public type: string = 'number'
  public validate(_1: IJsSchema, val: any): [boolean, string] {
    if (typeof val === 'number') {
      return [true, '']
    } else {
      return [false, `invalid number: ${val}`]
    }
  }
  serialize(_1: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      return Number.parseFloat(val)
    }
  }
  deserialize(schema: IJsSchema, val?: number) {
    if (val === undefined) {
      return schema.default
    } else {
      return val
    }
  }
}

class ArrayJsonProcessor implements ITypeJsonOptions {
  public type: string = 'array'
  public validate(schema: IJsSchema, val: any): [boolean, string] {
    if (Array.isArray(val)) {
      const itemSchema = schema.items
      if (itemSchema) {
        const validate = getJsonValidate(itemSchema)
        for (let i = 0; i < val.length; i++) {
          const [valid, msg] = validate(itemSchema, val[i])
          if (!valid) {
            return [valid, `[${i}]${msg}`]
          }
        }
      }
      return [true, '']
    } else {
      return [false, 'Invalid array']
    }
  }
  serialize(schema: IJsSchema, val: any) {
    if (val === undefined) {
      return undefined
    } else {
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const serialize = getJsonSerialize(itemSchema)
          return val.map((item) => serialize(itemSchema, item))
        } else {
          return val
        }
      } else {
        throw new Error('Data must be an array')
      }
    }
  }
  deserialize(schema: IJsSchema, val?: any[]) {
    if (val === undefined) {
      return schema.default
    } else {
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const deserialize = getJsonDeserialize(itemSchema)
          return val.map((item) => deserialize(itemSchema, item))
        } else {
          return val
        }
      }
    }
  }
}

class ObjectJsonProcessor implements ITypeJsonOptions {
  public type: string = 'object'
  public validate(schema: IJsSchema, data: any): [boolean, string] {
    if (typeof data !== 'object') {
      return [false, 'Invalid object']
    } else {
      const properties = schema.properties || {}
      const requiredProps = schema.required
      if (requiredProps) {
        for (const prop of requiredProps) {
          const jsonProcessor = getJsonOptions(properties[prop], jsonDataType)
          const key = jsonProcessor.name || prop
          if (Reflect.get(data, key) === undefined) {
            return [false, `${key} is required`]
          }
        }
      }

      const propNames = Object.getOwnPropertyNames(properties)
      for (const propName of propNames) {
        const schema = properties[propName]
        const validate = getJsonValidate(schema)
        const key = _.get(schema, 'json.name', propName)
        let value = Reflect.get(data, key)
        const [valid, msg] = validate(schema, value)
        if (!valid) {
          return [valid, msg]
        }
      }
      return [true, '']
    }
  }
  public serialize(schema: IJsSchema, data?: object) {
    if (data === undefined) {
      return undefined
    } else {
      const properties = schema.properties
      const json: any = {}
      if (properties) {
        const propNames = Object.getOwnPropertyNames(properties)
        for (const propName of propNames) {
          const schema = properties[propName]
          const serialize = getJsonSerialize(schema)
          let key = _.get(schema, 'json.name', propName)
          let value = Reflect.get(data, propName)
          value = serialize(properties[propName], value)
          Reflect.set(json, key, value)
        }
      } else {
        Object.assign(json, data)
      }
      return json
    }
  }
  deserialize(schema: IJsSchema, data?: object) {
    if (data === undefined) {
      return schema.default
    } else {
      const obj = schema.modelConstructor ? new schema.modelConstructor() : {}
      const properties = schema.properties
      if (properties) {
        const propNames = Object.getOwnPropertyNames(properties)
        for (const propName of propNames) {
          const schema = properties[propName]
          const deserialize = getJsonDeserialize(schema)
          let key = _.get(schema, 'json.name', propName)
          let value = Reflect.get(data, key)
          const propSchema = properties[propName]
          value = deserialize(propSchema, value)
          Reflect.set(obj, propName, value)
        }
      } else {
        Object.assign(obj, data)
      }
      return obj
    }
  }
}

export const jsonDataType = new JsonDataType()
jsonDataType.add('string', new StringJsonProcessor())
jsonDataType.add('boolean', new BooleanJsonProcessor())
jsonDataType.add('number', new NumberJsonProcessor())
jsonDataType.add('array', new ArrayJsonProcessor())
jsonDataType.add('object', new ObjectJsonProcessor())
export default jsonDataType
