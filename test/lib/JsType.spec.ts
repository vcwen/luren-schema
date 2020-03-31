import { DateTime } from 'luxon'
import {
  AnyType,
  ArrayType,
  BooleanType,
  DateType,
  IJsSchema,
  IntegerType,
  NumberType,
  ObjectType,
  StringType
} from '../../src'
import JsDataTypes from '../../src/lib/JsTypes'

describe('AnyType', () => {
  const anyType = new AnyType()
  describe('validate', () => {
    it('should return true for all data', () => {
      expect(anyType.validate(undefined)).toBeTruthy()
      expect(anyType.validate('string')).toBeTruthy()
      expect(anyType.validate(null)).toBeTruthy()
      expect(anyType.validate(1)).toBeTruthy()
      expect(anyType.validate(new Date())).toBeTruthy()
      expect(anyType.validate(['array'])).toBeTruthy()
      expect(anyType.validate({ foo: 'bar' })).toBeTruthy()
    })
  })
  describe('serialize', () => {
    it('should return the value as is', () => {
      const schema: IJsSchema = { type: 'any' }
      expect(anyType.serialize(undefined, schema)).toBeUndefined()
      expect(anyType.serialize('string', schema)).toBe('string')
      expect(anyType.serialize(1, schema)).toBe(1)
      const now = new Date()
      expect(anyType.serialize(now, schema)).toEqual(now)
      expect(anyType.serialize(['string'], schema)).toEqual(['string'])
      expect(anyType.serialize({ foo: 'bar' }, schema)).toEqual({ foo: 'bar' })
    })
    it('should return default value if value is undefined when default value is present', () => {
      expect(anyType.serialize(undefined, { type: 'any', default: 'foo' })).toEqual('foo')
    })
    it('should throw error if default value is not valid', () => {})
  })
  describe('deserialize', () => {
    it('should the origin value', () => {
      const schema: IJsSchema = { type: 'any' }
      expect(anyType.deserialize(undefined, schema)).toBeUndefined()
      expect(anyType.deserialize('string', schema)).toBe('string')
      expect(anyType.deserialize(1, schema)).toBe(1)
      const now = new Date()
      expect(anyType.deserialize(now, schema)).toEqual(now)
      expect(anyType.deserialize(['string'], schema)).toEqual(['string'])
      expect(anyType.deserialize({ foo: 'bar' }, schema)).toEqual({ foo: 'bar' })
    })
  })
  describe('toJsonSchema', () => {
    const jsonSchema = anyType.toJsonSchema({ type: 'any' })
    expect(jsonSchema).toEqual({})
  })
})

describe('StringType', () => {
  const stringType = new StringType()
  describe('validate', () => {
    it('should return true for valid string', () => {
      const res1 = stringType.validate('string', { type: 'string' })
      expect(res1.valid).toBeTruthy()
      const res2 = stringType.validate('test@test.com', { type: 'string', format: 'email' })
      expect(res2.valid).toBeTruthy()
      const res3 = stringType.validate(undefined, { type: 'string', format: 'email' })
      expect(res3.valid).toBeTruthy()
    })
    it('should return false with error message for invalid value', () => {
      const res1 = stringType.validate(1, { type: 'string' })
      expect(res1.valid).toBeFalsy()
      expect(res1.error).not.toBeUndefined()
      const res2 = stringType.validate('test.com', { type: 'string', format: 'email' })
      expect(res2.valid).toBeFalsy()
    })
  })
  describe('serialize', () => {
    it('should serialize  value', () => {
      expect(stringType.serialize('test', { type: 'string' })).toBe('test')
      expect(stringType.serialize('my.test.com', { type: 'string', format: 'hostname' })).toBe('my.test.com')
      expect(stringType.serialize(undefined, { type: 'string', format: 'hostname' })).toBeUndefined()
    })
    it('should use default value when value is undefined', () => {
      expect(stringType.serialize(undefined, { type: 'string', default: 'foo' })).toBe('foo')
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        stringType.serialize([], { type: 'string', default: 'foo' })
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        stringType.serialize(undefined, { type: 'string', default: 3 })
      }).toThrowError()
    })
  })
  describe('deserialize', () => {
    it('should deserialize  value', () => {
      expect(stringType.deserialize('test', { type: 'string' })).toBe('test')
      expect(stringType.deserialize('my.test.com', { type: 'string', format: 'hostname' })).toBe('my.test.com')
      expect(stringType.deserialize(undefined, { type: 'string', format: 'hostname' })).toBeUndefined()
    })
    it('should use default value when value is undefined', () => {
      expect(stringType.deserialize(undefined, { type: 'string', default: 'foo' })).toBe('foo')
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        stringType.deserialize([], { type: 'string', default: 'foo' })
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        stringType.deserialize(undefined, { type: 'string', default: 3 })
      }).toThrowError()
    })
  })
  describe('toJsonSchema', () => {
    const jsonSchema = stringType.toJsonSchema({
      type: 'string',
      format: 'email',
      pattern: 'test',
      virtual: true
    })
    expect(jsonSchema).toEqual({ type: 'string', format: 'email', pattern: 'test' })
  })
})

