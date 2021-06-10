const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')


beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blogObject => blogObject.save())
  await Promise.all(promiseArray)
})


test('blogs are returned as JSON', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two blogs', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('have a unique identifier property, named id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach(r => {
    expect(r.id).toBeDefined()
  })
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: "test",
    author: "test mctester",
    url: "https://example.com/",
    likes: 55,
  }
  
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)


  const blogsAtEnd = await helper.blogsInDb()
  const blogsWithOutId = helper.blogsWithOutId(blogsAtEnd)

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  expect(blogsWithOutId).toContainEqual(newBlog)
})

test('blogs with missing likes property default to 0', async () => {
  const newBlog = {
    title: "test",
    author: "test mctester",
    url: "https://example.com/",
  }

  await api
   .post('/api/blogs')
   .send(newBlog)
   .expect(201)
   .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const blogsWithOutId = helper.blogsWithOutId(blogsAtEnd)

  expect(blogsWithOutId).toContainEqual({ ...newBlog, likes: 0})
})

test('blogs with missing url and title return 400 Bad Request', async () => {
  await api
    .post('/api/blogs')
    .send({})
    .expect(400)
  
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
  expect(blogsAtEnd).not.toContainEqual(blogToDelete)
})

test('a blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToBeUpdate = blogsAtStart[0]

  const updatedBlog = {
    title: "update",
    author: "update mctester",
    url: "https://example5.com/",
    likes: 54353553
  }

  await api
    .put(`/api/blogs/${blogToBeUpdate.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  const blogsWithOutId = helper.blogsWithOutId(blogsAtEnd)

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  expect(blogsWithOutId).toContainEqual(updatedBlog)
})

afterAll(() => mongoose.connection.close())