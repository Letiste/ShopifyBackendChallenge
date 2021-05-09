import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import Image from '../../Models/Image'

export default class UsersController {
  public async signup({ view, auth, response }: HttpContextContract) {
    if (auth.isLoggedIn) {
      response.redirect('/')
    } else {
      return view.render('signup')
    }
  }

  public async signin({ request, response, session, auth }: HttpContextContract) {
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

      const user = await User.create(payload)
      await auth.login(user)
      response.redirect('/')
    } catch (error) {
      session.flash('errors', error.messages)
      response.redirect('/signup')
    }
  }

  public async login({ view, auth, response }: HttpContextContract) {
    if (auth.isLoggedIn) {
      response.redirect('/')
    } else {
      return view.render('login')
    }
  }

  public async logging({ request, response, auth, session }: HttpContextContract) {
    try {
      const { username, password } = await request.only(['username', 'password'])
      await auth.attempt(username, password)
      response.redirect('/')
    } catch (error) {
      session.flash('errors', { login: 'Username or Password incorrect' })
      response.redirect('/login')
    }
  }

  public async logout({ response, auth }: HttpContextContract) {
    await auth.logout()
    response.redirect('/login')
  }

  public async profile({ auth, view }: HttpContextContract) {
    const user = auth.user!

    const images = await user.related('images').query()
    return view.render('profile', { user, images })
  }

  public async buy({ params, response, session, auth }: HttpContextContract) {

    const { id } = await params

    const user = auth.user!
    const image = await Image.find(id)
    if (!image) {
      return response.status(404)
    }

    if (!image.toSell) {
      session.flash('errors', { buy: 'This image is not to sell' })
      return response.redirect('/')
    }
    if (user.balance < image.price) {
      session.flash('errors', { buy: `Not enough money to buy the image. Current balance: ${user.balance}` })
      return response.redirect('/')
    }

    user.balance -= image.price
    await user.save()

    image.userId = user.id
    image.toSell = false
    await image.save()

    return response.redirect('/')
  }
}
