//Version 0.3.4

class Engine { //Not much better than doing it manually, but whatever
    constructor(func, interval) {
        this.interval = interval;
        this.func = func;
    }
    start() {
        this.engine = setInterval(() => {
            this.func();
            if (this.newTime) {
                this.stop();
                this.interval = this.updateTime;
                this.newTime = null;
                this.start();
            }
        }, this.interval);
    }
    stop() {
        clearInterval(this.engine);
    }
    updateTime(ms) {
        this.newTime = ms;
    }
}

class KeyboardIn {
    constructor(kDownFunc = false, kUpFunc = false) {
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (kDownFunc) kDownFunc(e.key.toLowerCase());
        });
        document.addEventListener('keyup', (e) => {
            delete this.keys[e.key.toLowerCase()];
            if (kUpFunc) kUpFunc(e.key.toLowerCase());
        });
    }
}

class Canvas {
    constructor(id, width=1920, height=1080, params=false) {
        this.element = document.createElement('canvas');
        this.element.id = id;
        document.body.appendChild(this.element);
        
        this.ctx = this.element.getContext('2d');
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        
        this.mousePos = {x:0, y:0};
        this.buttons = [];
        this.element.addEventListener('mousemove', (e) => {
            let rect = this.element.getBoundingClientRect();
            this.mousePos = {
                x: (e.clientX - rect.left) / (rect.right - rect.left) * this.element.width,
                y: (e.clientY - rect.top) / (rect.bottom - rect.top) * this.element.height
            };
        });
        
        this.mouseDown = false;
        this.element.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            if (params.mDownFunc) params.mDownFunc(this.mousePos);
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.mousePos.x >= this.buttons[i].x
                    && this.mousePos.x <= this.buttons[i].x + this.buttons[i].width
                    && this.mousePos.y >= this.buttons[i].y
                    && this.mousePos.y <= this.buttons[i].y + this.buttons[i].height
                    ) {
                    this.buttons[i].func(this.buttons[i]);
                }
            }
        });
        this.element.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
            if (params.mUpFunc) params.mUpFunc(this.mousePos);
        });
    }
    wrapText(text, x, y, width, spacing = 50) {
        let words = text.split(' '),
            currentLine = [0, ''];
        for (let i = 0; i < words.length; i++) {
            let potentialLine = currentLine[1] + words[i] + ' ',
                measure = this.ctx.measureText(potentialLine);
            if (measure.width <= width) {
                currentLine[0]++;
                currentLine[1] = potentialLine;
            } else {
                if (currentLine[0] === 0) {
                    ctx.fillText(potentialLine, x, y);
                    currentLine = [0, ''];
                } else {
                    ctx.fillText(currentLine[1], x, y);
                    currentLine = [0, words[i] + ' '];
                }
                y += spacing;
            }
        }
        ctx.fillText(currentLine[1], x, y);
    }
    getMousePos() {
        return this.mousePos;
    }
    createButton(id, func, x, y, width, height) {
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].id == id) throw 'ID \'' + id + '\' is already in use!';
        }
        this.buttons.push({
            id: id,
            func: func,
            x: x,
            y: y,
            width: width,
            height: height
        });
    }
    deleteButton(id) {
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].id == id) {
                this.buttons.splice(i, 1);
                return true;
            }
        }
        throw 'Button \'' + id + '\' does not exist!';
    }
}

class FunctionPoller {
    constructor(func, interval, tag='Poll: ') {
        this.element = document.createElement('code');
        document.body.appendChild(this.element);
        
        setInterval(() => {
            this.element.innerHTML = tag.concat(func());
        }, interval);
    }
}

class Slider {
    constructor(id, func, min, max, step=1, value=0, dynamic=false) {
        let div = document.createElement('div'),
            input = document.createElement('input'),
            code = document.createElement('code');
        
        input.id = id;
        input.addEventListener('input', function() {
            code.innerHTML = this.value;
            if (dynamic) {
                func(this.value);
            }
        }, false);
        input.onchange = function() {
            code.innerHTML = this.value;
            func(this.value);
        };
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        input.type = 'range';
        
        code.id = id + 'Out';
        code.innerHTML = value;
        
        div.appendChild(input);
        div.appendChild(code);
        document.body.appendChild(div);
    }
}

