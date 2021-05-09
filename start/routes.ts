import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async ({ view, auth, response }) => {
  if (auth.isLoggedIn) {
    return view.render('welcome')
  } else {
    response.redirect('/login')
  }
})

Route.get('/signup', 'UsersController.signup')

Route.post('/signup', 'UsersController.signin')

Route.get('/login', 'UsersController.login')

Route.post('/login', 'UsersController.logging')

Route.delete('/logout', 'UsersController.logout')

Route.get('/images/create', 'ImagesController.create').middleware('auth')

Route.post('/images/create', 'ImagesController.store').middleware('auth')

Route.get('/profile', 'UsersController.profile').middleware('auth')