//CANVAS
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//ELEMENTS SELECTORS
const scoreElement = document.querySelector("#scoreElement");
const bigScoreElement = document.querySelector("#bigScoreElement");
const startGameBtn = document.querySelector("#startGameBtn");
const modalElement = document.querySelector("#modalElement");
const armageddonChb = document.querySelector("#armageddonChb");
const rangeInput = document.querySelector("#rangeInput");

//GAME SETTINGS
const PLAYER_SCORE = 0;
const DELTA_ALPHA = 0.01;
const FRICTION = 0.99;
const PLAYER_COLOR = "red";
const PLAYER_RADIUS = 25;
const MAX_ENEMY_RADIUS = 30;
const ENEMY_SPEED = 4;
const PROJECTILE_SPEED = 5;
const PLAYER_SPEED = 5;
let armageddonMode = false;
let enemySpeedModifier = 0.5;

//CLASS THAT REPRESENTS A PLAYER
class Player {
    constructor(x,y,radius,color,velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.score = PLAYER_SCORE;
        this.prevScore = this.score;
        this.velocity = velocity;
        this.DIRECTIONS = {
            "LEFT": "a",
            "RIGHT": "d",
            "DOWN": "s",
            "UP": "w",
            "STOP": "x"
        }
        this.direction = this.DIRECTIONS.STOP;
        this.prevDirection = null;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        switch (this.direction) {
            case this.DIRECTIONS.LEFT:
                this.x = this.x - this.velocity;
                break;
            case this.DIRECTIONS.RIGHT:
                this.x = this.x + this.velocity;
                break;
            case this.DIRECTIONS.UP:
                this.y = this.y - this.velocity;
                break;
            case this.DIRECTIONS.DOWN:
                this.y = this.y + this.velocity;
                break;
        }  
    }
}

