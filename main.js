//mouse position
var mouseX, mouseY;
$(document).mousemove(function(event) {
	mouseX = event.pageX - 7;
	mouseY = event.pageY - 7;
});

//initialize
const INF = 2147483647;                          // infinity
var ran = 0;                                     // random number 0~1
var score = 0;                                   // score
var money = 1000;                                // money
var hp = 100;                                    // health point
var pause = false;                               // pause
var intervalID;                                  // draw function interval
var count = 0;                                   // counting
var sec = 0;                                     // second
var DTI = -1;                                    // drawing tower index
var evolution = {todo: false, evn: 0, idx: DTI}; // evolution
var enemies = [];                                // enemies  array
var towers = [];                                 // towers   array
var bullets = [];                                // bullets  array (enemy)
var missiles = [];                               // missiles array (tower)
var bombs = [];                                  // bombs    array (missile)
var map = [];                                    // map 2D
var drc = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}]; // direction
var bfsPath = [];                                // BFS shortest path
var nowTower = "";                               // nowTower
for (var i = 0; i < 25; i++) {
	map[i] = new Array(25);
	bfsPath[i] = new Array(25);
}
for (var i = 0; i < 25; i++) {
	for (var j = 0; j < 25; j++) {
		map[i][j] = -1;
		bfsPath[i][j] = -1;
	}
}
// img
var ctx;                           // canvas context
var img_medal = new Image();
img_medal.src = "img_medal.png";   // medal
var img_health = new Image();
img_health.src = "img_health.png"; // health
var img_money = new Image();
img_money.src = "img_money.png";   // money
var img_coin = new Image();
img_coin.src = "img_coin.png";     // coin
var img_delete = new Image();
img_delete.src = "img_delete.png"; // delete
var img_cross = new Image();
img_cross.src = "img_cross.png";   // cross

