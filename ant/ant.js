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
    pheromoneMatrix = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0));
    for(let i = 0; i < adj.length; i++)
        for(let j = 0; j < adj.length; j++)
            if (i !== j)
                pheromoneMatrix[i][j] = PHEROMONE0;
}

// Расчет расстояния для маршрута
function calculateDistance(path) 
{
    let distance = adj[path.at(-1)][path[0]];
    for (let i = 0; i < path.length - 1; i++) 
        distance += adj[path[i]][path[i + 1]];

    return distance;
}

// Метод выбора следующей вершины
function makeChoice(ant)
{
    // Если соседей не оказалось = весь путь был пройден
    let neighborVertexes = getNeighborVertexes(ant);
    if (neighborVertexes.length == 0)
        return; 

    // Подсчёт вероятности перехода муравья в соседние вершины
    let choosingProbabilities = new Array(neighborVertexes.length);
    let wishes = [];
    let probability = [];
    let summWishes = 0.0;
    for(let neighbor of neighborVertexes)
    {
        let pheromone = pheromoneMatrix[ant.at(-1)][neighbor];
        let proximity = 1 / adj[ant.at(-1)][neighbor];

        wishes.push(Math.pow(pheromone, ALPHA) * Math.pow(proximity, BETA));
        summWishes += wishes.at(-1);
    }

    probability.push(wishes[0] / summWishes);
    choosingProbabilities[0] = probability.at(-1);
    for(let i = 1; i < neighborVertexes.length; i++)
    {
        probability.push(wishes[i] / summWishes);
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

    ant.push(nextVertex);
}

// Получение соседних ещё не посещённых вершин
function getNeighborVertexes(ant)
{
    let neighbors = [];
    for(let v = 0; v < adj.length; v++)
        if (!ant.includes(v))
            neighbors.push(v);
    return neighbors;
}

// Создание муравьёв
function createAnts()
{
    ants = [];
    for(let i = 0; i < adj.length; i++)
        ants.push([i]);

    return ants;
}

// Глобальное обновление феромонов
function globalUpdatePheromone(lup)
{
    for(let i = 0; i < lup.length; i++)
        for(let j = 0; j < lup.length; j++)
        {
            pheromoneMatrix[i][j] = EVAPORATION * pheromoneMatrix[i][j] + lup[i][j];
            if(pheromoneMatrix[i][j] < 0.01 && i != j)
                pheromoneMatrix[i][j] = 0.01;
        }
}

// Муравьинный алгоритм
async function antAlgorithm()
{
    if (adj.length == 0)
        return;

    const maxIter = 100; // Через какое кол-во итераций прекратить после того, как путь перестал улучшаться
    let iter = 0;
    
    let path = [];
    let distance = Infinity;

    while (iter < maxIter)
    {
        let lup = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0)); // lup - local update pheromone
        let ants = createAnts();

        for(let ant of ants)
        {
            // Проходим каждым муравьём весь путь
            for(let i = 0; i < adj.length - 1; i++)
                makeChoice(ant);

            let antDist = calculateDistance(ant);

            // Если путь муравья короче чем текущий, то записываем его
            if (antDist < distance)
            {
                path = ant;
                distance = antDist;
                iter = 0;
            }

            // Обновление феромонов
            let T_ijk = Q / antDist;
            for(let v = 0; v < ant.length - 1; v++)
            {
                lup[ant[v]][ant[v + 1]] += T_ijk;
                lup[ant[v + 1]][ant[v]] += T_ijk;
            }
            lup[ant.at(-1)][ant[0]] += T_ijk;
            lup[ant[0]][ant.at(-1)] += T_ijk;
        }
        globalUpdatePheromone(lup);
        
        iter += 1;
    }

    return path;
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

    // Решение задачи
    let path = await antAlgorithm();

    // Очищаем холст
    clearCanvas();
    drawVertexes();

    // Отрисовка найденного пути 
    drawPath(path);
});