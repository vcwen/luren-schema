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
        required: false,
        schema: expect.objectContaining({ type: 'string' }),
        strict: false,
        private: false
      })
    )
  })

  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Prop({ json: { name: 'myName' }, required: true, type: 'number' })
      public name!: string
    }
    const props: Map<string, PropMetadata> = Reflect.getMetadata(MetadataKey.PROPS, TestController.prototype)
    expect(props.get('name')).toEqual(
      expect.objectContaining({
        required: true,
        schema: expect.objectContaining({
          type: 'number',
          json: expect.objectContaining({ name: 'myName' })
        }),
        strict: false,
        private: false
      })
    )
  })
})