function createOptions(select, arr) {
    for (let i = 0; i < arr.length; i++) {
        let option = document.createElement('option');
        option.innerHTML = arr[i];
        option.value = arr[i];
        select.appendChild(option);
    }
}

class Dropdown {
    constructor(id, func, arr) {
        let div = document.createElement('div');
        this.select = document.createElement('select');
        
        this.arr = arr;
        this.id = id;
        this.select.id = id;
        this.select.onchange = function() {func(this.value)};
        
        createOptions(this.select, arr);
        
        div.appendChild(this.select);
        document.body.appendChild(div);
    }
    add(item) {
        this.arr.push(item);
        this.select.innerHTML = '';
        createOptions(this.select, this.arr);
    }
    remove(item) {
        let index = this.arr.indexOf(item);
        if (index > -1) {
            this.arr.splice(index, 1);
            this.select.innerHTML = '';
            createOptions(this.select, this.arr);
        }
    }
}

class Quadtree { //Slightly modified https://github.com/timohausmann/quadtree-js
    constructor(bounds, maxObj=10, maxLv=4, level=0) {
        this.bounds = bounds;
        this.bounds.x = bounds.x || 0;
        this.bounds.y = bounds.y || 0;
        
        this.maxObj = maxObj;
        this.maxLv = maxLv;
        
        this.objects = [];
        this.nodes = [];
        this.level = level;
    }
    insert(item) {
        if (this.nodes.length) {
            let nodes = this.getNodes(item);
            for (let i = 0; i < nodes.length; i++) {
                this.nodes[nodes[i]].insert(item);
            }
            return;
        }
        
        this.objects.push(item);
        
        if (this.objects.length > this.maxObj && this.level < this.maxLv) {
            if (!this.nodes.length) {
                this.split();
            }
            for (let i = 0; i < this.objects.length; i++) {
                let nodes = this.getNodes(this.objects[i]);
                for (let j = 0; j < nodes.length; j++) {
                    this.nodes[nodes[j]].insert(this.objects[i]);
                }
            }
            this.objects = [];
        }
    }
    retrieve(item) {
        let nodes = this.getNodes(item),
            returnObjs = this.objects;
        
        if (this.nodes.length) {
            for (let i = 0; i < nodes.length; i++) {
                returnObjs = returnObjs.concat(this.nodes[nodes[i]].retrieve(item));
            }
        }
        
        returnObjs = returnObjs.filter(function(obj, index) {
            return returnObjs.indexOf(obj) >= index;
        });
        
        return returnObjs;
    }
    clear() {
        this.objects = [];
        this.nodes = [];
    }
    getNodes(item) {
        let indexes = [],
            vertMid = this.bounds.y + (this.bounds.height / 2),
            horiMid = this.bounds.x + (this.bounds.width / 2);
        
        let startTop = item.y <= vertMid,
            startLeft = item.x <= horiMid,
            endBottom = item.y + item.height >= vertMid,
            endRight = item.x + item.width >= horiMid;
        
        if (startTop && endRight) {
            indexes.push(0);
        }
        if (startTop && startLeft) {
            indexes.push(1);
        }
        if (startLeft && endBottom) {
            indexes.push(2);
        }
        if (endBottom && endRight) {
            indexes.push(3);
        }
        
        return indexes;
    }
    split() {
        let nextLv = this.level + 1,
            subHeight = this.bounds.height / 2,
            subWidth = this.bounds.width / 2;
        
        this.nodes.push(new Quadtree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y,
            height: subHeight,
            width: subWidth
        }, this.maxObj, this.maxLv, nextLv));
        
        this.nodes.push(new Quadtree({
            x: this.bounds.x,
            y: this.bounds.y,
            height: subHeight,
            width: subWidth
        }, this.maxObj, this.maxLv, nextLv));
        
        this.nodes.push(new Quadtree({
            x: this.bounds.x,
            y: this.bounds.y + subHeight,
            height: subHeight,
            width: subWidth
        }, this.maxObj, this.maxLv, nextLv));
        
        this.nodes.push(new Quadtree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y + subHeight,
            height: subHeight,
            width: subWidth
        }, this.maxObj, this.maxLv, nextLv));
    }
}
