import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Image from 'App/Models/Image'
import fs from 'fs'

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
      // TODO: find solution to use Infinity instead of a big number
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
      const rs = fs.createReadStream(file.tmpPath!)
      const chunks: string[] = []
      let data = ""
      const promise = new Promise((resolve, reject) => {
        rs.on('data', (chunk) => {
          chunks.push(chunk.toString('base64'))
        })
        rs.on('error', (err) => reject(err));
        rs.on('end', () => resolve(chunks.join('')));
      })
      data = await promise as string
      const extname = file.extname!
      await user.related('images').create({ name, price, toSell: toSell || false, data, extname })
      response.redirect('/profile')
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

  public async destroy({ params, response, bouncer }: HttpContextContract) {
    const { id } = params

    const image = await Image.find(id)

    if (image) {
      await bouncer.authorize('deleteImage', image)
      image.delete()
      response.redirect('/profile')
    }

  }
}
