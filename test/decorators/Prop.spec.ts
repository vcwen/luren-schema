import { Map } from 'immutable'
import 'reflect-metadata'
import { Prop, PropMetadata } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'

describe('Prop', () => {
  it('should define prop metadata', () => {
    class TestController {
      @Prop()
      public name!: string
    }
    const ctrl = new TestController()
    const props: Map<string, PropMetadata> = Reflect.getMetadata(MetadataKey.PROPS, ctrl)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        name: 'name',
        required: true,
        schema: expect.objectContaining({ type: 'string' })
      })
    )
  })

  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Prop({ required: true, type: 'number' })
      public name!: string
      @Prop({ private: true })
      public password!: string
    }
    const props: Map<string, PropMetadata> = Reflect.getMetadata(MetadataKey.PROPS, TestController.prototype)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        required: true,
        schema: expect.objectContaining({
          type: 'number'
        })
      })
    )
    expect(props.get('password')).toEqual(
      expect.objectContaining({
        required: true,
        schema: {
          type: 'string',
          private: true
        }
      })
    )
  })
  it('should use the external schema  when schema  is set in options', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Prop({ required: true, virtual: true, schema: { type: 'string', format: 'date' } })
      public name!: string
    }
    const props: Map<string, PropMetadata> = Reflect.getMetadata(MetadataKey.PROPS, TestController.prototype)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        required: true,
        schema: { type: 'string', format: 'date', virtual: true }
      })
    )
  })
})
