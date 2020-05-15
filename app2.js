var express = require('express')
var app = express();

app.get('*', (req, res) => {
    res.send('404 error')
})

var PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log('Server listening on port', PORT)
})