function dis(x1, y1, x2, y2) { //distance
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function min(a, b) {
	return a < b ? a : b;
}

function Queue() { // queue STL inplementation
	let items = [];
	let now = 0;
	this.push = function(element) {
		items.push(element);
	};
	this.pop = function() {
		now++;
	};
	this.front = function() {
		return items[now];
	};
	this.size = function() {
		return items.length - now;
	};
}

function draw() { // main function
	ran = Math.random(); // random update
	if (count % 60 == 0) sec++;
	if (pause == false) {
		drawMain();
		enemy();
		tower();
		bullet();
		missile();
		bomb();
		drawInfo();
		count++;
	}
	if (hp <= 0) {
		clearInterval(intervalID);
		//gameover();
	}
}

function isInMap(x, y) {
	if (x >= 0 && x < 25 && y >= 0 && y < 25) return true;
	return false;
}

function pathBFS() {
	const queue = new Queue();
	for (var i = 0; i < 25; i++) {
		for (var j = 0; j < 25; j++) {
			bfsPath[i][j] = -1;
		}
	}
	queue.push({x: 24, y: 24, s: 0});
	while (queue.size() > 0) {
		var x = queue.front().x, y = queue.front().y;
		var tmp = queue.front();
		queue.pop();
		tmp.s++;
		bfsPath[x][y] = tmp.s;
		for (var i = 0; i < 4; i++) {
			tmp.x = tmp.x+drc[i].x;
			tmp.y = tmp.y+drc[i].y;
			if (isInMap(tmp.x, tmp.y) && map[tmp.x][tmp.y] == -1) {
				if (bfsPath[tmp.x][tmp.y] == -1) {
					queue.push({x: tmp.x, y: tmp.y, s: tmp.s});
					bfsPath[tmp.x][tmp.y] = 0;
				}
			}
			tmp.x = tmp.x-drc[i].x;
			tmp.y = tmp.y-drc[i].y;
		}
	}
}

function drawMain() {
	// main map
	ctx.clearRect(0, 0, 1000, 800);
	ctx.fillStyle = "rgb(245, 245, 245)";
	ctx.fillRect(0, 0, 1000, 800);
	ctx.strokeStyle = "rgb(180, 180, 180)";
	ctx.strokeRect(0, 0, 1000, 800);
	ctx.strokeRect(800, 0, 200, 800);
	for (var i = 0; i < 25; i++) {
		for (var j = 0; j < 25; j++) {
			ctx.strokeRect(i * 32, j * 32, 32, 32);
		}
	}
	// onMouse
	if (mouseX < 800 && mouseY < 800 && mouseX >= 0 && mouseY >= 0) {
		if (map[Math.floor(mouseX / 32)][Math.floor(mouseY / 32)] == -1) {
			ctx.fillStyle = "rgb(200, 200, 200)";
			ctx.fillRect(Math.floor(mouseX / 32) * 32 + 1, Math.floor(mouseY / 32) * 32 + 1, 30, 30);
		}
	}
	// end
	for (var i = 15; i >= 1; i--) {
		ctx.fillStyle = "rgb("+(255-i*5)+", 240, "+(255-i*15)+")";
		ctx.fillRect(784-i, 784-i, i*2, i*2);
	}
}

function Enemy(enemyType, x, y) {
	//level & type
	this.lvl = Math.floor(Math.pow(score, 0.7)) + 1;
	this.typ = enemyType;
	this.spd = 1;
	this.fze = 0;
	//position
	this.x = x;
	this.y = y;
	// move direction
	if (this.typ == "minion") { // for minion
		this.drc = {x: (y%32 == 16), y: (y%32 != 16)};
	} else {                    // for others
		this.drc = {x: (ran > 0.5), y: (ran <= 0.5)};
	}
	this.move = function() {
		var X = (this.x - 16) / 32, Y = (this.y - 16) / 32;
		// change drc
		if ((Math.ceil(X) - X < this.stp/32 && Math.ceil(Y) - Y < this.stp/32 && (this.drc.x == 1 || this.drc.y == 1))
		 || (X -Math.floor(X) < this.stp/32 && Y -Math.floor(Y) < this.stp/32 && (this.drc.x ==-1 || this.drc.y ==-1))) {
			if (this.drc.x == 1 || this.drc.y == 1) X =  Math.ceil(X), Y =  Math.ceil(Y);
			if (this.drc.x ==-1 || this.drc.y ==-1) X = Math.floor(X), Y = Math.floor(Y);
			this.x = X * 32 + 16;
			this.y = Y * 32 + 16;
			// (X, Y) influence
			var m = Math.floor((ran*2+(X>Y)*0.5)/1.25)*2, k = INF;
			for (var i = 0; i < 4; i++) {
				if (isInMap(X+drc[i].x, Y+drc[i].y) && bfsPath[X+drc[i].x][Y+drc[i].y] != -1 && map[X+drc[i].x][Y+drc[i].y] == -1) {
					k = min(bfsPath[X+drc[i].x][Y+drc[i].y], k);
				}
			}
			for (var i = 0; i < 4; i++) {
				if (isInMap(X+drc[(i+m)%4].x, Y+drc[(i+m)%4].y) && bfsPath[X+drc[(i+m)%4].x][Y+drc[(i+m)%4].y] == k && map[X+drc[(i+m)%4].x][Y+drc[(i+m)%4].y] == -1) {
					this.drc = drc[(i+m)%4];
				}
			}
			// for soldier
			if (this.typ == "soldier") {
				if (isInMap(X+0, Y+1) && ran >= 0.5) this.drc = {x: 0, y: 1};
				else if (isInMap(X+1, 0)) this.drc = {x: 1, y: 0};
				else this.drc = {x: 0, y: 1};
			}
		}
		// for soldier
		if (this.typ == "soldier" && this.stp == 0) {
			this.stp = 2;
		}
		if (isInMap(X+this.drc.x, Y+this.drc.y) && this.typ == "soldier"
		 && this.x%32 == 16 && this.y%32 == 16 && map[X+this.drc.x][Y+this.drc.y] != -1) {
			if (ran > 0.9) {
				this.atk(map[X+this.drc.x][Y+this.drc.y]);
			}
			this.stp = 0;
		}
		//for freeze
		if (this.fze > 0) {
			this.spd = 0.5;
			this.fze--;
		}
		// move
		this.x = this.x + this.drc.x * this.stp * this.spd;
		this.y = this.y + this.drc.y * this.stp * this.spd;
		this.spd = 1;
		// for split
		if (this.typ == "splitter" && Math.random() > 0.995) this.split();
	}
	switch (this.typ) {
		case "simple":
			this.clr = "rgb(255, 255, 255)";     // color
			this.sze = 5;                        // size
			this.stp = 2;                        // step
			this.hp = this.hpMax = 100*this.lvl; // health point
			break;
		case "speedy":
		    this.clr = "rgb(255, 192, 255)";
		    this.sze = 4;
			this.stp = 4;
			this.hp = this.hpMax = 50*this.lvl;
			break;
		case "meat":
			this.clr = "rgb(255, 255, 192)";
		    this.sze = 7;
		    this.stp = 1;
		    this.hp = this.hpMax = 200*this.lvl;
			break;
		case "splitter":
			this.clr = "rgb(192, 255, 192)";
			this.sze = 5;
			this.stp = 2;
			this.hp = this.hpMax = 100*this.lvl;
			this.split = function() {
				enemies.push(new Enemy("minion", this.x, this.y));
			}
			break;
		case "minion":
			this.clr = "rgb(192, 192, 192)";
			this.sze = 4;
			this.stp = 1;
			this.hp = this.hpMax = 50*this.lvl;
			break;
		case "soldier":
		    this.clr = "rgb(255, 192, 192)";
		    this.sze = 4;
		    this.stp = 2;
		    this.hp = this.hpMax = 50*this.lvl;
		    this.atk = function(towerIdx) { // attack
				bullets.push(new Bullet("simple", this.x, this.y, 5, towers[towerIdx]));
		    }
		    break;
	}
}

function enemy() {
	if (count % 75 == 0 && sec > 5) { // enemy appr delay
		var m = Math.ceil(ran * 500);
		if (m % 5 == 1) {
			enemies.push(new Enemy("simple", 16, 16));
		} else if (m % 5 == 2) {
			enemies.push(new Enemy("speedy", 16, 16));
		} else if (m % 5 == 3) {
			enemies.push(new Enemy("meat", 16, 16));
		} else if (m % 5 == 4) {
			enemies.push(new Enemy("splitter", 16, 16));
		} else {
			enemies.push(new Enemy("soldier", 16, 16));
		}
	}
	// enemy reach end
	for (var i = 0; i < enemies.length; i++) {
		if (Math.abs(enemies[i].x-784) < 5 && Math.abs(enemies[i].y-784) < 5) {
			enemies.splice(i, 1); // delete enemy
			hp--;
		}
		if (count % 2) enemies[i].move();
	}
	// kill enemy
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].hp <= 0) {
			score += enemies[i].lvl;
			money += 5;
			enemies.splice(i, 1); // delete enemy
		}
	}
	for (var i = 0; i < enemies.length; i++) {
		drawEnemy(enemies[i]);
	}
}

