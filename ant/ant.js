let canvas = document.getElementsByTagName('canvas')[0];
canvas.width  = 1024;
canvas.height = 768;
let ctx = canvas.getContext('2d');

let vertexes = []; 
let adj = []; 

let vertexColor = "rgb(0, 0, 0)";
let edgeColor   = "rgba(160, 160, 160, 0.1)";
let pathColor   = "rgba(0, 200, 0, 0.8)";


//-=-=-=-=-=- Муравьинный алгоритм -=-=-=-=-=-
let ALPHA       = 1;    // В эту степень возмодится кол-во феромонов между i и j городами
let BETA        = 2;    // В эту степень возводится близость между i и j городами
let PHEROMONE0  = 1;    // Базовое значение феромонов
let Q           = 5;    // Константа, которая делится на длину пути, пройденного муравьём
let EVAPORATION = 0.2;  // Коэффициент испарения феромонов

let pheromoneMatrix = new Array();

function initializePheromoneMatrix()
{
    pheromoneMatrix = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0));;
    for(let i = 0; i < adj.length; i++)
        for(let j = 0; j < adj.length; j++)
            if (i !== j)
                pheromoneMatrix[i][j] = PHEROMONE0;
}

class Ant
{
    path = [];
    distance = 0;
    visited = new Set();
    start = 0;
    curr = 0;
    canContinue = true;

    constructor(start = 0)
    {
        this.start = start;
        this.curr = start;
    }

    // Метод выбора следующей вершины
    makeChoice(adj)
    {
        if (this.path.length == 0)
        {
            this.path.push(this.curr);
            this.visited.add(this.curr); 
        }

        // Если соседей не оказалось = весь путь был пройден
        let neighborVertexes = this.getNeighborVertexes(adj);
        if (neighborVertexes.length == 0)
        {
            this.canContinue = false;
            this.distance += adj[this.curr][this.start];
            return;
        }

        // Подсчёт вероятности перехода муравья в соседние вершины
        let choosingProbabilities = [];
        let wishes = [];
        let probability = [];
        let summWishes = 0.0;
        for(let neighbor of neighborVertexes)
        {
            let pheromone = pheromoneMatrix[this.curr][neighbor];
            let proximity = 1 / adj[this.curr][neighbor];

            wishes.push(Math.pow(pheromone, ALPHA) * Math.pow(proximity, BETA));
            summWishes += wishes.at(-1);
        }
        for(let i = 0; i < neighborVertexes.length; i++)
        {
            probability.push(wishes[i] / summWishes);
            if (i === 0)
                choosingProbabilities[i] = probability.at(-1);
            else
                choosingProbabilities[i] = choosingProbabilities[i - 1] + probability.at(-1);
        }

        //Выбор следующей вершины
        let nextVertex;
        let choose = Math.random();
        for(let i = 0; i < neighborVertexes.length; i++)
            if (choose <= choosingProbabilities[i])
            {
                nextVertex = neighborVertexes[i];
                break;
            }

        this.path.push(nextVertex);
        this.distance += adj[this.curr][nextVertex];
        this.visited.add(nextVertex);
        this.curr = nextVertex;
    }
    
    // Получение соседних ещё не посещённых вершин
    getNeighborVertexes(adj)
    {
        let neighbors = [];
        for(let v = 0; v < adj.length; v++)
            if (!this.visited.has(v))
                neighbors.push(v);
        return neighbors;
    }
}
class AntColonyOptimization
{
    ants = [];

    createAnts()
    {
        this.ants = [];
        for(let i = 0; i < adj.length; i++)
            this.ants.push(new Ant(i));
    }

    updatePheromone(lup)
    {
        for(let i = 0; i < lup.length; i++)
            for(let j = 0; j < lup.length; j++)
            {
                pheromoneMatrix[i][j] = EVAPORATION * pheromoneMatrix[i][j] + lup[i][j];
                if(pheromoneMatrix[i][j] < 0.01 && i != j)
                    pheromoneMatrix[i][j] = 0.01;
            }
    }

