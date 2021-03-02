//Version 0.2

class Engine { //Not much better than doing it manually, but whatever
    constructor(func, interval) {
        this.interval = interval;
        this.func = func;
    }
    start() {
        this.engine = setInterval(this.func, this.interval);
    }
    stop() {
        clearInterval(this.engine);
    }
}

class KeyboardIn {
    constructor(kDownFunc, kUpFunc = false) {
        this.keys = {};
        let kb = this;
        document.addEventListener('keydown', function(e) {
            kb.keys[e.key.toLowerCase()] = true;
            kDownFunc(e.key.toLowerCase());
        });
        document.addEventListener('keyup', function(e) {
            delete kb.keys[e.key.toLowerCase()];
            if (kUpFunc) {
                kUpFunc(e.key.toLowerCase());
            }
        });
    }
}

class Canvas {
    constructor(id, width=1920, height=1080, funcs=false) {
        this.element = document.createElement('canvas');
        this.element.id = id;
        document.body.appendChild(this.element);
        
        this.ctx = this.element.getContext('2d');
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        
        this.mousePos = {x:0, y:0};
        let canvas = this;
        this.element.addEventListener('mousemove', function(e) {
            let rect = canvas.element.getBoundingClientRect();
            canvas.mousePos = {
                x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.element.width,
                y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.element.height
            };
        });
        
        this.mouseDown = false;
        this.element.addEventListener('mousedown', function(e) {
            canvas.mouseDown = true;
            if (funcs.mDownFunc) {
                funcs.mDownFunc(canvas.mousePos);
            }
        });
        this.element.addEventListener('mouseup', function(e) {
            canvas.mouseDown = false;
            if (funcs.mUpFunc) {
                funcs.mUpFunc(canvas.mousePos);
            }
        });
    }
    getMousePos() {
        return this.mousePos;
    }
}

class FunctionPoller {
    constructor(func, interval, tag='Poll: ') {
        this.element = document.createElement('code');
        document.body.appendChild(this.element);
        
        let element = this.element;
        setInterval(function() {
            element.innerHTML = tag.concat(func());
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
    insertAll(items) {
        for (let i = 0; i < items.length; i++) {
            this.insert(items[i]);
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
