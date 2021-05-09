import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import Image from 'App/Models/Image'
import fs from 'fs'

export default class ImagesController {
  public async index({}: HttpContextContract) {}

  public async create({ view }: HttpContextContract) {
    return view.render('images/create')
  }

  public async store({ request, response, session, auth }: HttpContextContract) {
    const newStoreSchema = schema.create({
      file: schema.file({ extnames: ['jpg', 'png'], size: '2mb' }),
      name: schema.string({ trim: true }),
      // TODO: find solution to use Infinity instead of a big number
      price: schema.number([rules.range(0, 9999999999)]),
      toSell: schema.boolean.optional(),
    })
    try {
      const { file, name, price, toSell } = await request.validate({
        schema: newStoreSchema,
        messages: {
          required: 'The {{ field }} is required to create a new image',
        },
      })
      const user = await auth.user!
      const data = await setFile(file)
      const extname = file.extname!
      await user.related('images').create({ name, price, toSell: toSell || false, data, extname })
      response.redirect('/profile')
    } catch (error) {
      session.flash('errors', error.messages)
      response.redirect('/images/create')
    }
  }

  public async show({}: HttpContextContract) {}

  public async edit({ params, view, response, bouncer }: HttpContextContract) {
    const { id } = params
    const image = await Image.find(id)

    if (image) {
      await bouncer.authorize('editImage', image)
      return view.render('images/edit', { image })
    } else {
      response.status(404)
    }
  }

  public async update({ request, params, response, bouncer, session }: HttpContextContract) {
    const { id } = params
    const image = await Image.find(id)
    if (!image) {
      return response.status(404)
    }
    try {
      await bouncer.authorize('editImage', image)
      const newUpdateSchema = schema.create({
        file: schema.file.optional({ extnames: ['jpg', 'png'], size: '2mb' }),
        name: schema.string({ trim: true }),
        // TODO: find solution to use Infinity instead of a big number
        price: schema.number([rules.range(0, 9999999999)]),
        toSell: schema.boolean.optional(),
      })

      const { file, name, price, toSell } = await request.validate({
        schema: newUpdateSchema,
        messages: {
          required: 'The {{ field }} is required to create a new image',
        },
      })
      if (file) {
        image.data = await setFile(file)
        image.extname = file.extname!
      }

      image.name = name
      image.price = price
      image.toSell = toSell || false

      await image.save()

      response.redirect('/profile')
    } catch (error) {
      session.flash('errors', error.messages)
      response.redirect(`/images/${id}/edit`)
    }
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

async function setFile(file: MultipartFileContract): Promise<string> {
  const data = fs.readFileSync(file.tmpPath!)
  return data.toString('base64')
}