function Bullet(bulletType, x, y, str, targetObj) {
	this.x = x;
	this.y = y;
	this.dis = dis(x, y, targetObj.x, targetObj.y);
	this.drc = {x: (targetObj.x-this.x)/this.dis, y: (targetObj.y-this.y)/this.dis};
	this.stp = 1;
	this.typ = bulletType;
	this.str = str; // strength
	this.targetObj = targetObj;
	this.move = function() {
		this.x += this.drc.x * this.stp;
		this.y += this.drc.y * this.stp;
		this.dis = dis(this.x, this.y, this.targetObj.x, this.targetObj.y);
		ctx.beginPath();
		ctx.fillStyle = "rgb(255, 0, 64)";
		ctx.arc(this.x, this.y, 2, 0, 2*Math.PI, 0);
		ctx.fill();
		ctx.closePath();
	}
}

function bullet() {
	for (var i = 0; i < bullets.length; i++) {
		bullets[i].move();
		// tower disappear
		if (map[(bullets[i].targetObj.x-16)/32][(bullets[i].targetObj.y-16)/32] == -1) {
			bullets.splice(i, 1);
			continue;
		}
		// attack tower
		if (bullets[i].dis <= 2) {
			var towerIdx = map[(bullets[i].targetObj.x-16)/32][(bullets[i].targetObj.y-16)/32];
			towers[towerIdx].hp = towers[towerIdx].hp - bullets[i].str;
			if (towers[towerIdx].hp <= 0) {
				map[(bullets[i].targetObj.x-16)/32][(bullets[i].targetObj.y-16)/32] = -1;
				if (DTI == towerIdx) DTI = -1;
				towers.splice(towerIdx, 1);
				for (var i = 0; i < 25; i++) {
					for (var j = 0; j < 25; j++) {
						if (map[i][j] > towerIdx) map[i][j]--;
					}
				}
				if (DTI > towerIdx) DTI--;
			}
			bullets.splice(i, 1);
			pathBFS(); // reBFS
		}
	}
}

function drawEnemy(enemyObj) {
	// freeze
	if (enemyObj.fze > 0) {
	    ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.fillRect(enemyObj.x - (enemyObj.sze+4), enemyObj.y - (enemyObj.sze+4), enemyObj.sze*2+8, enemyObj.sze*2+8);
		ctx.fillStyle = "rgba(0, 229, 230, 0.9)";
		ctx.fillRect(enemyObj.x - (enemyObj.sze+3), enemyObj.y - (enemyObj.sze+3), enemyObj.sze*2+6, enemyObj.sze*2+6);
	}
	// enemy
	ctx.fillStyle = enemyObj.clr;
	ctx.strokeStyle = "rgb(0, 0, 0)";
	ctx.fillRect(enemyObj.x - enemyObj.sze, enemyObj.y - enemyObj.sze, enemyObj.sze*2, enemyObj.sze*2);
	ctx.strokeRect(enemyObj.x - (enemyObj.sze+1), enemyObj.y - (enemyObj.sze+1), enemyObj.sze*2+2, enemyObj.sze*2+2);
	// health point
	ctx.fillStyle = "rgb(64, 255, 32)";
	ctx.fillRect(enemyObj.x - 2*enemyObj.sze, enemyObj.y + enemyObj.sze+4, enemyObj.hp/enemyObj.hpMax*4*enemyObj.sze, 3);
}

