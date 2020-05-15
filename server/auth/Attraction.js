var mongoose = require('mongoose');

// Attraction Schema
var AttractionSchema = mongoose.Schema({
	json: String,
	id: String
});

var Attraction = module.exports = mongoose.model('Attraction', AttractionSchema); 