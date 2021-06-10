const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const initialBlogs = [
  {
    _id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0
  },
  {
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0
  }
]

beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObjects = initialBlogs.map(blog => new Blog(blog))
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
  expect(response.body).toHaveLength(initialBlogs.length)
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

    
  const response = await api.get('/api/blogs')
  const blogObjects = response.body.map(r => {
    delete r.id
    return r
  })
  expect(response.body).toHaveLength(initialBlogs.length + 1)
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

  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(initialBlogs.length + 1)

  const blogObjects = response.body.map(r => {
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
  
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(initialBlogs.length)
})

afterAll(() => mongoose.connection.close())