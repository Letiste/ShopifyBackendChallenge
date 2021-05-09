import test from 'japa'
import supertest from 'supertest'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { isLoggedIn } from '../helpers/isLoggedIn'
import { logUser } from '../helpers/logUser'
import { getCookie, getDocument } from '../helpers'
import Image from '../../app/Models/Image'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const request = supertest(BASE_URL)

let user: User
let image: Image
let cookie: string[]

test.group('UsersController: Signup', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('ensure signup page works', async (assert) => {
    const { text } = await request.get('/signup').expect(200)
    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Sign up')
  })

  test('if user logged in should redirect to /', async () => {
    await User.create({ username: 'username', password: 'password' })
    const cookie = await logUser('username', 'password')
    await request.get('/signup').set('Cookie', cookie).expect(302).expect('Location', '/')
  })
})

test.group('UsersController: Signin', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('should create a new user if params are valid', async (assert) => {
    const usersBefore = (await User.all()).length
    await request
      .post('/signup')
      .send({ username: 'username', password: 'password', password_confirmation: 'password' })
      .expect(302)
      .expect('Location', '/')
    const usersAfter = (await User.all()).length
    assert.equal(usersAfter - usersBefore, 1)
  })

  test('should redirect back and show errors if params are invalid', async (assert) => {
    const { header } = await request
      .post('/signup')
      .send({})
      .expect(302)
      .expect('Location', '/signup')

    const cookie = getCookie(header)

    const { text } = await request.get('/signup').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 2)
  })

  test('should log in if params are valid', async (assert) => {
    const { header } = await request
      .post('/signup')
      .send({ username: 'username', password: 'password', password_confirmation: 'password' })
      .expect(302)
      .expect('Location', '/')

    assert.isTrue(isLoggedIn(header))
  })
})

test.group('UsersController: Login', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('ensure login page works', async (assert) => {
    const { text } = await request.get('/login').expect(200)
    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Log in')
  })

  test('if user logged in should redirect to /', async () => {
    await User.create({ username: 'username', password: 'password' })
    const cookie = await logUser('username', 'password')
    await request.get('/login').set('Cookie', cookie).expect(302).expect('Location', '/')
  })
})

test.group('UsersController: Logging', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('should log in a user if params are valid', async (assert) => {
    await User.create({ username: 'username', password: 'password' })
    const { header } = await request
      .post('/login')
      .send({ username: 'username', password: 'password' })
      .expect(302)
      .expect('Location', '/')
    assert.isTrue(isLoggedIn(header))
  })

  test('should redirect back and show errors if params are invalid', async (assert) => {
    const { header } = await request
      .post('/login')
      .send({})
      .expect(302)
      .expect('Location', '/login')
    assert.isFalse(isLoggedIn(header))

    const cookie = getCookie(header)

    const { text } = await request.get('/login').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 1)
  })
})

test.group('UsersController: Logout', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('should log out if user logged in', async () => {
    await User.create({ username: 'username', password: 'password' })
    const cookie = await logUser('username', 'password')
    const { header } = await request
      .delete('/logout')
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/login')
    const newCookie = getCookie(header)
    await request.get('/').set('Cookie', newCookie).expect(302).expect('Location', '/login')
  })

  test('should redirect to /login if user not logged in', async () => {
    await request.delete('/logout').expect(302).expect('Location', '/login')
  })
})

test.group('UsersController: Profile', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('should render profile if user is logged in', async (assert) => {
    const user = await User.create({ username: 'username', password: 'password' })
    const cookie = await logUser('username', 'password')
    const { text } = await request.get('/profile').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), `Profile of ${user.username}`)
  })

  test('should redirect to /login if not logged in', async () => {
    await request.get('/profile').expect('Location', '/login')
  })
})

test.group('UsersController: Buy', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
    user = await User.create({ username: 'username', password: 'password', balance: 100 })
    image = await user
      .related('images')
      .create({ name: 'Image', price: 12, toSell: false, data: '', extname: 'jpg' })
    cookie = await logUser('username', 'password')
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should buy image if user has enough money', async (assert) => {
    image.toSell = true
    image.userId = user.id + 1
    await image.save()

    await request
      .patch(`/images/${image.id}/buy`)
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/')

    const userAfterBuy = await User.find(user.id)
    const imageAfterBuy = await Image.find(image.id)
    assert.equal(userAfterBuy!.balance, user.balance - image.price)
    assert.equal(imageAfterBuy!.userId, userAfterBuy!.id)
    assert.isFalse(!!imageAfterBuy!.toSell)
  })

  test('should send 404 if no image found', async () => {
    const lastId = (await Image.all).length
    await request
      .patch(`/images/${lastId + 1}/buy`)
      .set('Cookie', cookie)
      .expect(404)
  })

  test('should show error if image not to sell', async (assert) => {
    const { header } = await request
      .patch(`/images/${image.id}/buy`)
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/')

    const newCookie = getCookie(header)

    const { text } = await request.get('/').set('Cookie', newCookie).expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 1)
    assert.isTrue(errors[0].textContent!.includes('not to sell'))
  })

  test('should show error if user has not enough money', async (assert) => {
    user.balance = 0
    await user.save()

    image.toSell = true
    await image.save()
    const { header } = await request
      .patch(`/images/${image.id}/buy`)
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/')

    const newCookie = getCookie(header)

    const { text } = await request.get('/').set('Cookie', newCookie).expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 1)
    assert.isTrue(errors[0].textContent!.includes('Not enough money'))
  })
})