describe('BooleanType', () => {
  const booleanType = new BooleanType()
  expect(booleanType.type).toBe('boolean')
})

describe('NumberType', () => {
  const booleanType = new NumberType()
  expect(booleanType.type).toBe('number')
})
describe('IntegerType', () => {
  const booleanType = new IntegerType()
  expect(booleanType.type).toBe('integer')
})
describe('DateType', () => {
  const dateType = new DateType()
  describe('validate', () => {
    it('should validate the value', () => {
      const res1 = dateType.validate(new Date())
      expect(res1.valid).toBeTruthy()
      const res2 = dateType.validate('2019-07-21')
      expect(res2.valid).toBeFalsy()
      const res3 = dateType.validate({ time: '2019-07-21' })
      expect(res3.valid).toBeFalsy()
    })
  })
  describe('serialize', () => {
    it('should serialize  value', () => {
      const date = new Date('2019-08-11T20:11:38.968Z')
      expect(dateType.serialize(date, { type: 'date' })).toEqual(date.toISOString())
      expect(dateType.serialize(date, { type: 'date', format: 'date-time' })).toEqual(date.toISOString())
      expect(dateType.serialize(date, { type: 'date', format: 'date' })).toEqual('2019-08-11')
      expect(dateType.serialize(date, { type: 'date', format: 'time' })).toEqual('20:11:38+00:00')
      expect(dateType.serialize(date, { type: 'date', format: 'date', timezone: 'Asia/Shanghai' })).toEqual(
        '2019-08-12'
      )
      expect(dateType.serialize(undefined, { type: 'date' })).toBeUndefined()
    })
    it('should use default value when value is undefined', () => {
      const now = new Date()
      expect(dateType.serialize(undefined, { type: 'date', default: now })).toEqual(now.toISOString())
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        dateType.serialize('2019-01-21', { type: 'date' })
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        dateType.serialize(undefined, { type: 'date', default: '2019-01-21' })
      }).toThrowError()
    })
  }),
    describe('deserialize', () => {
      it('should deserialize  value', () => {
        expect(dateType.deserialize('2019-08-11T20:11:38.968Z', { type: 'date' })).toEqual(
          new Date('2019-08-11T20:11:38.968Z')
        )
        expect(dateType.deserialize('2019-08-11T20:11:38.968Z', { type: 'date', format: 'date-time' })).toEqual(
          new Date('2019-08-11T20:11:38.968Z')
        )
        expect(dateType.deserialize('2019-08-11', { type: 'date', format: 'date' })).toEqual(new Date('2019-08-11'))
        const time = dateType.deserialize('20:11:38+00:00', { type: 'date', format: 'time' }) as Date
        expect(time.toISOString().endsWith('20:11:38.000Z')).toBeTruthy()
        expect(dateType.deserialize(undefined, { type: 'date' })).toBeUndefined()
        const now = new Date()
        expect(dateType.deserialize(undefined, { type: 'date', default: now })).toEqual(now)
      })
      it('should use default value when value is undefined', () => {
        expect(
          dateType.deserialize(undefined, { type: 'date', default: new Date('2019-08-11T20:11:38.968Z') })
        ).toEqual(new Date('2019-08-11T20:11:38.968Z'))
      })
      it('should throw error when value is invalid', () => {
        expect(() => {
          dateType.deserialize([], { type: 'string' })
        }).toThrowError()
      })
      it('should throw error when default value is invalid', () => {
        expect(() => {
          dateType.deserialize(undefined, { type: 'date', default: 3 })
        }).toThrowError()
      })
    })
  describe('toJsonSchema', () => {
    const jsonSchema1 = dateType.toJsonSchema({
      type: 'date'
    })
    expect(jsonSchema1).toEqual({ type: 'string', format: 'date-time' })
    const now = new Date()
    const jsonSchema2 = dateType.toJsonSchema({
      type: 'date',
      format: 'date',
      default: now
    })
    const date = DateTime.fromJSDate(now).toFormat('yyyy-MM-dd')
    expect(jsonSchema2).toEqual({ type: 'string', format: 'date', default: date })
  })
})
describe('ArrayType', () => {
  const arrayType = new ArrayType(JsDataTypes)
  describe('validate', () => {
    it('should validate the value', () => {
      const vr = arrayType.validate(
        [
          { bar: true, foo: 1, other: { foo: 'num' } },
          { bar: true, foo: 1, other: { foo: true } }
        ],
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              foo: { type: 'integer' },
              bar: { type: 'boolean' },
              other: { type: 'object', properties: { foo: { type: 'string' } } }
            },
            required: ['foo']
          }
        }
      )
      expect(vr.valid).toBeFalsy()
      expect(vr.error!.message).toBe('[1].other.foo: data should be string')

      const res1 = arrayType.validate(['item1', 1, true], { type: 'array' })
      expect(res1.valid).toBeTruthy()
      const res2 = arrayType.validate(['item1', 'string'], { type: 'array', items: { type: 'string' } })
      expect(res2.valid).toBeTruthy()
      const res3 = arrayType.validate(['item1', 'string', 1], { type: 'array', items: { type: 'string' } })
      expect(res3.valid).toBeFalsy()
      const res4 = arrayType.validate({ time: '2019-07-21' }, { type: 'array' })
      expect(res4.valid).toBeFalsy()
      const res5 = arrayType.validate(undefined, { type: 'array' })
      expect(res5.valid).toBeTruthy()
      const res6 = arrayType.validate(['item1', true, 1], {
        type: 'array',
        items: [{ type: 'string' }, { type: 'boolean' }, { type: 'integer' }]
      })
      expect(res6.valid).toBeTruthy()
      const res7 = arrayType.validate(['item1', 0, 1], {
        type: 'array',
        items: [{ type: 'string' }, { type: 'boolean' }, { type: 'integer' }]
      })
      expect(res7.valid).toBeFalsy()
    })
  })
  describe('serialize', () => {
    it('should serialize  value', () => {
      expect(arrayType.serialize(['item1', 1, true], { type: 'array' })).toEqual(['item1', 1, true])
      expect(arrayType.serialize([0, 1, 2], { type: 'date', items: { type: 'number' } })).toEqual([0, 1, 2])
      expect(
        arrayType.serialize([0, false, 'False'], {
          type: 'array',
          items: [{ type: 'integer' }, { type: 'boolean' }, { type: 'string' }]
        })
      ).toEqual([0, false, 'False'])
      expect(arrayType.serialize([], { type: 'array', items: { type: 'boolean' } })).toEqual([])
      expect(arrayType.serialize(undefined, { type: 'array' })).toBeUndefined()
    })
    it('should use default value when value is undefined', () => {
      expect(arrayType.serialize(undefined, { type: 'array', default: ['ok'] })).toEqual(['ok'])
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        arrayType.serialize('2019-01-21', { type: 'array' })
      }).toThrowError()
      expect(() => {
        arrayType.serialize(['2019-01-21'], { type: 'array', items: { type: 'number' } })
      }).toThrowError()
      expect(() => {
        arrayType.serialize(['2019-01-21', true], { type: 'array', items: [{ type: 'boolean' }, { type: 'string' }] })
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        arrayType.serialize(undefined, { type: 'array', default: true })
      }).toThrowError()
    })
  })
  describe('deserialize', () => {
    it('should deserialize value', () => {
      expect(arrayType.deserialize(['sting', 1, false], { type: 'array' })).toEqual(['sting', 1, false])
      expect(arrayType.deserialize([0, 1, 2], { type: 'array', items: { type: 'integer' } })).toEqual([0, 1, 2])
      expect(
        arrayType.deserialize([0, false, 'false'], {
          type: 'array',
          items: [{ type: 'integer' }, { type: 'boolean' }, { type: 'string' }]
        })
      ).toEqual([0, false, 'false'])
      expect(arrayType.deserialize([], { type: 'array' })).toEqual([])
      expect(arrayType.deserialize(undefined, { type: 'array' })).toBeUndefined()
    })
    it('should use default value when value is undefined', () => {
      expect(arrayType.deserialize(undefined, { type: 'array', default: ['ok'] })).toEqual(['ok'])
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        arrayType.deserialize(1, { type: 'array' })
      }).toThrowError()
      expect(() => {
        arrayType.deserialize([1], { type: 'array', items: { type: 'string' } })
      }).toThrowError()
      expect(() => {
        arrayType.deserialize([1, 'string'], { type: 'array', items: [{ type: 'boolean' }, { type: 'number' }] })
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        arrayType.deserialize(undefined, { type: 'date', default: 3 })
      }).toThrowError()
    })
  })
  describe('toJsonSchema', () => {
    const jsonSchema1 = arrayType.toJsonSchema({
      type: 'array'
    })
    expect(jsonSchema1).toEqual({ type: 'array' })
    const jsonSchema2 = arrayType.toJsonSchema({
      type: 'array',
      items: { type: 'string' }
    })
    expect(jsonSchema2).toEqual({ type: 'array', items: { type: 'string' } })
    const jsonSchema3 = arrayType.toJsonSchema({
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }]
    })
    expect(jsonSchema3).toEqual({
      type: 'array',
      items: [{ type: 'string' }, { type: 'number' }]
    })
  })
})
describe('ObjectType', () => {
  const objectType = new ObjectType(JsDataTypes)
  describe('validate', () => {
    it('should validate the value', () => {
      const res1 = objectType.validate({ foo: 'bar', age: 12 }, { type: 'object' })
      expect(res1.valid).toBeTruthy()
      const res2 = objectType.validate(
        { foo: 1, bar: true, other: { foo: 'bar' } },
        {
          type: 'object',
          properties: {
            foo: { type: 'integer' },
            bar: { type: 'boolean' },
            other: { type: 'object', properties: { foo: { type: 'string' } } }
          },
          required: ['foo']
        }
      )
      expect(res2.valid).toBeTruthy()

      const res3 = objectType.validate(
        {},
        {
          type: 'object',
          properties: {
            foo: { type: 'integer' },
            bar: { type: 'boolean' }
          }
        }
      )
      expect(res3.valid).toBeTruthy()
      const res4 = objectType.validate(undefined, { type: 'object' })
      expect(res4.valid).toBeTruthy()

      const res5 = objectType.validate('item1', {
        type: 'object',
        properties: { foo: { type: 'string' } },
        required: ['foo']
      })
      expect(res5.valid).toBeFalsy()
      expect(res5.error!.message).toEqual('Invalid object value: item1')
      const res6 = objectType.validate(
        { bar: 1 },
        {
          type: 'object',
          properties: { foo: { type: 'string' }, bar: { type: 'number' } },
          required: ['foo']
        }
      )
      expect(res6.valid).toBeFalsy()
      const res7 = objectType.validate(
        { bar: true, foo: 'ok' },
        {
          type: 'object',
          properties: { foo: { type: 'string' }, bar: { type: 'number' } },
          required: ['foo']
        }
      )
      expect(res7.valid).toBeFalsy()
    })
  })
  describe('serialize', () => {
    it('should serialize  value', () => {
      expect(objectType.serialize({ foo: 1, bar: true }, { type: 'object' })).toEqual({ foo: 1, bar: true })
      expect(
        objectType.serialize({ foo: 1, bar: true }, { type: 'object', properties: { foo: { type: 'number' } } })
      ).toEqual({ foo: 1 })
      expect(
        objectType.serialize(
          { foo: 1, bar: true, other: undefined },
          { type: 'object', properties: { foo: { type: 'number' } }, additionalProperties: true }
        )
      ).toEqual({ foo: 1, bar: true })
      expect(
        objectType.serialize(
          { foo: 1, bar: true },
          {
            type: 'object',
            properties: { foo: { type: 'number' }, bar: { type: 'boolean' }, other: { type: 'string' } }
          }
        )
      ).toEqual({ foo: 1, bar: true })
      expect(
        objectType.serialize(
          {},
          {
            type: 'object'
          }
        )
      ).toEqual({})
      expect(objectType.serialize(undefined, { type: 'object' })).toBeUndefined()
      expect(
        objectType.serialize(
          {
            foo: 1,
            get bar() {
              return true
            }
          },
          {
            type: 'object',
            properties: { foo: { type: 'number' }, bar: { type: 'boolean', readonly: true }, other: { type: 'string' } }
          }
        )
      ).toEqual({ foo: 1, bar: true })
      expect(
        objectType.serialize(
          { foo: 1, bar: true },
          {
            type: 'object',
            properties: { foo: { type: 'number' }, bar: { type: 'boolean' }, other: { type: 'string' } }
          },
          { include: ['virtual'] }
        )
      ).toEqual({ foo: 1, bar: true })
      expect(objectType.serialize(undefined, { type: 'object' })).toBeUndefined()
      const val1 = objectType.serialize(
        {
          foo: 1,
          get bar() {
            return this.foo > 0
          }
        },
        {
          type: 'object',
          properties: {
            foo: { type: 'number' },
            bar: { type: 'boolean', virtual: true },
            other: { type: 'string' }
          }
        },
        { include: ['virtual'] }
      )
      expect(val1).toEqual({ bar: true })
    })
    it('should use default value when value is undefined', () => {
      expect(objectType.serialize(undefined, { type: 'object', default: { foo: 'bar' } })).toEqual({ foo: 'bar' })
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        objectType.serialize('2019-01-21', { type: 'object' })
      }).toThrowError()
      expect(() => {
        objectType.serialize({ foo: 'bar' }, { type: 'object', properties: { foo: { type: 'number' } } })
      }).toThrowError()
      expect(() => {
        objectType.serialize(
          { foo: 'bar' },
          { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } }, required: ['bar'] }
        )
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        objectType.serialize(undefined, { type: 'object', default: true })
      }).toThrowError()
    })
  })
  describe('deserialize', () => {
    it('should deserialize  value', () => {
      expect(objectType.deserialize({ foo: 1, bar: true }, { type: 'object' })).toEqual({ foo: 1, bar: true })
      expect(
        objectType.deserialize({ foo: 1, bar: true }, { type: 'object', properties: { foo: { type: 'number' } } })
      ).toEqual({ foo: 1 })
      expect(
        objectType.deserialize(
          { foo: 1, bar: true, other: undefined },
          { type: 'object', properties: { foo: { type: 'number' } }, additionalProperties: true }
        )
      ).toEqual({ foo: 1, bar: true })
      expect(
        objectType.deserialize(
          { foo: 1, bar: true },
          {
            type: 'object',
            properties: { foo: { type: 'number' }, bar: { type: 'boolean' }, other: { type: 'string' } }
          }
        )
      ).toEqual({ foo: 1, bar: true })
      expect(
        objectType.deserialize(
          {},
          {
            type: 'object'
          }
        )
      ).toEqual({})
      expect(objectType.deserialize(undefined, { type: 'object' })).toBeUndefined()
      const val1 = objectType.deserialize(
        {
          foo: 1,
          get bar() {
            return this.foo > 0
          }
        },
        {
          type: 'object',
          properties: { foo: { type: 'number' }, bar: { type: 'boolean', readonly: true }, other: { type: 'string' } }
        }
      )
      expect(val1).toEqual({ foo: 1 })
      class Person {
        public foo!: string
        public bar?: boolean
      }
      const val2 = objectType.deserialize(
        {
          foo: 1,
          bar: true
        },
        {
          type: 'object',
          classConstructor: Person,
          properties: { foo: { type: 'number' }, bar: { type: 'boolean' }, other: { type: 'string' } }
        }
      )
      expect(val2).toBeInstanceOf(Person)
      expect(val2).toEqual({ foo: 1, bar: true })
    })
    it('should use default value when value is undefined', () => {
      expect(objectType.deserialize(undefined, { type: 'object', default: { foo: 'bar' } })).toEqual({ foo: 'bar' })
    })
    it('should throw error when value is invalid', () => {
      expect(() => {
        objectType.deserialize('2019-01-21', { type: 'object' })
      }).toThrowError()
      expect(() => {
        objectType.deserialize({ foo: 'bar' }, { type: 'object', properties: { foo: { type: 'number' } } })
      }).toThrowError()
      expect(() => {
        objectType.deserialize(
          { foo: 'bar' },
          { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'string' } }, required: ['bar'] }
        )
      }).toThrowError()
    })
    it('should throw error when default value is invalid', () => {
      expect(() => {
        objectType.deserialize(undefined, { type: 'object', default: true })
      }).toThrowError()
    })
  })
  describe('toJsonSchema', () => {
    it('should return json schema', () => {
      const jsonSchema1 = objectType.toJsonSchema({
        type: 'object'
      })
      expect(jsonSchema1).toEqual({ type: 'object' })
      const jsonSchema2 = objectType.toJsonSchema({
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'date' } },
        required: ['foo']
      })
      expect(jsonSchema2).toEqual({
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string', format: 'date-time' } },
        required: ['foo']
      })
      const jsonSchema3 = objectType.toJsonSchema({
        type: 'object',
        properties: { foo: { type: 'string' } },
        additionalProperties: true
      })
      expect(jsonSchema3).toEqual({
        type: 'object',
        properties: { foo: { type: 'string' } },
        additionalProperties: true
      })
      const jsonSchema4 = objectType.toJsonSchema({
        type: 'object',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'number', virtual: true }
        },
        required: ['foo', 'bar', 'thing'],
        additionalProperties: true
      })
      expect(jsonSchema4).toEqual({
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'number' } },
        required: ['foo', 'bar'],
        additionalProperties: true
      })
      const jsonSchema5 = objectType.toJsonSchema(
        {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'number', virtual: true },
            thing: { type: 'object' }
          },
          required: ['foo', 'bar', 'thing'],
          additionalProperties: true
        },
        { include: ['virtual'] }
      )
      expect(jsonSchema5).toEqual({
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'number' } },
        required: ['foo', 'bar'],
        additionalProperties: true
      })
    })
  })
})