function Tower(towerType, x, y, lvl) {
	// position
	this.x = this.tmpX = x * 32 + 16;
	this.y = this.tmpY = y * 32 + 16;
	// level & type
	this.lvl = lvl;
	this.typ = towerType;
	this.hp = this.hpMax = 500;
	this.upgrade = function() {}
	// attack
	this.rge = 0;
	this.atk = 0;
	this.noAtk = [];
	this.func = function() {}
	// specific
	this.atkEmy = {p: -1, dis: 0};
	var tmp;
	this.aim = function() {
		// tmp : minDis
		for (var i = 0; i < enemies.length; i++) {
			var tf = 1;
			tmp = dis(this.tmpX, this.tmpY, enemies[i].x, enemies[i].y);
			for (var j = 0; j < this.noAtk.length; j++) {
				if (this.noAtk[j] == i) tf = 0;
			}
			if (tf && tmp < this.rge && (this.atkEmy.p == -1 || tmp < this.atkEmy.dis)) {
				this.atkEmy.p = i;
				this.atkEmy.dis = tmp;
			}
		}
	}
	switch (this.typ) {
		case "Laser":
			this.moneyCost = 50;
			this.rge       = 80;
			this.atk       = 6;
			this.func = function() {
				this.atkEmy = {p: -1, dis: 0};
				this.aim();
				if (this.atkEmy.p != -1) {
					ctx.beginPath();
					ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
					ctx.moveTo(this.x+(enemies[this.atkEmy.p].x-this.x)*13/this.atkEmy.dis
						     , this.y+(enemies[this.atkEmy.p].y-this.y)*13/this.atkEmy.dis);
				    ctx.lineTo(enemies[this.atkEmy.p].x, enemies[this.atkEmy.p].y);
				    ctx.stroke();
				    ctx.closePath();
				    enemies[this.atkEmy.p].hp -= this.atk;
				}
			}
			this.upgrade = function() {
				this.hp    += 10;
				this.hpMax += 10;
				this.atk   += 2.4;
			}
			this.evn = ["Lightning"]; // evolution
			break;
		case "Radiation":
			this.moneyCost = 50;
			this.rge       = 132;
			this.nowRge    = 16;
			this.atk       = 6;
			this.func = function() {
				ctx.beginPath();
				for (var i = 0;i < enemies.length; i++) {
					if (dis(this.x, this.y, enemies[i].x, enemies[i].y) <= this.nowRge) {
						enemies[i].hp -= this.atk;
					}
				}
				ctx.strokeStyle = "rgba(128, 0, 255, 0.6)";
				ctx.fillStyle = "rgba(128, 0, 255, 0.1)";
				ctx.arc(this.x, this.y, this.nowRge, 0, 2*Math.PI, 0);
				ctx.stroke();
				ctx.fill();
				ctx.closePath();
				if (count % 3 != 0) this.nowRge++;
				if (this.nowRge >= this.rge) this.nowRge = 16;
			}
			this.upgrade = function() {
				this.hp    += 10;
				this.hpMax += 10;
				this.atk   += 4;
			}
			this.evn = ["Freeze"];
			break;
		case "Shotgun":
			this.moneyCost = 50;
			this.rge       = 160;
			this.atk       = 600;
			this.func = function() {
				this.atkEmy = {p: -1, dis: 0};
				this.aim();
				if (this.atkEmy.p != -1 && count % 50 == 0) {
					missiles.push(new Missile("simple", this.x, this.y, this.atk));
				}
			}
			this.upgrade = function() {
				this.hp    += 10;
				this.hpMax += 10;
				this.atk   += 240;
			}
			this.evn = ["Bomb"];
			break;
		case "Stone":
			this.moneyCost  = 10;
			this.upgrade = function() {
				this.hp    += 40;
				this.hpMax += 40;
			}
			this.evn = ["Money"];
			break;
		case "Freeze":
			this.moneyCost = 25;
			this.rge       = 48;
			this.nowRge    = 16;
			this.fzeMax    = 100;
			this.func = function() {
				ctx.beginPath();
				for (var i = 0;i < enemies.length; i++) {
					if (dis(this.x, this.y, enemies[i].x, enemies[i].y) <= this.nowRge) {
						enemies[i].fze = this.fzeMax;
					}
				}
				ctx.strokeStyle = "rgba(0, 229, 230, 0.6)";
				ctx.arc(this.x, this.y, this.nowRge, 0, 2*Math.PI, 0);
				ctx.stroke();
				ctx.closePath();
				if (count % 3 != 0) this.nowRge++;
				if (this.nowRge >= this.rge) this.nowRge = 16;
			}
			this.upgrade = function() {
				this.hp     += 10;
				this.hpMax  += 30;
				this.fzeMax += 30;
			}
			this.evn = [];
			break;
		case "Money":
			this.moneyCost = 25;
			this.addCoin   = 120;
			this.coinAppr  = 0;
			this.upgrade = function() {
				this.hp    += 10;
				this.hpMax += 10;
			}
			this.func = function() {
				if (this.addCoin > 0) {
					this.addCoin -= this.lvl*0.01+1;
				} else {
					this.coinAppr = 15;
					money        += 1;
					this.addCoin  = 60;
				}
				if (this.coinAppr > 0) {
					ctx.drawImage(img_coin, this.x-2, this.y-16, 15, 15);
					ctx.font = "6pt caption";
					ctx.fillText("$", this.x+6.2, this.y-5.8);
					this.coinAppr--;
				}
			}
			this.evn = [];
			break;
		case "Lightning":
			var tmpX, tmpY;
			this.moneyCost = 25;
			this.rge       = 112;
			this.atk       = 6;
			this.func = function() {
				this.atkEmy = {p: -1, dis: 0};
				this.aim();
				if (this.atkEmy.p != -1) {
					ctx.beginPath();
					ctx.strokeStyle = "rgba(0, 0, 199, 0.6)";
					ctx.moveTo(this.tmpX+(enemies[this.atkEmy.p].x-this.tmpX)*13/this.atkEmy.dis
						     , this.tmpY+(enemies[this.atkEmy.p].y-this.tmpY)*13/this.atkEmy.dis);
					for (var i = 0; i < 3 && this.atkEmy.p != -1; i++) {
					    ctx.lineTo(enemies[this.atkEmy.p].x, enemies[this.atkEmy.p].y);
					    this.tmpX = enemies[this.atkEmy.p].x, this.tmpY = enemies[this.atkEmy.p].y;
					    this.noAtk[i] = this.atkEmy.p;
				    	enemies[this.atkEmy.p].hp -= this.atk;
					    this.atkEmy.p = -1;
					    this.aim();
					}
					ctx.stroke();
				    ctx.closePath();
				    this.tmpX = this.x;
				    this.tmpY = this.y;
				    this.noAtk = [];
				}
			}
			this.upgrade = function() {
				this.hp    += 10;
				this.hpMax += 10;
				this.atk   += 2.4;
			}
			this.evn = [];
			break;
		case "Bomb":
			this.moneyCost = 25;
			this.rge       = 160;
			this.atk       = 30;
			this.func = function() {
				this.atkEmy = {p: -1, dis: 0};
				this.aim();
				if (this.atkEmy.p != -1 && count % 50 == 0) {
					missiles.push(new Missile("bomb", this.x, this.y, this.atk));
				}
			}
			this.upgrade = function() {
				this.hp    += 10;
				this.hpMax += 10;
				this.atk   += 20;
			}
			this.evn = [];
			break;
	}
}

