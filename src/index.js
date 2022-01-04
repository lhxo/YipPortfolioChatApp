const {app, server} = require('./app')
const port = process.env.PORT

server.listen(port, () => {
    console.log('Server is up and running on PORT3000')
})