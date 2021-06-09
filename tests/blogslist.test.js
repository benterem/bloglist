const listHelper = require('../utils/list_helper')

test('dummy returns one', () => {
    
    const blogs = []

    const results = listHelper.dummy(blogs)
    expect(results).toBe(1)
})