function tower() {
	for (var i = 0; i < towers.length; i++) {
		drawTower(towers[i].typ, towers[i].x, towers[i].y);
		drawTowerHp(towers[i].typ, towers[i].x, towers[i].y, towers[i].hp, towers[i].hpMax);
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "10pt caption";
		ctx.textAlign = "center";
		ctx.fillText(towers[i].lvl, towers[i].x, towers[i].y+4);
	}
	for (var i = 0; i < towers.length; i++) {
		towers[i].func();
	}
	if (evolution.todo == true) {
		evolution.todo = false;
		towers[evolution.idx] = new Tower(towers[evolution.idx].evn[evolution.evn]
			, (towers[evolution.idx].x-16)/32, (towers[evolution.idx].y-16)/32, towers[evolution.idx].lvl);
	}
}

function drawTower(towerType, x, y) {
	if (towerType == "") return;
	ctx.beginPath();
	ctxStyle(towerType, 1);
	ctx.arc(x, y, 13, 0, 2*Math.PI, 0);
	ctx.fill();
	ctx.closePath();
	drawTowerHp(towerType, x, y, 1, 1);
}

function drawTowerHp(towerType, x, y, hp, hpMax) {
	ctx.beginPath();
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.arc(x, y, 10, 0, 2*Math.PI, 0);
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctxStyle(towerType, 0.5);
	if (hp == hpMax) {
		ctx.arc(x, y, 10, 0, 2*Math.PI, 1);
	} else {
		var k = Math.asin(hp/hpMax*2-1);
		ctx.arc(x, y, 10, 1*Math.PI+k, 2*Math.PI-k, 1);
	}
	ctx.fill();
	ctx.closePath();
}

