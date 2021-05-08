import test from 'japa'
import { JSDOM } from 'jsdom'
import supertest from 'supertest'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'


const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('UsersController', () => {
  test.group('Signup', () => {
    test('ensure signup page works', async (assert) => {
      const { text } = await supertest(BASE_URL).get('/signup').expect(200)
      const { document } = new JSDOM(text).window
      const title = document.querySelector('h1')
      assert.exists(title)
      assert.equal(title!.textContent!.trim(), 'Sign up')
    })
  })

  test.group('Signin', (group) => {
    group.beforeEach(async () => {
      await Database.beginGlobalTransaction()
    })
    group.afterEach(async () => {
      await Database.rollbackGlobalTransaction()
    })
    test('should create a new user if params are valid', async (assert) => {
      const usersBefore = (await User.all()).length
      await supertest(BASE_URL)
        .post('/signup')
        .send({ username: 'username', password: 'password', password_confirmation: 'password' })
        .expect(302)
        .expect('Location', '/')
      const usersAfter = (await User.all()).length
      assert.equal(usersAfter - usersBefore, 1)
    })

    test('should redirect back if params are invalid', async (assert) => {
      const { redirect } = await supertest(BASE_URL)
        .post('/signup')
        .send({})
        .expect(302)
        .expect('Location', '/signup')

      assert.isTrue(redirect)
    })
  })

  test.group('Login', () => {
    test('ensure login page works', async (assert) => {
      const { text } = await supertest(BASE_URL).get('/login').expect(200)
      const { document } = new JSDOM(text).window
      const title = document.querySelector('h1')
      assert.exists(title)
      assert.equal(title!.textContent!.trim(), 'Log in')
    })
  })

  test.group('Logging', (group) => {
    group.beforeEach(async () => {
      await Database.beginGlobalTransaction()
    })
    group.afterEach(async () => {
      await Database.rollbackGlobalTransaction()
    })
    test('should log in a user if params are valid', async (assert) => {
      await User.create({ username: 'username', password: 'password' })
      await supertest(BASE_URL)
        .post('/login')
        .send({ username: 'username', password: 'password' })
        .expect(302)
        .expect('Location', '/')
    })

    test('should redirect back if params are invalid', async (assert) => {
      const { redirect } = await supertest(BASE_URL)
        .post('/login')
        .send({})
        .expect(302)
        .expect('Location', '/login')

      assert.isTrue(redirect)
    })
  })
})
