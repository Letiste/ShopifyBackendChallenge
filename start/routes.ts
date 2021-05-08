import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async ({ view }) => {
  return view.render('welcome')
})

Route.get('/signup', 'UsersController.signup')

Route.post('/signup', 'UsersController.signin')

Route.get('/login', 'UsersController.login')

Route.post('/login', 'UsersController.logging')
