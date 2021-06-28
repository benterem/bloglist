const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')


describe('when there are intially some blogs saved', () => {

  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
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
  
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
  
  test('have a unique identifier property, named id', async () => {
    const blogsAtEnd = await helper.blogsInDb()
    blogsAtEnd.forEach(r => {
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
})

describe('when there is initially one user in the DB', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'test123',
      name: 'tester mctest',
      password: 'password'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async() => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'whaterver',
      password: '123456'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    
    expect(result.body.error).toContain('`username` to be unique')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).not.toContain(newUser.username)

  })

  test('creation fails when username is too shot', async() => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'a',
      name: 'whaterver',
      password: '123456hhhhh'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('is shorter than the minimum allowed length')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).not.toContain(newUser.username)
  })

  test('creation fails when password is too short', async() => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'test test',
      name: 'whaterver',
      password: '1'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    
      expect(result.body.error).toContain('please enter a valid password')
      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).not.toContain(newUser.username)
  })
})

afterAll(() => mongoose.connection.close())