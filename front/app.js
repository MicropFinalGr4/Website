var canvas = $('#mainCanvas').get(0);
var ctx = canvas.getContext("2d");

var light_green = '#30e849';
var teal = '#30e8bd';
var light_blue = '#30c9e8';
var blue = '#3080e8';
var purple = '#8930e8';
var pink = '#e8308c';
var red = '#e83a30';
var orange = '#eee966';
var yellow = '#e8e230';

var socketHandle = {
	socket : null
};

var colors = [light_green, teal, light_blue, blue, purple, pink, red, orange, yellow];

var CONST = {
	PAD_START_X : (canvas.width / 2) - (50 / 2),
	PAD_START_Y : canvas.height - 20,
	PAD_WIDTH : 75,
	PAD_HEIGHT : 10,
	PAD_SPEED : 0.1,
	PAD_COLOR : '#FFF',
	BALL_RADIUS : 7.5,
	BALL_START_X : (canvas.width / 2) - (5 / 2),
	BALL_START_Y : canvas.height - 75,
	BALL_SPEED : 0.05,
	BALL_COLOR : '#FFF',
	BRICK_WIDTH : 45,
	BRICK_HEIGHT : 15,
	BRICK_PADDING : 10,
	BRICK_CLEAR : 200,
	UPDATE_INTERVAL : 20,
	BRICKS : {
		equivalent_width : 0,
		equivalent_height : 0,
		starting_x : 0,
		starting_y : 0,
		rows_count : 0,
		col_count : 0,
		area_width : 0,
		area_height : 0
	}
};

var game = {};

$( window ).load(function() {
	game = {
		ball : createBall(CONST.BALL_START_X, CONST.BALL_START_Y, CONST.BALL_RADIUS, CONST.BALL_COLOR, CONST.BALL_SPEED),
		bricks : {
			data : generateBricks(CONST.BRICK_WIDTH, CONST.BRICK_HEIGHT, CONST.BRICK_PADDING, CONST.BRICK_CLEAR),
			draw : function(){
				for (var i = 0; i < this.data.length; i++) {
					for (var j = 0; j < this.data[i].length; j++) {
						if (this.data[i][j].alive) this.data[i][j].draw();
					}
				}
			},
			getVicinity : function(pos){
				var vec = pos.clone();

				vec.x -= CONST.BRICKS.starting_x;
				vec.y -= CONST.BRICKS.starting_y;

				vec.x = Math.floor(vec.x / CONST.BRICKS.equivalent_width);
				vec.y = Math.floor(vec.y / CONST.BRICKS.equivalent_height);

				var vicinity_bricks = [];

				for(var k = -1; k < 2; k++){
					var j = vec.y + k;
					for(var l = -1; l < 2; l++){
						var i = vec.x + l;
						if (this.data[j] == undefined) continue;
						if (this.data[j][i] == undefined) continue;
						vicinity_bricks.push(this.data[j][i]);
					}
				}

				return vicinity_bricks;
			}
		},
		pad : createPad(CONST.PAD_START_X, CONST.PAD_START_Y, CONST.PAD_WIDTH, CONST.PAD_HEIGHT, CONST.PAD_COLOR, CONST.PAD_SPEED),
		update : function(delta){
			this.pad.update(delta);
			this.ball.update(delta);
		},
		render : function(){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.bricks.draw();
			this.ball.draw();
			this.pad.draw();
		}
	}

	var gameloop = function(delta) {
		game.update(delta);
		game.render();
	}

	initSocket();

	setInterval(function(){gameloop(CONST.UPDATE_INTERVAL)}, 10);
});

$( document ).keydown(function(event) {
	if (event.which == 39) { // right
		game.pad.setRight();
	} else if (event.which == 37) { // left
		game.pad.setLeft();
	}
});

$( document ).keyup(function(event) {
	if (event.which == 39 || event.which == 37) { // right
		game.pad.setStill();
	}
});


function generateBricks(width, height, padding, clear){
	var num_rows = Math.floor((canvas.width - padding) / (width + padding));
	var row_offset = (canvas.width - ((num_rows * (width + padding)) + padding)) / 2;
	var num_cols = Math.floor((canvas.height - clear) / (height + padding));

	CONST.BRICKS.equivalent_width = width + padding;
	CONST.BRICKS.equivalent_height = height + padding;
	CONST.BRICKS.starting_x = row_offset + (padding / 2);
	CONST.BRICKS.starting_y = padding / 2;
	CONST.BRICKS.rows_count = num_rows;
	CONST.BRICKS.col_count = num_cols;
	CONST.BRICKS.area_width = num_cols * CONST.BRICKS.equivalent_width;
	CONST.BRICKS.area_height = num_rows * CONST.BRICKS.equivalent_height;

	var start_vect = createVector(row_offset + padding, padding * 2);

	var bricks = [num_cols];

	for (var i = 0; i < num_cols; i++) {
		var row = [];
		for (var j = 0; j < num_rows; j++) {
			row.push(createBrick(start_vect.x, start_vect.y, width, height, randomColor()));
			start_vect.x += padding + width;
		}
		start_vect.x = row_offset + padding;
		start_vect.y += padding + height;
		bricks.push(row);
	}
	console.log(bricks);
	return bricks;
}