function drawTowerRange(towerType, x, y, rge) {
	if (towerType == "") return;
	ctx.beginPath();
	ctxStyle(towerType, 0.08);
	ctx.arc(x, y, rge, 0, 2*Math.PI, 0);
	ctx.fill();
	ctx.closePath();
}

function Missile(missileType, x, y, atk) {
	this.x = x;
	this.y = y;
	this.drc = {x: 0, y: 0};
	this.stp = 1;
	this.typ = missileType;
	this.atk = atk;
	this.atkEmy = {p: -1, dis: 0};
	var tmp, c;
	this.aim = function() {
		// tmp = minDis
		this.atkEmy.p = -1;
		for (var i = 0; i < enemies.length; i++) {
			tmp = dis(this.x, this.y, enemies[i].x, enemies[i].y);
			if (this.atkEmy.p == -1 || tmp < this.atkEmy.dis) {
				this.atkEmy.p = i;
				this.atkEmy.dis = tmp;
			}
		}
		if (this.atkEmy.p != -1) {
			this.drc = {x: (enemies[this.atkEmy.p].x-this.x)/this.atkEmy.dis, y: (enemies[this.atkEmy.p].y-this.y)/this.atkEmy.dis};
		}
	}
	this.move = function() {
		this.x = this.x + this.stp * this.drc.x;
		this.y = this.y + this.stp * this.drc.y;
		if (this.atkEmy.dis < 2) {
			if (this.typ == "bomb") {
				bombs.push(new Bomb(this.x, this.y, this.atk));
			} else {
				enemies[this.atkEmy.p].hp -= this.atk;
			}
			this.atkEmy.p = -1;
		}
		if (this.stp <= 3) this.stp += 0.05;
	}
}

function missile() {
	for (var i = 0; i < missiles.length; i++) {
		missiles[i].aim();
		if (missiles[i].atkEmy.p == -1) {
			missiles.splice(i, 1);
		} else {
			missiles[i].move();
			if (missiles[i].atkEmy.p == -1) {
				missiles.splice(i, 1);
			}
		}
	}
	for (var i = 0; i < missiles.length; i++) {
		drawMissile(missiles[i].typ, missiles[i].x, missiles[i].y);
	}
}

function drawMissile(missileType, x, y) {
	ctx.beginPath();
	if (missileType == "simple") ctx.fillStyle = "rgb(91, 91, 174)";
	if (missileType == "bomb")  ctx.fillStyle = "rgb(200, 91, 0)";
	ctx.arc(x, y, 2, 0, 2*Math.PI, 0);
	ctx.fill();
	ctx.closePath();
}

function Bomb(x, y, atk) {
	this.x = x;
	this.y = y;
	this.atk = atk;
	this.nowRge = 16;
	this.rge = 48;
	this.func = function() {
		for (var i = 0;i < enemies.length; i++) {
			if (dis(this.x, this.y, enemies[i].x, enemies[i].y) <= this.nowRge) {
				enemies[i].hp -= this.atk;
			}
		}
		for (var i = this.nowRge; i > 0; i--) {
			ctx.beginPath();
			ctx.fillStyle = "rgba(255, "+(255-i*5)+", 0, 0.3)";
			ctx.arc(this.x, this.y, i, 0, 2*Math.PI, 0);
			ctx.fill();
			ctx.closePath();
		}
		this.nowRge += 3;
	}
}

function bomb() {
	for (var i = 0; i < bombs.length; i++) {
		bombs[i].func();
	}
	for (var i = 0; i < bombs.length; i++) {
		if (bombs[i].nowRge >= bombs[i].rge) {
			bombs.splice(i, 1);
		}
	}
}

