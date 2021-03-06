import test from 'japa'
import supertest from 'supertest'
import Database from '@ioc:Adonis/Lucid/Database'
import User from '../../app/Models/User'
import { logUser, getCookie, getDocument } from '../helpers/'
import path from 'path'
import Image from '../../app/Models/Image'
const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const request = supertest(BASE_URL)

let user: User
let image: Image
let cookie: string[]

test.group('ImagesController: Index', (group) => {
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
  test('ensure index page works', async (assert) => {
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

  test('should show searched image', async (assert) => {
    image.toSell = true
    await image.save()
    await user
      .related('images')
      .create({ name: 'Image', price: 12, toSell: true, data: '', extname: 'png' })

    const { text } = await request.get('/').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const images = document.querySelectorAll('li')
    assert.equal(images.length, 2)

    const { text: newText } = await request
      .get('/?name=Im&extname=png')
      .set('Cookie', cookie)
      .expect(200)

    const newDocument = getDocument(newText)
    const newImages = newDocument.querySelectorAll('li')
    assert.equal(newImages.length, 1)
  })
})

test.group('ImagesController: Create', async (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
    user = await User.create({ username: 'username', password: 'password' })
    cookie = await logUser('username', 'password')
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
  test('ensure create page works', async (assert) => {
    const { text } = await request.get('/images/create').set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Add a new Image')
  })

  test('should redirect to /login if not logged in', async () => {
    await request.get('/images/create').expect(302).expect('Location', '/login')
  })
})

test.group('ImagesController: Store', (group) => {
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
    user = await User.create({ username: 'username', password: 'password' })
    cookie = await logUser('username', 'password')
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })

  test('should create a new image associated to a user if params are valid', async (assert) => {
    const filePath = path.join(__dirname, '../mocks/mock.png')
    const imageBefore = (await user.related('images').query()).length
    assert.equal(imageBefore, 0)
    await request
      .post('/images/create')
      .set('Cookie', cookie)
      .field('name', 'Kitten')
      .field('price', '9001')
      .attach('file', filePath)
      .expect(302)
      .expect('Location', '/profile')
    const imageAfter = (await user.related('images').query()).length
    assert.equal(imageAfter, 1)
  })

  test('should redirect back and show errors if params are invalid', async (assert) => {
    const { header } = await request
      .post('/images/create')
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/images/create')

    const newCookie = getCookie(header)

    const { text } = await request.get('/images/create').set('Cookie', newCookie).expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 3)
  })
})

test.group('ImagesController: Edit', async (group) => {
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
  test('ensure edit page works', async (assert) => {
    const { text } = await request.get(`/images/${image.id}/edit`).set('Cookie', cookie).expect(200)

    const document = getDocument(text)
    const title = document.querySelector('h1')
    assert.exists(title)
    assert.equal(title!.textContent!.trim(), 'Edit Image')
  })

  test('should redirect to /login if not logged in', async () => {
    await request.get(`/images/${image.id}/edit`).expect(302).expect('Location', '/login')
  })

  test('should return 404 if no image found', async () => {
    const lastId = (await Image.all()).length
    await request
      .get(`/images/${lastId + 1}/edit`)
      .set('Cookie', cookie)
      .expect(404)
  })
})

test.group('ImagesController: Update', (group) => {
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

  test('should edit image and redirect to /profile if params are valid', async (assert) => {
    const filePath = path.join(__dirname, '../mocks/mock.png')
    await request
      .patch(`/images/${image.id}/edit`)
      .set('Cookie', cookie)
      .field('name', 'Kitten')
      .field('price', '9001')
      .attach('file', filePath)
      .expect(302)
      .expect('Location', '/profile')
    const updatedImage = await Image.find(image.id)
    assert.equal(updatedImage!.name, 'Kitten')
    assert.equal(updatedImage!.price, 9001)
    assert.equal(updatedImage!.extname, 'png')
  })

  test('should redirect back and show errors if params are invalid', async (assert) => {
    const { header } = await request
      .patch(`/images/${image.id}/edit`)
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', `/images/${image.id}/edit`)

    const newCookie = getCookie(header)

    const { text } = await request
      .get(`/images/${image.id}/edit`)
      .set('Cookie', newCookie)
      .expect(200)

    const document = getDocument(text)
    const errors = document.querySelectorAll('.error')
    assert.equal(errors.length, 2)
  })

  test('should return 404 if no image found', async () => {
    const lastId = (await Image.all()).length
    await request
      .patch(`/images/${lastId + 1}/edit`)
      .set('Cookie', cookie)
      .expect(404)
  })
})

test.group('ImagesController: Destroy', async (group) => {
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

  test('should delete image if image found and redirect to /profile', async (assert) => {
    const imagesBefore = (await Image.all()).length
    await request
      .delete(`/images/${image.id}`)
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/profile')

    const imagesAfter = (await Image.all()).length
    assert.equal(imagesAfter - imagesBefore, -1)
    const imageDeleted = await Image.find(image.id)
    assert.isNull(imageDeleted)
  })

  test('should redirect to /login if not logged in', async () => {
    await request.delete(`/images/${image.id}`).expect(302).expect('Location', '/login')
  })

  test('should redirect to /profile when image not found', async () => {
    const lastId = (await Image.all()).length
    await request
      .delete(`/images/${lastId + 1}`)
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/profile')
  })
})
