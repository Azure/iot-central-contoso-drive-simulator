// This www server can be used instead of npm run start
var express = require('express')
var path = require('path')

var app = express()
var port = 3000

app.use(express.static('build'));
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname + '/build/index.html')));

app.listen(port, () => {
    console.log(`Contoso-drive-simulator app listening at http://localhost:${port}`)
})