// tslint:disable: max-classes-per-file
import { Prop, Schema, utils } from '../../src'

describe('utils', () => {
  describe('getJsSchema', () => {
    it('should get schema from class', () => {
      @Schema()
      class Person {
        @Prop({ type: 'string' })
        public name!: string
      }
      const schema = utils.getJsSchema(Person)
      expect(schema).toEqual({
        type: 'object',
        classConstructor: Person,
        properties: { name: { type: 'string' } },
        required: ['name']
      })
    })
    it('should get schema from object', () => {
      @Schema()
      class Person {
        @Prop({ type: 'string' })
        public name!: string
      }
      const person = new Person()
      const schema = utils.getJsSchema(person)
      expect(schema).toEqual({
        type: 'object',
        classConstructor: Person,
        properties: { name: { type: 'string' } },
        required: ['name']
      })
    })
    it('should return undefined if no schema is defined', () => {
      class Person {
        public name!: string
      }
      const person = new Person()
      const schema = utils.getJsSchema(person)
      expect(schema).toBeUndefined()
    })
  })
  describe('defineJsSchema', () => {
    it('should define JsSchema on class', () => {
      class Person {}
      utils.defineJsSchema(Person, { type: 'object' })
      const schema = utils.getJsSchema(Person)
      expect(schema).toEqual({ type: 'object' })
    })
  })
  describe('convertSimpleSchemaToJsSchema', () => {
    it('should convert primitive types', () => {
      const schema1 = utils.convertSimpleSchemaToJsSchema('string')
      expect(schema1).toEqual([{ type: 'string' }, true])
      const schema2 = utils.convertSimpleSchemaToJsSchema('integer?')
      expect(schema2).toEqual([{ type: 'integer' }, false])
      const schema3 = utils.convertSimpleSchemaToJsSchema(['string?', { format: 'email' }])
      expect(schema3).toEqual([{ type: 'string', format: 'email' }, false])
    })
    it('should convert array type', () => {
      const schema4 = utils.convertSimpleSchemaToJsSchema(['integer'])
      expect(schema4).toEqual([{ type: 'array', items: { type: 'integer' } }, true])
      const schema5 = utils.convertSimpleSchemaToJsSchema([['string'], { maxLength: 10 }])
      expect(schema5).toEqual([{ type: 'array', items: { type: 'string' }, maxLength: 10 }, true])
      const schema6 = utils.convertSimpleSchemaToJsSchema([])
      expect(schema6).toEqual([{ type: 'array' }, true])
      const schema7 = utils.convertSimpleSchemaToJsSchema([[], { minLength: 2 }])
      expect(schema7).toEqual([{ type: 'array', minLength: 2 }, true])
    })
    it('should convert object type', () => {
      const schema8 = utils.convertSimpleSchemaToJsSchema({})
      expect(schema8).toEqual([{ type: 'object' }, true])
      const schema9 = utils.convertSimpleSchemaToJsSchema({
        name: 'string?',
        age: 'number',
        email: ['string', { format: 'email' }],
        'address?': { detail: 'string' }
      })
      expect(schema9).toEqual([
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            email: { type: 'string', format: 'email' },
            address: {
              type: 'object',
              properties: { detail: { type: 'string' } },
              required: ['detail']
            }
          },
          required: ['age', 'email']
        },
        true
      ])
      const schema10 = utils.convertSimpleSchemaToJsSchema([{}, { additionalProps: true }])
      expect(schema10).toEqual([{ type: 'object', additionalProps: true }, true])
      expect(() => {
        utils.convertSimpleSchemaToJsSchema({ 'name+': 'string' })
      }).toThrowError()
      expect(() => {
        utils.convertSimpleSchemaToJsSchema({ name: 'string+' })
      }).toThrowError()
    })
    it('should convert type primitive type class', () => {
      const schema1 = utils.convertSimpleSchemaToJsSchema(String)
      expect(schema1).toEqual([{ type: 'string' }, true])
      const schema2 = utils.convertSimpleSchemaToJsSchema(Boolean)
      expect(schema2).toEqual([{ type: 'boolean' }, true])
      const schema3 = utils.convertSimpleSchemaToJsSchema(Number)
      expect(schema3).toEqual([{ type: 'number' }, true])
      const schema4 = utils.convertSimpleSchemaToJsSchema(Date)
      expect(schema4).toEqual([{ type: 'date' }, true])
      const schema5 = utils.convertSimpleSchemaToJsSchema(Object)
      expect(schema5).toEqual([{ type: 'object' }, true])
      const schema6 = utils.convertSimpleSchemaToJsSchema(Array)
      expect(schema6).toEqual([{ type: 'array' }, true])
      const schema7 = utils.convertSimpleSchemaToJsSchema(Array)
      expect(schema7).toEqual([{ type: 'array' }, true])
      class Person {}
      expect(() => {
        utils.convertSimpleSchemaToJsSchema(Person)
      }).toThrowError()
      expect(() => {
        utils.convertSimpleSchemaToJsSchema(1)
      }).toThrowError()
      @Schema()
      class Foo {
        @Prop()
        public bar!: string
      }
      const schema8 = utils.convertSimpleSchemaToJsSchema(Foo)
      expect(schema8).toEqual([
        { type: 'object', classConstructor: Foo, properties: { bar: { type: 'string' } }, required: ['bar'] },
        true
      ])
    })
  })
  describe('toJsonSchema', () => {
    it('should define JsSchema on class', () => {
      const jsonSchema = utils.toJsonSchema({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          createAt: { type: 'date' },
          birthday: { type: 'date', format: 'date' },
          isVip: { type: 'boolean' },
          parents: { type: 'array', items: { type: 'string' }, maxItems: 2 },
          job: { type: 'object', properties: { tittle: { type: 'string' } } }
        },
        required: ['age', 'email']
      })
      expect(jsonSchema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          createAt: { type: 'string', format: 'date-time' },
          birthday: { type: 'string', format: 'date' },
          isVip: { type: 'boolean' },
          parents: { type: 'array', items: { type: 'string' }, maxItems: 2 },
          job: { type: 'object', properties: { tittle: { type: 'string' } } }
        },
        required: ['age', 'email']
      })
    })
  })
  describe('copyProperties', () => {
    it('should copy values from source to target', () => {
      const source = { name: 'my_name', foo: 'foo', bar: 3 }
      const target = { title: 'engineer' }
      utils.copyProperties(target, source, ['foo', 'bar'])
      expect(target).toEqual({ title: 'engineer', foo: 'foo', bar: 3 })
    })
  })
  describe('getInclusiveProps', () => {
    it('should return included props ', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          foo: { type: 'number', private: true },
          fullName: { type: 'string', virtual: true }
        }
      }
      expect(utils.getInclusiveProps(schema, { include: ['virtual'] })).toEqual(['name', 'foo', 'fullName'])
      expect(utils.getInclusiveProps(schema, { exclude: ['private'] })).toEqual(['name', 'fullName'])
      expect(utils.getInclusiveProps(schema, { onlyProps: ['fullName'] })).toEqual(['fullName'])
      expect(utils.getInclusiveProps(schema, {})).toEqual(['name', 'foo', 'fullName'])
    })
    it("should return empty array if there's no props", () => {
      const props = utils.getInclusiveProps(
        {
          type: 'object'
        },
        { include: ['private', 'virtual'] }
      )
      expect(props).toEqual([])
    })
    it('should return props with high priority', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          foo: { type: 'number', private: true, virtual: true, readonly: true },
          fullName: { type: 'string', virtual: true, readonly: true }
        }
      }
      expect(utils.getInclusiveProps(schema, { include: ['virtual'], exclude: ['readonly'] })).toEqual([
        'name',
        'foo',
        'fullName'
      ])
      expect(utils.getInclusiveProps(schema, { exclude: ['private'], include: ['virtual'] })).toEqual([
        'name',
        'fullName'
      ])
      expect(utils.getInclusiveProps(schema, { exclude: ['readonly', 'private'], include: ['virtual'] })).toEqual([
        'name',
        'fullName'
      ])
      expect(utils.getInclusiveProps(schema, { include: ['readonly', 'private'], exclude: ['virtual'] })).toEqual([
        'name',
        'foo',
        'fullName'
      ])
    })
    it('should throw error if schema type is not object', () => {
      expect(() => {
        utils.getInclusiveProps({ type: 'array' }, { exclude: ['private'] })
      }).toThrowError()
    })
    it('should throw error if schema prop is not valid', () => {
      expect(() => {
        utils.getInclusiveProps(
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
              foo: { type: 'number', private: true, virtual: true, foo: true },
              fullName: { type: 'string', virtual: true, readonly: true }
            }
          },
          { exclude: ['bar', 'foo'] }
        )
      }).toThrowError()
    })
  })
  describe('setErrorMessagePrefix', () => {
    it('should return err which message with prefix', () => {
      const err = new Error('test error')
      const res = utils.setErrorMessagePrefix(err, 'test:') as Error
      expect(res).toBeInstanceOf(Error)
      expect(res.message).toBe('test:test error')
    })
    it('should err message with prefix', () => {
      const err = 'test error'
      const res = utils.setErrorMessagePrefix(err, 'test:') as string
      expect(res).toBe('test:test error')
    })
  })
})
