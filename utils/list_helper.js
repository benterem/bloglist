const dummy =(blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((acc, blog) => acc + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
    if(blogs.length < 1){
        return undefined
    }
    const { title, author, likes } = blogs.sort((a, b) => b.likes - a.likes)[0]
    return { title, author, likes }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}