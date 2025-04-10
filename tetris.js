// Game Constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// Tetromino Shapes
const TETROMINOES = {
    'I': {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0'
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f0a000'
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000f0'
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f00000'
    }
};

// Default controls (can be customized)
let controls = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    down: 'ArrowDown',
    rotate: 'ArrowUp',
    hardDrop: 'Space'
};

class Tetris {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScoreChange = null; // Add callback for score changes
        this.reset();
        
        // Set canvas size
        this.canvas.width = BLOCK_SIZE * BOARD_WIDTH;
        this.canvas.height = BLOCK_SIZE * BOARD_HEIGHT;
        
        // Initialize input handling
        this.setupControls();
    }

    reset() {
        // Initialize game board
        this.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.dropCounter = 0;
        this.dropInterval = 1000; // Start with 1 second interval
        this.lastTime = 0;
        this.paused = false;
        
        // Create new piece
        this.createNewPiece();
    }

    createNewPiece() {
        const pieces = 'ILJOTSZ';
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.currentPiece = {
            pos: {x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0},
            tetromino: TETROMINOES[randomPiece],
            shape: TETROMINOES[randomPiece].shape
        };
        
        // Check for game over
        if (this.collision()) {
            this.gameOver = true;
        }
    }

    rotate(matrix) {
        // Transpose matrix
        const N = matrix.length;
        const rotated = matrix.map((row, i) =>
            matrix.map(col => col[i]).reverse()
        );
        return rotated;
    }

    collision() {
        const [m, o] = [this.currentPiece.shape, this.currentPiece.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (this.board[y + o.y] &&
                    this.board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.board[y + this.currentPiece.pos.y][x + this.currentPiece.pos.x] = this.currentPiece.tetromino.color;
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        outer: for (let y = this.board.length - 1; y >= 0; --y) {
            for (let x = 0; x < this.board[y].length; ++x) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Remove the line and add empty line at top
            const row = this.board.splice(y, 1)[0];
            this.board.unshift(Array(BOARD_WIDTH).fill(0));
            ++y;
            linesCleared++;
        }
        
        // Update score
        if (linesCleared > 0) {
            const oldScore = this.score;
            this.score += [40, 100, 300, 1200][linesCleared - 1];
            // Increase speed as score increases
            this.dropInterval = Math.max(100, 1000 - (Math.floor(this.score / 1000) * 100));
            
            // Notify score change
            if (this.onScoreChange && oldScore !== this.score) {
                this.onScoreChange(this.score);
            }
        }
    }

    move(dir) {
        this.currentPiece.pos.x += dir;
        if (this.collision()) {
            this.currentPiece.pos.x -= dir;
            return false;
        }
        return true;
    }

    drop() {
        this.currentPiece.pos.y++;
        if (this.collision()) {
            this.currentPiece.pos.y--;
            this.merge();
            this.clearLines();
            this.createNewPiece();
            return false;
        }
        return true;
    }

    hardDrop() {
        while (this.drop()) {}
    }

    rotatePiece() {
        const pos = this.currentPiece.pos.x;
        let offset = 1;
        this.currentPiece.shape = this.rotate(this.currentPiece.shape);
        
        while (this.collision()) {
            this.currentPiece.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.currentPiece.shape[0].length) {
                this.currentPiece.shape = this.rotate(this.rotate(this.rotate(this.currentPiece.shape)));
                this.currentPiece.pos.x = pos;
                return;
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        this.drawMatrix(this.board, {x: 0, y: 0});
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawMatrix(this.currentPiece.shape, this.currentPiece.pos, this.currentPiece.tetromino.color);
        }
    }

    drawMatrix(matrix, offset, color = '') {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = color || value;
                    this.ctx.fillRect(
                        (x + offset.x) * BLOCK_SIZE,
                        (y + offset.y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }

    setupControls() {
        document.addEventListener('keydown', event => {
            if (this.gameOver) return;
            
            switch (event.code) {
                case controls.left:
                    this.move(-1);
                    break;
                case controls.right:
                    this.move(1);
                    break;
                case controls.down:
                    this.drop();
                    break;
                case controls.rotate:
                    this.rotatePiece();
                    break;
                case controls.hardDrop:
                    this.hardDrop();
                    break;
            }
        });
    }

    updateCustomControls(newControls) {
        controls = { ...controls, ...newControls };
    }

    update(time = 0) {
        if (this.paused || this.gameOver) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
            this.dropCounter = 0;
        }
        
        this.draw();
    }

    togglePause() {
        this.paused = !this.paused;
    }

    start() {
        this.reset();
        this.gameOver = false;
        this.animate();
    }

    animate(time = 0) {
        this.update(time);
        requestAnimationFrame(this.animate.bind(this));
    }
}

// Export the Tetris class
export default Tetris;
