// const express = require('express')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

// app.use(express.json())

blogsRouter.get('/', request, response => {
  Blog
    .find({})
    .then(blogs => {
      response.json(blogs)
    })
})

blogsRouter.post('/', (request, response) => {
    const blog = new Blog(request.body)
    blog
      .save()
      .then(result => {
        response.status(201).json(result)
      })
  })

  module.exports = blogRouters