//CLASS THAT REPRESENTS MOVING OBJECTS
class MovingObject {
    constructor(x,y,radius,color,velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

//EXTENSIONS OF MOVINGOBJECT CLASS - PROJECTILES AND ENEMIES
class Projectile extends MovingObject {};
class Enemy extends MovingObject {
    
    constructor(x,y,radius,color,velocity,player) {
        super(x,y,radius,color,velocity);
        this.player = player;
    }

    followPlayer() {
        const angle = Math.atan2(-this.y+this.player.y, -this.x+this.player.x);
        const velocity = {
            x: Math.cos(angle)*ENEMY_SPEED*enemySpeedModifier,
            y: Math.sin(angle)*ENEMY_SPEED*enemySpeedModifier
        }
        this.velocity = velocity;
    }
};

//CLASS THAT REPRESENTS PARTICLES FROM EXPLOSIONS
class Particle extends MovingObject {
    constructor(x,y,radius,color,velocity) {
        super(x,y,radius,color,velocity);
        this.alpha = 1;
        this.friction = FRICTION;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= DELTA_ALPHA;
    }
}

//INITIALIZING THE GAME STATE
let player = new Player(canvas.width/2, canvas.height/2, PLAYER_RADIUS, PLAYER_COLOR, PLAYER_SPEED);
let projectiles = [];
let enemies = [];
let particles = [];

//FUNCTION FOR RE-INITIALIZATION THE GAME STATE
const init = () => {
    player = new Player(canvas.width/2, canvas.height/2, PLAYER_RADIUS, PLAYER_COLOR, PLAYER_SPEED);
    projectiles = [];
    enemies = [];
    particles = [];
    scoreElement.innerHTML = player.score;
    bigScoreElement.innerHTML = player.score;
}

//FUNCTION FOR SPAWNING THE ENEMIES
const spawnEnemies = () => {
    setInterval(() => {
        const radius = Math.random()*(MAX_ENEMY_RADIUS-4)+4;

        let x, y;

        if (Math.random()<0.5) {
            x = Math.random()<0.5 ? (0-radius) : canvas.width+radius;
            y = Math.random()*canvas.height;
        } else {
            y = Math.random()<0.5 ? (0-radius) : canvas.height+radius;
            x = Math.random()*canvas.width;
        }

        const color = `hsl(${Math.random()*360},50%,50%)`;
        const angle = Math.atan2(-y+player.y, -x+player.x);
        const velocity = {
            x: Math.cos(angle)*ENEMY_SPEED*enemySpeedModifier,
            y: Math.sin(angle)*ENEMY_SPEED*enemySpeedModifier
        }

        enemies.push(new Enemy(x, y, radius, color, velocity, player));
    }, 1000);
}

//FUNCTION FOR ANIMATING THE GAME FRAME
let animationId;
const animate = () => {
    animationId = requestAnimationFrame(animate);

    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    player.update();
    setTimeout(() => {
        if ((player.x-player.radius<0 ||
            player.x+player.radius>canvas.width ||
            player.y-player.radius<0 ||
            player.y+player.radius>canvas.height) &&
            player.prevDirection == null) {
                player.prevDirection = player.direction;
                player.direction = player.DIRECTIONS.STOP;
            }     
    }, 0);

    if (player.score-player.prevScore>=750) {
        player.prevScore = player.score;
        player.radius *= 1.05;
    }
    

    particles.forEach((particle, index) => {
        if (particle.alpha<=0) particles.splice(index,1);
        else particle.update();
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        setTimeout(() => {
            if (projectile.x-projectile.radius<0 ||
                projectile.x-projectile.radius>canvas.width ||
                projectile.y+projectile.radius<0 ||
                projectile.y-projectile.radius>canvas.height) projectiles.splice(index,1);
        }, 0);
    });

    enemies.forEach((enemy, enIndex) => {
        enemy.update();
        if (armageddonMode) enemy.followPlayer(); 
        
        const dist = Math.hypot(player.x-enemy.x, player.y-enemy.y);

        //CHECKING IF THERE IS A COLLSION WITH PLAYER
        if ((dist-enemy.radius-player.radius)<0) {
            cancelAnimationFrame(animationId);
            modalElement.style.display = "flex";
            bigScoreElement.innerHTML = player.score;
        }

        //CHECKING IF THERE IS COLLISION WITH PROJECTILES
        projectiles.forEach((projectile, prIndex) => {
            const dist = Math.hypot(projectile.x-enemy.x, projectile.y-enemy.y);

            if ((dist-enemy.radius-projectile.radius)<1) {           
                //CREATING EXPLOSIONS
                for (let i=0; i<2*enemy.radius; i++) {
                    particles.push(new Particle(projectile.x,
                        projectile.y,
                        Math.random()*3,
                        enemy.color,
                        {
                            x: (Math.random()-0.5)*(5*Math.random()),
                            y: (Math.random()-0.5)*(5*Math.random())
                        }
                        ));
                }

                //ADDING POINTS AND REMOVING DESTROYED ENEMIES
                if (enemy.radius>15) {
                    player.score += 100;
                    gsap.to(enemy, {
                        radius: enemy.radius-10
                    })

                    setTimeout(() => {
                    projectiles.splice(prIndex,1);
                    }, 0); 
                }
                else {
                    player.score += 250;

                    setTimeout(() => {
                    enemies.splice(enIndex,1);
                    projectiles.splice(prIndex,1);
                    }, 0); 
                }
                scoreElement.innerHTML = player.score;
            }
        })
    })
}

//EVENT LISTENER FOR CLICKING ON THE BOARD (SHOOTING)
window.addEventListener("click", (event) => {
    const angle = Math.atan2(event.clientY-(player.y), event.clientX-(player.x));

    projectiles.push(new Projectile(player.x,
        player.y,
        5,
        PLAYER_COLOR,
        {
            x: Math.cos(angle)*PROJECTILE_SPEED,
            y: Math.sin(angle)*PROJECTILE_SPEED
        }));
});

//EVENT LISTENER FOR PLAYER MOVEMENTS
window.addEventListener("keydown", (event) => {
    const directions = Object.values(player.DIRECTIONS);
    const DIRECTIONS = player.DIRECTIONS;
    const key = event.key.toLowerCase();
    const prevDirection = player.prevDirection;

    if (prevDirection != null) {
        if (prevDirection == DIRECTIONS.LEFT && key == DIRECTIONS.RIGHT) {player.direction = key; player.prevDirection = null;}
        else if (prevDirection == DIRECTIONS.RIGHT && key == DIRECTIONS.LEFT) {player.direction = key; player.prevDirection = null;}
        else if (prevDirection == DIRECTIONS.UP && key == DIRECTIONS.DOWN) {player.direction = key; player.prevDirection = null;}
        else if (prevDirection == DIRECTIONS.DOWN && key == DIRECTIONS.UP) {player.direction = key; player.prevDirection = null;}
    } else {
        directions.forEach(direction => {
            if  (key == direction) player.direction = direction;
        })
    }    
});

//EVENT LISTENER FOR STARTING THE GAME
startGameBtn.addEventListener("click", () => {
    init();
    animate();
    spawnEnemies();
    modalElement.style.display = "none";
});

//EVENT LISTENER FOR SETTING ARMAGEDDON MODE
armageddonChb.addEventListener("change", () => {
    armageddonMode = armageddonChb.checked;
});

//EVENT LSITENER FOR CHANGING ENEMIES VELOCITY
rangeInput.addEventListener("change", () => {
    enemySpeedModifier = 0.3+(parseInt(rangeInput.value))/100;
});