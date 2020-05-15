var express = require('express');
var router = express.Router();
var request = require('request');


const Attraction = require('./auth/Attraction');
const User = require('./auth/User');

router.get('/', loggedIn, (req, res) => {
    res.render('home')
})
router.get('/dest/', loggedIn, (req, res) => {
    res.redirect('/dest/none')
}) 

router.get('/saved', loggedIn, (req, res) => {
    User.findById(req.user._id).populate('attractions').exec((err, populated) => {
        res.render('savedLocations',{
            data: populated
        })
    })
}) 

router.get('/delete/:attr_id', loggedIn, (req, res) => {
    // Attraction.findOne({id: req.params.attr_id}, (err, done) => {
        // req.user.attractions.splice(req.user.attractions.indexOf(done._id), 1);
        // req.user.attractions.forEach(a => {
        //     console.log(a, req.params.attr_id)
        //     console.log(a.equals(req.params.attr_id))
        // })
        req.user.attractions = req.user.attractions.filter(e => ! e.equals(req.params.attr_id));
        req.user.save();
        res.redirect('/saved')
    // })
})

router.get('/dest/:location/', loggedIn, (req, res) => {
    res.redirect(`/dest/${req.params.location}/general`)
})

router.get('/dest/:location/:tag', loggedIn, (req, res) => {
    var location = req.params.location;
    var tag = req.params.tag;
    console.log('Servicing location', location);

    // Copying Evans Code Here
    var city = location
    if(city == "none") {
        city = 'paris'
    }
    var tagMatches = {
        "food": "food",
        "entertainment": "arts",
        "outdoors": "active",
        "hotels": "hotels"
    }

    var optStr = ""
    var byTagKey = "general";
    if(tag.toLowerCase() in tagMatches) {
        optStr = `&categories=${tagMatches[tag.toLowerCase()]}`
        byTagKey = tagMatches[tag.toLowerCase()]
    }

    // Copying Evans Code Here
    var city = location
    if(city == "none") {
        city = 'paris'
    }

	var options = {
        'method': 'GET',
        'url': `https://api.yelp.com/v3/businesses/search?location=${city}&radius${optStr}`,
        // 'url': 'https://api.yelp.com/v3/businesses/search?location='+city+'&radius',
        'headers': {
        'Authorization': 'Bearer ' + process.env.YELP_TOKEN
        }
    };
    
    console.log("...")
    console.log(options)
    console.log(optStr)

	request(options, function (error, response) { 
    if (error) throw new Error(error);


        var attractionData = JSON.parse(response.body);

        if(attractionData.businesses == undefined || attractionData.businesses.length == 0) {
            attractionData = null;
        }
        // console.log(attractionData, JSON.stringify(attractionData.businesses[0]));

        var weatherOptions = {
            'method': 'GET',
            'url': `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=`+ process.env.WEATHER_TOKEN,
            'headers': {
            }
        };
        request(weatherOptions, function (error, response) { 
            if (error)  {
                throw new Error(error);
            }

            var weatherData = JSON.parse(response.body);
            
            // console.log(weatherData)

            // console.log(response.body);
            var currencyOptions = {
                'method': 'GET',
                'url': 'https://api.exchangeratesapi.io/latest?base=USD&symbols=GBP,JPY',
                'headers': {
                  'Cookie': '__cfduid=d6ef343fb05cf5c2d6b6a739837f4350c1585857127'
                }
            };
            request(currencyOptions, function (error, response) { 
                if (error)  {
                    throw new Error(error);
                }
                var currencyData = JSON.parse(response.body);

                res.render('attractions',{
                    userid: req.user._id,
                    weatherData,
                    data: attractionData,
                    currencyData: JSON.parse(response.body),
                    location,
                    byTagKey
                });
            });
        });
	});
})

router.get('/weather', (req, res) => {
    var request = require('request');
    var options = {
      'method': 'GET',
      'url': 'https://api.openweathermap.org/data/2.5/forecast?q=London&appid=' + process.env.WEATHER_TOKEN,
      'headers': {
      }
    };
    request(options, function (error, response) { 
      if (error) throw new Error(error);
      console.log(response.body);
      res.render('weather',{
        data: JSON.parse(response.body),
      })
    });
})
    
router.get('/currency', (req, res) => {
    var request = require('request');
    var options = {
      'method': 'GET',
      'url': 'https://api.exchangeratesapi.io/latest?base=USD&symbols=GBP,JPY',
      'headers': {
        'Cookie': '__cfduid=d6ef343fb05cf5c2d6b6a739837f4350c1585857127'
      }
    };
    request(options, function (error, response) { 
      if (error) throw new Error(error);
      console.log(response.body);
      res.render('currency',{
        data: JSON.parse(response.body),
      })
    });
    
})

router.get('/posts/attraction',async (req, res) =>{
    try{
        const posts = await Attraction.find();
        res.json(posts);
    }catch(err){
        res.json({message:err});
    }
});
// POSTS 
    // json: String ,
    // id: String
router.post('/posts/attraction',async (req, res) =>{
    const attraction = new Attraction({
        id: req.body.id,
        json: req.body.json
    });
    try{
       const savedAttraction = await attraction.save();
       res.json(savedAttraction);
    }
    catch(err){
        res.json({ message: err });
    }
});

// get show details of an attraction based on id 
router.get("/posts/attraction/:id", async (req, res) => {
    try{
        const post = await Attraction.findOne({ id: req.params.id });
        res.json(post);
    }
    catch(err){
        console.log("Attraction id caught");
        res.json({message: err});
    }
  
})

// API Call to add an attraction to a user
router.post('/posts/user/create/:id/', loggedIn , (req, res) =>{
    Attraction.create(req.body,(err,done) => {
        req.user.attractions.push(done);
        req.user.save();
        console.log('> post new location >', req.user)
        console.log("location succesfully created");
        res.sendStatus(200);
    })   
});

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        req.flash('error_msg', 'An account is required to access this page.');
        res.redirect('/u/login');
    }
}



module.exports = router;