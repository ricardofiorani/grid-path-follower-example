import Phaser from 'phaser';

export default class Demo extends Phaser.Scene {
    private cells!: Phaser.GameObjects.Group;
    private originCell?: Phaser.GameObjects.Image;
    private destinationCell?: Phaser.GameObjects.Image;
    private cellSize = 64;

    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('logo', 'assets/phaser3-logo.png');
        this.load.image('grass', 'assets/grass.jpg');
    }

    create() {
        // Define the size of each grid cell

        // Define the size of the game window
        const gameWidth = this.game.config.width as number;
        const gameHeight = this.game.config.height as number;
        const numRows = Math.floor(gameHeight / this.cellSize);
        const numCols = Math.floor(gameWidth / this.cellSize);

        // Create a group to hold all the grid cells
        this.cells = this.add.group();

        // Create the grid cells
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                // Calculate the x and y coordinates of the cell
                const x = col * this.cellSize;
                const y = row * this.cellSize;

                const grass = this.add.image(x, y, 'grass');
                grass.setOrigin(0, 0);
                grass.setDisplaySize(this.cellSize, this.cellSize);
                grass.setInteractive();
                grass.on('pointerdown', () => this.onCellPointerDown(grass), this);
                grass.on('pointerover', () => this.onCellPointerOver(grass), this);
                grass.on('pointerout', () => this.onCellPointerOut(grass), this);
                this.cells.add(grass);
            }
        }
    }

    private onCellPointerOver(cell: Phaser.GameObjects.Image) {
        if (cell === this.originCell) return;
        if (cell === this.destinationCell) return;

        cell.setTint(0x00ff00);
    }

    private onCellPointerOut(cell: Phaser.GameObjects.Image) {
        if (cell === this.originCell) return;
        if (cell === this.destinationCell) return;

        cell.clearTint();
    }

    private onCellPointerDown(cell: Phaser.GameObjects.Image) {
        if (!this.originCell) return this.setOriginCell(cell);
        if (!this.destinationCell) return this.setDestinationCell(cell);

        this.moveCharacterGridBased(this.originCell, this.destinationCell);
    }

    private setOriginCell(cell: Phaser.GameObjects.Image) {
        cell.setTint(0xff0000);
        this.originCell = cell;
    }

    private setDestinationCell(cell: Phaser.GameObjects.Image) {
        cell.setTint(0x0000ff);
        this.destinationCell = cell;
    }

    private moveCharacterGridBased(originCell: Phaser.GameObjects.Image, destinationCell: Phaser.GameObjects.Image) {
        const character = this.add.graphics({
            x: originCell.x,
            y: originCell.y,
            fillStyle: { color: 0xff0000 }
        });
        character.fillRect(0, 0, this.cellSize, this.cellSize);

        const path = this.findPath(originCell, destinationCell);
        const tweens = path.map((cell, index) => {
            return {
                targets: character,
                x: cell.x,
                y: cell.y,
                duration: 1000, //Time spent per cell or, speed of the character
                onComplete: () => {
                    if (index === path.length - 1) {
                        this.originCell = undefined;
                        this.destinationCell = undefined;
                        originCell.clearTint();
                        destinationCell.clearTint();
                        character.destroy();
                    }
                }
            };
        });

        this.tweens.timeline({
            tweens
        });
    }

    private findPath(originCell: Phaser.GameObjects.Image, destinationCell: Phaser.GameObjects.Image) {
        const path: Phaser.GameObjects.Image[] = [];
        const visited: Phaser.GameObjects.Image[] = [];
        const queue: Phaser.GameObjects.Image[] = [];

        queue.push(originCell);
        visited.push(originCell);

        while (queue.length > 0) {
            const currentCell = queue.shift() as Phaser.GameObjects.Image;
            if (currentCell === destinationCell) {
                let cell = currentCell;
                while (cell !== originCell) {
                    path.unshift(cell);
                    cell = cell.getData('parent') as Phaser.GameObjects.Image;
                }
                break;
            }

            const neighbors = this.getNeighbors(currentCell);
            for (const neighbor of neighbors) {
                if (visited.includes(neighbor)) continue;
                visited.push(neighbor);
                neighbor.setData('parent', currentCell);
                queue.push(neighbor);
            }
        }

        return path;
    }

    private getNeighbors(currentCell: Phaser.GameObjects.Image) {
        const neighbors: Phaser.GameObjects.Image[] = [];
        const x = currentCell.x;
        const y = currentCell.y;
        const left = this.getCellAt(x - this.cellSize, y);
        const right = this.getCellAt(x + this.cellSize, y);
        const top = this.getCellAt(x, y - this.cellSize);
        const bottom = this.getCellAt(x, y + this.cellSize);

        if (left) neighbors.push(left);
        if (right) neighbors.push(right);
        if (top) neighbors.push(top);
        if (bottom) neighbors.push(bottom);

        return neighbors;
    }

    // Get the cell at position (x, y)
    private getCellAt(x: number, y: number): Phaser.GameObjects.Image {
        // Calculate the row and column of the cell
        const row = Math.floor(y / this.cellSize);
        const col = Math.floor(x / this.cellSize);
        const numCols = Math.floor(this.game.config.width as number / this.cellSize);


        // Calculate the index of the cell in the group
        const index = row * numCols + col;

        // Retrieve the cell from the group using its index
        return this.cells.getChildren()[index] as Phaser.GameObjects.Image;
    }

}
