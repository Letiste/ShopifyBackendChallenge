import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class UsersController {
  public async signup({ view }: HttpContextContract) {
    return view.render('signup')
  }

  public async signin({ request, response, session }: HttpContextContract) {
    const newSignupSchema = schema.create({
      username: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'username', caseInsensitive: true }),
      ]),
      password: schema.string({ trim: true }, [rules.confirmed(), rules.minLength(6)]),
    })
    try {
      const payload = await request.validate({
        schema: newSignupSchema,
        messages: {
          required: 'The {{ field }} is required to create a new account',
        },
      })

      await User.create(payload)
      response.redirect('/signup')
    } catch (error) {
      session.flash('errors', error.messages)
      response.redirect('/signup')
    }
  }
}
