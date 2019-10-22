# luren-schema
[![npm version](https://badge.fury.io/js/luren-schema.svg)](https://badge.fury.io/js/luren-schema)
[![Dependencies Status](https://david-dm.org/vcwen/luren-schema.svg)](https://david-dm.org/vcwen/luren-schema)
[![Build Status](https://travis-ci.org/vcwen/luren-schema.svg?branch=master)](https://travis-ci.org/vcwen/luren-schema)
[![Coverage Status](https://coveralls.io/repos/github/vcwen/luren-schema/badge.svg?branch=master)](https://coveralls.io/github/vcwen/luren-schema?branch=master)

Luren-Schema is a typescript module for Luren, it uses metadata to store type info and validate data.It use decorators to inject metadata, so decorator must be enabled .

Built-in  data types:

`string`, `boolean`, `number`, `integer`, `date`, `array`,`object`

```typescript
@Schema({title: 'person', additionalProperties: true})
class Person {
      @Prop({ required: true, type: 'string' })
      public name: string
      @Prop({ private: true, required: true })
      public password: string
      constructor(name: string, passowrd: string) {
        this.name = name
        this.passowrd = passowrd
      }
      public greeting() {
        console.log(`Hi, I'm ${this.name}`)
      }
    }
const person = new Person('My Name', 'my_passoword')
const schema = getJsSchema(Person)

// validation
//result: [true, undefined]
const [valid, errorMsg] = JsTypes.validate(person, schema)
//serialize to json
// result: {name: 'My Name'}
const data = JsTypes.serialize(person, schema)
//deserialize from json
//result: Person {name: 'John', password: 'encrypted_passwd'}
const p = JsTypes.deserialize({name: 'John', password: 'encrypted_passwd'}, schema)
// result: Hi, I'm John
p.greeting()
```
