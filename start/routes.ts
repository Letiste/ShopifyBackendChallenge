import Route from '@ioc:Adonis/Core/Route'
import Image from '../app/Models/Image'

Route.get('/', async ({ view, auth, response }) => {
  if (auth.isLoggedIn) {
    const images = await Image.query().select('*').where('to_sell', true)
    return view.render('welcome', { images })
  } else {
    response.redirect('/login')
  }
})

Route.get('/signup', 'UsersController.signup')

Route.post('/signup', 'UsersController.signin')

Route.get('/login', 'UsersController.login')

Route.post('/login', 'UsersController.logging')

Route.delete('/logout', 'UsersController.logout')

Route.group(() => {
  Route.get('/images/create', 'ImagesController.create')

  Route.post('/images/create', 'ImagesController.store')

  Route.get('/images/:id/edit', 'ImagesController.edit')

  Route.patch('/images/:id/edit', 'ImagesController.update')

  Route.delete('/images/:id', 'ImagesController.destroy')

  Route.get('/profile', 'UsersController.profile')
  Route.patch('/images/:id/buy', 'UsersController.buy')
}).middleware('auth')
