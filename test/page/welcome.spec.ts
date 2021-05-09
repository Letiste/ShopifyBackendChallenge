import Database from '@ioc:Adonis/Lucid/Database'
import test from 'japa'
import supertest from 'supertest'
import Image from '../../app/Models/Image'
import User from '../../app/Models/User'
import { getDocument, logUser } from '../helpers'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const request = supertest(BASE_URL)

let user: User
let image: Image
let cookie: string[]

test.group('Welcome Page', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
    user = await User.create({ username: 'username', password: 'password' })
    image = await user
      .related('images')
      .create({ name: 'Image', price: 12, toSell: false, data: '', extname: 'jpg' })
    cookie = await logUser('username', 'password')
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('ensure welcome page works', async (assert) => {
    const { text } = await request.get('').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Welcome')
  })

  test('should redirect to /login if not logged in', async () => {
    await request.get('/').expect(302).expect('Location', '/login')
  })

  test('should show image on sell', async (assert) => {
    const { text } = await request.get('/').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const images = document.querySelectorAll('li')
    assert.equal(images.length, 0)

    image.toSell = true
    await image.save()

    const { text: newText } = await request.get('/').set('Cookie', cookie).expect(200)

    const newDocument = getDocument(newText)
    const newImages = newDocument.querySelectorAll('li')
    assert.equal(newImages.length, 1)
  })
})