    solveSalesmansProblem()
    {
        if (adj.length == 0)
            return;

        const maxIter = 100; // Через какое кол-во итераций прекратить после того, как путь перестал улучшаться
        let iter = 0;
        
        let path = [];
        let distance = Infinity;

        while (iter < maxIter)
        {
            iter += 1;
            let lup = []; // lup - local update pheromone 
            for(let i = 0; i < adj.length; i++)
            {
                let row = []
                for(let j = 0; j < adj.length; j++)
                    row.push(0);
                lup.push(row);
            }
            this.createAnts();

            for(let ant of this.ants)
            {
                // Проходим каждым муравьём весь путь
                while(ant.canContinue)
                    ant.makeChoice(adj);

                // Если путь муравья короче чем текущий, то записываем его
                if (ant.distance < distance)
                {
                    path = ant.path;
                    distance = ant.distance;
                    iter = 0;
                }

                // Обновление феромонов
                for(let v = 0; v < ant.path.length - 1; v++)
                {
                    if (v === ant.path.length - 2)
                    {
                        lup[ant.path[v]][ant.path[0]] += Q / ant.distance;
                        lup[ant.path[0]][ant.path[v]] += Q / ant.distance;
                    }
                    else
                    {
                        lup[ant.path[v]][ant.path[v + 1]] += Q / ant.distance;
                        lup[ant.path[v + 1]][ant.path[v]] += Q / ant.distance;
                    }
                }
            }
            this.updatePheromone(lup);
        }

        return path;
    }
}


//-=-=-=-=-=- Работа с холстом -=-=-=-=-=-
// Очистка холста
function clearCanvas() 
{
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Отрисовка вершин графа
function drawVertexes(all = true)
{
    ctx.fillStyle = vertexColor;
    if (all)
    {
        for(let i in vertexes)
        {
            ctx.beginPath();
            ctx.arc(vertexes[i][0], vertexes[i][1], 5, 0, 2 * Math.PI, true);
            ctx.fill();
            ctx.closePath();
        }
    }
    else
    {
        ctx.beginPath();
        ctx.arc(vertexes.at(-1)[0], vertexes.at(-1)[1], 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
    }
}

// Отрисовка рёбер графа
function drawEdges()
{
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i = 0; i < vertexes.length; i++)
        for(let j = i + 1; j < vertexes.length; j++)
        {
            ctx.moveTo(vertexes[i][0], vertexes[i][1]);
            ctx.lineTo(vertexes[j][0], vertexes[j][1]);
        }
    ctx.stroke();
    ctx.closePath();
}

// Отрисовка найденного пути
function drawPath(path) 
{
    clearCanvas();
    drawVertexes();

    // Отрисовка найденного пути 
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let v = 0; v < path.length - 1; v++)
    {
        ctx.moveTo(vertexes[path[v]][0], vertexes[path[v]][1]);
        ctx.lineTo(vertexes[path[v + 1]][0], vertexes[path[v + 1]][1]);
    }   
    ctx.moveTo(vertexes[path.at(-1)][0], vertexes[path.at(-1)][1]);
    ctx.lineTo(vertexes[path[0]][0], vertexes[path[0]][1]);
    ctx.stroke(); 
    ctx.closePath();
}


//-=-=-=-=-=- Взаимодействие с пользователем -=-=-=-=-=-
canvas.addEventListener('click', async function(e)
{
    // Преобразование координат курсора, чтобы точки отрисовывались корректно
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    const currX = (e.clientX - rect.left) * scaleX;
    const currY = (e.clientY - rect.top) * scaleY;

    // Добавлям точку в список точек
    vertexes.push([currX, currY]);

    // Обновляем матрицу смежности
    {
        for(let i = 0; i < adj.length; i++)
        {
            let dist = ((vertexes[i][0] - vertexes.at(-1)[0]) ** 2 + (vertexes[i][1] - vertexes.at(-1)[1]) ** 2) ** 0.5;
            adj[i].push(dist);
        }
        let newRow = [];
        for(let i = 0; i < vertexes.length; i++)
        {
            let dist = ((vertexes[i][0] - vertexes.at(-1)[0]) ** 2 + (vertexes[i][1] - vertexes.at(-1)[1]) ** 2) ** 0.5;
            newRow.push(dist);
        }
        adj.push(newRow);
    }

    // Отрисовка точки в месте клика  
    drawVertexes(false);
});


document.getElementById('start').addEventListener('click', async function(e)
{
    ALPHA = parseInt(document.getElementById('alpha').value);
    BETA = parseInt(document.getElementById('beta').value);
    Q = parseInt(document.getElementById('q').value);
    EVAPORATION = parseFloat(document.getElementById('evaporation').value);

    // Инициализируем колонию
    initializePheromoneMatrix();
    let antColony = new AntColonyOptimization();

    // Решение задачи
    let path = antColony.solveSalesmansProblem();

    // Очищаем холст
    clearCanvas();
    drawVertexes();

    // Отрисовка найденного пути 
    drawPath(path);
});