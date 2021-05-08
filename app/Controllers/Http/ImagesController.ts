import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Application from '@ioc:Adonis/Core/Application'

export default class ImagesController {
  public async index({ }: HttpContextContract) {
  }

  public async create({ view }: HttpContextContract) {
    return view.render('images/create')
  }

  public async store({ request, response, session, auth }: HttpContextContract) {
    const newStoreSchema = schema.create({
      file: schema.file({ extnames: ['jpg', 'png'], size: '2mb' }),
      name: schema.string({ trim: true }),
      price: schema.number([rules.range(0, 9999999999)]),
      toSell: schema.boolean.optional()
    })
    try {
      const { file, name, price, toSell } = await request.validate({
        schema: newStoreSchema,
        messages: {
          required: 'The {{ field }} is required to create a new image',
        },
      })
      const user = await auth.user!
      const image = await user.related('images').create({ name, price, toSell: toSell || false })
      const fileName = `${user.id}-${image.id}`
      await file.move(Application.tmpPath('uploads'), { name: fileName })
      response.redirect('/')
    } catch (error) {
      session.flash('errors', error.messages)
      response.redirect('/images/create')
    }
  }

  public async show({ }: HttpContextContract) {
  }

  public async edit({ }: HttpContextContract) {
  }

  public async update({ }: HttpContextContract) {
  }

  public async destroy({ }: HttpContextContract) {
  }
}
