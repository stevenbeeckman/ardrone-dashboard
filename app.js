var express = require('express')
	, path = require('path')
	, routes = require('./routes')
	, http = require('http')
	, mongoose = require('mongoose')
	, db
	, passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy
	, server
	, io = require('socket.io')
	, altitude
	, heading
	, speed
	, throttle_vertical
	, throttle_horizontal
	, battery
	, header
	, gate_counter;

var app = express();
var MongoStore = require('connect-mongo')(express); // persistent sessions

setupApp();

function setupApp(){
	gate_counter = 0;
	app.configure(function(){
		app.set('port', process.env.PORT || 3000);
		app.set('views', __dirname + '/views');
		app.set('view engine', 'ejs');
		app.use(express.favicon());
		app.use(express.static(path.join(__dirname, 'public')));
		app.use(express.logger('dev'));
		app.use(express.cookieParser());
		app.use(express.bodyParser());
		app.use(express.methodOverride());
	});

	app.configure('development', function(){
		app.use(express.errorHandler());
		app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
		app.set('db-uri', 'localhost:27017/rtdashboard');
	});

	db = mongoose.createConnection(app.set('db-uri'));
	db.on('error', console.error.bind(console, 'Connection error:'));

	db.once('open', function(){
		console.log("Connected to database");
		//express session stuff
		//passport stuff

		app.use(app.router);

		//get models
		header = require('./models/header').Header(db);

		setupRoutes();
		startServer();
	});
}

function setupRoutes(){
	app.get('/', routes.index);


	app.post('/api/raw', /*passTheGate,*/ addDb, addAltitude, addSpeed, addHeading, addThrottleVertical, addThrottleHorizontal, addBattery, routes.raw);
	app.post('/api/altitude', addAltitude, routes.altitude);
	app.post('/api/speed', addSpeed, routes.speed);
	app.post('/api/heading', addHeading, routes.heading);
	app.post('/api/throttle', addThrottleVertical, routes.throttle);

	app.get('*', function(req, res){
		console.log("Page not found: " + req.originalUrl);
		res.render('404');
	});
}

function passTheGate(req, res, next){
	console.log("Gate: " + gate_counter);
	gate_counter = gate_counter + 1;
	if(gate_counter > 10){
		gate_counter = 0;
		next();
	}
}

function addDb(req, res, next){
	req.db = db;
	next();
}

function addAltitude(req, res, next){
	req.altitude = altitude;
	next();
}

function addSpeed(req, res, next){
	req.speed = speed;
	next();
}

function addHeading(req, res, next){
	req.heading = heading;
	next();
}

function addThrottleVertical(req, res, next){
	req.throttle_vertical = throttle_vertical;
	next();
}

function addThrottleHorizontal(req, res, next){
	req.throttle_horizontal = throttle_horizontal;
	next();
}

function addBattery(req, res, next){
	req.battery = battery;
	next();
}

function addSocketIO(req, res, next){
	next();
}

function startServer(){
	server = http.createServer(app);
	io = io.listen(server);

	server.listen(app.get('port'), function(){
		console.log("Express server started.");
	});

	// get the namespaces going
	altitude = io.of('/altitude');
	speed = io.of('/speed');
	heading = io.of('/heading');
	throttle_vertical = io.of('/throttle_vertical');
	throttle_horizontal = io.of('/throttle_horizontal');
	battery = io.of('/battery');
}