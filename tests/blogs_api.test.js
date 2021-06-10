const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')


// beforeEach(async () => {
//   await Blog.deleteMany({})
//   const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
//   const promiseArray = blogObjects.map(blogObject => blogObject.save())
//   await Promise.all(promiseArray)
// })

beforeEach(async () => {
  await Blog.deleteMany({})

  let blogObject = new Blog(helper.initialBlogs[0])  
  await blogObject.save()

  blogObject = new Blog(helper.initialBlogs[1])  
  await blogObject.save()
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


  const notesAtEnd = await helper.blogsInDb()
  const blogObjects = notesAtEnd.map(r => {
    delete r.id
    return r
  })
  expect(notesAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  expect(blogObjects).toContainEqual(newBlog)
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

  const notesAtEnd = await helper.blogsInDb()
  expect(notesAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const blogObjects = notesAtEnd.map(r => {
    delete r.id
    return r
  })
  expect(blogObjects).toContainEqual({ ...newBlog, likes: 0})
})

test('blogs with missing url and title return 400 Bad Request', async () => {
  await api
    .post('/api/blogs')
    .send({})
    .expect(400)
  
  const notesAtEnd = await helper.blogsInDb()
  expect(notesAtEnd).toHaveLength(helper.initialBlogs.length)
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

afterAll(() => mongoose.connection.close())