function drawInfo() {
	if (DTI != -1) {
		drawTowerRange(towers[DTI].typ, towers[DTI].x, towers[DTI].y, towers[DTI].rge);
	}
	ctx.beginPath();
	ctx.fillStyle = "rgb(245, 245, 245)";
	ctx.fillRect(801, 0, 199, 800);
	ctx.closePath();
	ctx.font = "20pt caption";
	ctx.textAlign = "start";
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.drawImage(img_medal , 820, 20, 30, 30);
	 ctx.fillText(score, 860, 44);
	ctx.drawImage(img_health, 820, 65, 30, 30);
	 ctx.fillText(hp, 860, 89);
	ctx.drawImage(img_money , 820, 110, 30, 30);
	 ctx.fillText(money, 860, 134);
	ctx.font = "10pt caption";

	//drawTower
	drawTower("Laser", 840, 180);
	 ctx.fillStyle = "rgb(0, 0, 0)";
	 ctx.fillText("50$", 831, 205);
	drawTower("Radiation", 880, 180);
	 ctx.fillStyle = "rgb(0, 0, 0)";
	 ctx.fillText("50$", 871, 205);
	drawTower("Shotgun", 920, 180);
	 ctx.fillStyle = "rgb(0, 0, 0)";
	 ctx.fillText("50$", 911, 205);
	drawTower("Stone", 960, 180);
	 ctx.fillStyle = "rgb(0, 0, 0)";
	 ctx.fillText("10$", 951, 205);

	//drawButton & detail
	if (DTI != -1) {
		ctxButton(890, 240, towers[DTI].typ, "Upgrade");
		 ctx.font = "10pt caption";
		 ctx.fillStyle = "rgb(0, 0, 0)";
	 	 ctx.fillText("10$", 968, 246);
		if (towers[DTI].evn.length > 0) {
			ctxButton(890, 290, towers[DTI].evn[0], towers[DTI].evn[0]);
			 ctx.font = "10pt caption";
		 	 ctx.fillStyle = "rgb(0, 0, 0)";
	 	 	 ctx.fillText("25$", 968, 296);
		}
		ctxStyle(towers[DTI].typ, 1);
		ctx.beginPath();
		ctx.strokeRect(805, 649, 190, 146);
		ctx.stroke();
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "25pt caption";
		ctx.textAlign = "start";
		ctx.fillText(towers[DTI].typ, 830, 690);
		ctxStyle(towers[DTI].typ, 1);
		ctx.moveTo(825, 700);
		ctx.lineTo(975, 700);
		ctx.stroke();
		ctx.font = "15pt caption";
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillText("lvl.", 830, 730);
		ctx.fillText(towers[DTI].lvl, 870, 730);
		ctx.fillText("hp.", 830, 750);
		ctx.fillText(towers[DTI].hp + "/" + towers[DTI].hpMax, 870, 750);
		ctx.closePath();
		ctx.drawImage(img_delete , 955, 755, 30, 30);
		if (mouseX >= 960 && mouseX <= 980 && mouseY >= 757 && mouseY <= 785) {
			ctx.drawImage(img_cross , towers[DTI].x-12, towers[DTI].y-12, 24, 24);
		}
	}
	var rge = 0;
	if (nowTower == "Laser") {
		rge = 80;
	} else if (nowTower == "Radiation") {
		rge = 132;
	} else if (nowTower == "Shotgun") {
		rge = 160;
	}
	var X = Math.floor(mouseX/32)*32 + 16, Y = Math.floor(mouseY/32)*32 + 16;
	if (isInMap(Math.floor(mouseX/32), Math.floor(mouseX/32))) {
		drawTower(nowTower, X, Y);
		drawTowerRange(nowTower, X, Y, rge);
	} else {
		drawTower(nowTower, mouseX, mouseY);
	}
}

function ctxButton(x, y, towerType, TEXT) {
	ctx.beginPath();
	ctxStyle(towerType, 1);
	ctxBlock(x-40, x+40, y, 20);
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctx.fillStyle = "rgb(245, 245, 245)";
	ctxBlock(x-40, x+40, y, 17);
	ctx.fill();
	ctx.closePath();
	if (dis(mouseX, mouseY, x-40, y) <= 20 || dis(mouseX, mouseY, x+40, y) <= 20
		|| (mouseX >= x-40 && mouseX <= x+40 && mouseY >= y-20 && mouseY <= y+20)) {
		ctx.beginPath();
		ctxStyle(towerType, 0.2);
		ctxBlock(x-40, x+40, y, 17);
		ctx.fill();
		ctx.closePath();
	}
	ctx.beginPath();
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.font = "16pt caption";
	ctx.textAlign = "center";
	ctx.fillText(TEXT, x, y+8);
	ctx.closePath();
}

function ctxBlock(lx, rx, y, r) {
	ctx.arc(lx, y, r, 0.5*Math.PI, 1.5*Math.PI, 0);
	ctx.lineTo(rx, y-r);
	ctx.arc(rx, y, r, 1.5*Math.PI, 0.5*Math.PI, 0);
	ctx.lineTo(lx, y+r);
}

