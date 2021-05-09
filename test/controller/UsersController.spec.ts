import test from 'japa'
import supertest from 'supertest'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import { isLoggedIn } from '../helpers/isLoggedIn'
import { logUser } from '../helpers/logUser'
import { getCookie, getDocument } from '../helpers'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const request = supertest(BASE_URL)

test.group('UsersController: Signup', () => {
  test('ensure signup page works', async (assert) => {
    const { text } = await request.get('/signup').expect(200)
    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Sign up')
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

    const { text } = await request
      .get('/signup')
      .set('Cookie', cookie)
      .expect(200)

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

test.group('UsersController: Login', () => {
  test('ensure login page works', async (assert) => {
    const { text } = await request.get('/login').expect(200)
    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Log in')
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

    const { text } = await request
      .get('/login')
      .set('Cookie', cookie)
      .expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 1)
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
    const { text } = await request
      .get('/profile')
      .set('Cookie', cookie)
      .expect(200)

    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), `Profile of ${user.username}`)
  })

  test('should redirect to /login if not logged in', async () => {
    await request
      .get('/profile')
      .expect('Location', '/login')
  })
})
