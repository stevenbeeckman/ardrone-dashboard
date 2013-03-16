var mongoose = require('mongoose');

var schemaHeader = new mongoose.Schema({
	rawData: {}
});

exports.Header = function(db) {
	return db.model('Header', schemaHeader);
}