# luren-schema
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
    }
const person = new Person('My Name', 'my_passoword')
const schema = getJsSchema(Person)

// validation
const [valid, errorMsg] = JsTypes.validate(person, schema)
//serialize to json
const data = JsTypes.serialize(person, schema) // result: {name: 'My Name'}
//deserialize from json
const data = JsTypes.deserialize({name: 'John', password: 'encrypted_passwd'}, schema)//result: Person {name: 'John', password: 'encrypted_passwd'}
```