function ctxStyle(towerType, a) {
	if (towerType == "Laser") {
		ctx.fillStyle = "rgba(255, 127, 0, "+a+")";
		ctx.strokeStyle = "rgba(255, 127, 0, "+a+")";
	} else if (towerType == "Radiation") {
		ctx.fillStyle = "rgba(127, 0, 255, "+a+")";
		ctx.strokeStyle = "rgba(127, 0, 255, "+a+")";
	} else if (towerType == "Shotgun") {
		ctx.fillStyle = "rgba(79, 156, 156, "+a+")";
		ctx.strokeStyle = "rgba(79, 156, 156, "+a+")";
	} else if (towerType == "Stone") {
		ctx.fillStyle = "rgba(102, 34, 0, "+a+")";
		ctx.strokeStyle = "rgba(102, 34, 0, "+a+")";
	} else if (towerType == "Freeze") {
		ctx.fillStyle = "rgba(0, 229, 230, "+a+")";
		ctx.strokeStyle = "rgba(0, 229, 230, "+a+")";
	} else if (towerType == "Money") {
		ctx.fillStyle = "rgba(174, 96, 96, "+a+")";
		ctx.strokeStyle = "rgba(174, 96, 96, "+a+")";
	} else if (towerType == "Lightning") {
		ctx.fillStyle = "rgba(41, 41, 255, "+a+")";
		ctx.strokeStyle = "rgba(41, 41, 255, "+a+")";
	} else if (towerType == "Bomb") {
		ctx.fillStyle = "rgba(219, 69, 50, "+a+")";
		ctx.strokeStyle = "rgba(219, 69, 50, "+a+")";
	}
}

function onMouseDown() {
	if (dis(mouseX, mouseY, 840, 180) <= 15) {
		nowTower = "Laser";
	} else if (dis(mouseX, mouseY, 880, 180) <= 15) {
		nowTower = "Radiation";
	} else if (dis(mouseX, mouseY, 920, 180) <= 15) {
		nowTower = "Shotgun";
	} else if (dis(mouseX, mouseY, 960, 180) <= 15) {
		nowTower = "Stone";
	} else if (mouseX <= 800) {
		x = Math.floor(mouseX / 32);
		y = Math.floor(mouseY / 32);
		if (map[x][y] != -1) {
			DTI = map[x][y];
		}
	}
	if ((dis(mouseX, mouseY, 860, 240) <= 20 || dis(mouseX, mouseY, 940, 240) <= 20
		 || (mouseX >= 860 && mouseX <= 940 && mouseY >= 220 && mouseY <= 260))
		 && money >= 10) {
		money -= 10;
		towers[DTI].lvl++;
		towers[DTI].upgrade();
	}
	if ((dis(mouseX, mouseY, 860, 290) <= 20 || dis(mouseX, mouseY, 940, 290) <= 20
		 || (mouseX >= 860 && mouseX <= 940 && mouseY >= 270 && mouseY <= 310))
		 && towers[DTI].evn.length >= 1) {
		if (money >= 25) {
			money -= 25;
			evolution = {todo: true, evn: 0, idx: DTI};
		}
	}
	if (mouseX >= 960 && mouseX <= 980 && mouseY >= 757 && mouseY <= 785) {
		map[(towers[DTI].x-16)/32][(towers[DTI].y-16)/32] = -1;
		towers.splice(DTI, 1);
		for (var i = 0; i < 25; i++) {
			for (var j = 0; j < 25; j++) {
				if (map[i][j] > DTI) map[i][j]--;
			}
		}
		pathBFS();
		DTI = -1;
	}
}

function onMouseUp() {
	x = Math.floor(mouseX / 32);
	y = Math.floor(mouseY / 32);
	if (nowTower != "" && x < 25 && y < 25 && map[x][y] == -1 && money >= (new Tower(nowTower).moneyCost)) {
		map[x][y] = towers.length;
		pathBFS();
		var tf = true;
		for (var i = 0; i < 25; i++) {
			for (var j = 0; j < 25; j++) {
				if (bfsPath[i][j] == -1 && map[i][j] == -1) tf = false;
			}
		}
		if (tf && x+y < 48 && x+y > 0) {
			money -= (new Tower(nowTower).moneyCost);
			towers.push(new Tower(nowTower, x, y, 1));
			DTI = map[x][y];
		} else {
			map[x][y] = -1;
		}
		pathBFS();
	}
	nowTower = "";
}

setTimeout(function() {
    var canvas = document.getElementById("TDgame");
	ctx = canvas.getContext("2d");
	pathBFS();
	intervalID = setInterval(draw, 1000 / 60);
	$("#TDgame").on("mousedown",onMouseDown);
	$("#TDgame").on("mouseup",onMouseUp);
}, 100);

//$("body").on("keypress",Pause);