function createVector(start_x, start_y){
	var vector = {
		x : start_x,
		y : start_y,
		normalize : function(){
			var normal = Math.sqrt((this.x * this.x) + (this.y * this.y));
			if (normal == 0) return createVector(0, 0);
			 else return createVector(this.x / normal, this.y / normal);
		},
		mult : function(factor){
			this.x *= factor;
			this.y *= factor;
		},
		add : function(vec){
			this.x += vec.x;
			this.y += vec.y;
		},
		addNew : function(vec){
			var new_vec = createVector(this.x + vec.x, this.y + vec.y);
			return new_vec;
		},
		clone : function(){
			var new_vec = createVector(this.x, this.y);
			return new_vec;
		},
		dist : function(vec){
			return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2));
		},
		distVertLine : function(line_x){
			return Math.abs(this.x - line_x);
		},
		distHorizLine : function(line_y){
			return Math.abs(this.y - line_y);
		}
	}

	return vector;
}

function createPad(start_x, start_y, width, height, color, speed){
	var pad = {
		pos : createVector(start_x, start_y),
		mov : createVector(0, 0),
		width : width,
		height : height,
		color : color,
		speed : speed,
		setLeft : function() {this.mov.x = -1;},
		setRight : function() {this.mov.x = 1;},
		setStill : function() {this.mov.x = 0;},
		update : function(delta){
            if (this.pos.x <= 0 && this.mov.x < 0) return;  
            if ((this.pos.x + this.width) >= canvas.width && this.mov.x > 0) return;  
			var norm_move = this.mov.normalize();
			norm_move.mult(this.speed * delta);
			this.pos.add(norm_move);
		},
		draw : function(){
			drawRect(this.pos.x, this.pos.y, this.width, this.height, this.color);
		},
		getCorners : function(){
			return [this.pos, this.pos.addNew(createVector(this.width, this.height))];
		}
	}

	return pad;
}

function createBall(start_x, start_y, radius, color, speed){
	var ball = {
		pos : createVector(start_x, start_y),
		radius : radius,
		color : color,
		speed : speed,
		mov : createVector(0, 1),
		draw : function(){
			drawCircle(this.pos.x, this.pos.y, this.radius, this.color);
		},
		collidePad : function(pad, new_pos){
			var pad_corners = pad.getCorners();
			if (new_pos.x + (1 * this.radius) > pad_corners[0].x && new_pos.x - (1 * this.radius) < pad_corners[1].x) { //BETWEEN EDGES
				if (new_pos.y + (1 * this.radius) > pad_corners[0].y && new_pos.y - (1 * this.radius) < pad_corners[1].y) { //BETWEEN TOP AND BOTTOM
					this.mov.y = -1;
					this.mov.x = (new_pos.x - ((pad_corners[0].x + pad_corners[1].x) / 2)) / 20;
				}
			}
		},
		collideBrick : function(brick, new_pos){
			if (!brick.alive) return;
			var brick_corners = brick.getCorners();
			
			if (new_pos.x + (1 * this.radius) > brick_corners[0].x && new_pos.x - (1 * this.radius) < brick_corners[1].x) { //BETWEEN EDGES
				if (new_pos.y + (1 * this.radius) > brick_corners[0].y && new_pos.y - (1 * this.radius) < brick_corners[1].y) { //BETWEEN TOP AND BOTTOM
					var mid_x = (brick_corners[0].x + brick_corners[1].x) / 2;
					var mid_y = (brick_corners[0].y + brick_corners[1].y) / 2;

					var ratio_x = Math.abs(new_pos.x - mid_x) / brick.width;
					var ratio_y = Math.abs(new_pos.y - mid_y) / brick.height;

					if (ratio_y <= ratio_x) this.mov.x *= -1;
					else this.mov.y *= -1;
					brick.alive = false;
					return true;
				}
			}

			return false;
		},
		collideWall : function(new_pos){
			if (new_pos.x - this.radius <= 0 || new_pos.x + this.radius >= canvas.width) {this.mov.x *= -1}
			if (new_pos.y - this.radius <= 0 || new_pos.y + this.radius >= canvas.height) {this.mov.y *= -1}
		},
		update : function(delta){
			var norm_move = this.mov.clone();
			norm_move.mult(this.speed * delta);
			var new_pos = this.pos.addNew(norm_move);
			this.collidePad(game.pad, new_pos);
			this.collideWall(new_pos);
			var possible_bricks = game.bricks.getVicinity(this.pos);
			for (var i = 0; i < possible_bricks.length; i++) {
				if (this.collideBrick(possible_bricks[i], new_pos)) break;
			}
			norm_move = this.mov.clone();
			norm_move.mult(this.speed * delta);
			this.pos.add(norm_move);
		}
	}

	return ball;
}

function createBrick(x, y, width, height, color){
	var brick = {
		pos : createVector(x, y),
		width : width,
		height : height,
		color : color,
		alive : true,
		draw : function(){
			drawRect(this.pos.x, this.pos.y, this.width, this.height, this.color);
		},
		getCorners : function(){
			return [this.pos, this.pos.addNew(createVector(this.width, this.height))];
		}
	}

	return brick;
}

function randomColor(){
	var index = Math.floor((Math.random() * colors.length));
	return colors[index];
}

function drawRect(x, y, width, height, color){
	ctx.beginPath();
	ctx.rect(x, y, width, height);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.closePath();
}

function drawCircle(x, y, radius, color){
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI*2, false);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.closePath();
}

var local = false;
function initSocket() {
	if (local) socketHandle.socket = io.connect("http://192.168.0.173:8000");
	else socketHandle.socket = io.connect("159.203.32.219:8000");

	socketHandle.socket.on("angle_update", function(data){
		if (data == 0) {game.pad.setStill();}
		else if (data < 0) {game.pad.setLeft();}
		else if (data > 0) {game.pad.setRight();}
	});
}