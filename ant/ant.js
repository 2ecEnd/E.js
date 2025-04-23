// TODO:
// Адаптивное испарение феромонов
// Элитарность
// Бинарный поиск в выборе следующей вершины
// Заменить список соседних вершин на множество соседних вершин
// Валидация входных данных
// Может быть 2-opt (слишком затратно)

let canvas = document.getElementsByTagName('canvas')[0];
canvas.width  = 1024;
canvas.height = 768;
let ctx = canvas.getContext('2d');

let vertexes = []; 
let adj = []; 

let controller = new AbortController();
let isWorking = false;

let vertexColor = "rgb(0, 0, 0)";
let edgeColor   = "rgba(160, 160, 160, 0.1)";
let pathColor   = "rgba(0, 200, 0, 0.8)";


//-=-=-=-=-=- Муравьинный алгоритм -=-=-=-=-=-
let ALPHA               = 1;    // В эту степень возмодится кол-во феромонов между i и j городами
let BETA                = 2;    // В эту степень возводится близость между i и j городами
let PHEROMONE_0         = 1;    // Базовое значение феромонов
let Q                   = 1000;    // Константа, которая делится на длину пути, пройденного муравьём
let EVAPORATION         = 0.2;  // Коэффициент испарения феромонов
let BASE_EVAPORATION    = EVAPORATION;
let UPDATE_RATE         = 5;    // Спустя сколько итераций будет отрисовываться найденный путь
let STAGNATION_TRESHOLD = 100;   // Сколько поколений без изменения результата нужно, для запуска агрессивной мутации

const MAX_PHEROMONE = 10;
const MIN_PHEROMONE = 0.1;

let pheromoneMatrix = new Array();

// Инициализация матрицы феромонов начальными значениями
function initializePheromoneMatrix()
{
    pheromoneMatrix = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0));
    for(let i = 0; i < adj.length; i++)
        for(let j = 0; j < adj.length; j++)
            if (i !== j)
                pheromoneMatrix[i][j] = PHEROMONE_0;
}

// Создание муравьёв
function createAnts()
{
    // Ограничиваем кол-во муравьёв до 20, чтобы облегчить вычисления
    let antsCount = Math.min(adj.length, 20);
    ants = new Array(antsCount);

    // Случайный выбор начальной вершины муравья
    for(let i = 0; i < antsCount; i++)
        ants[i] = [Math.floor(Math.random() * (adj.length - 1))];

    return ants;
}

// Расчет расстояния для пути муравья
function calculateDistance(ant) 
{
    let distance = adj[ant.at(-1)][ant[0]];
    for (let i = 0; i < ant.length - 1; i++) 
        distance += adj[ant[i]][ant[i + 1]];

    return distance;
}

// Поиск лучшего маршрута в колонии
function getBestPath(ants) 
{
    let bestPath = ants[0];
    let bestDistance = calculateDistance(bestPath);
    for (let path of ants) 
    {
        let distance = calculateDistance(path);
        if (distance < bestDistance) 
        {
            bestPath = path;
            bestDistance = distance;
        }
    }
    return bestPath;
}

// Получение соседних, ещё не посещённых муравьём вершин
function getNeighbourVertexes(ant)
{
    let neighbors = [];
    for(let v = 0; v < adj.length; v++)
        if (!ant.includes(v))
            neighbors.push(v);
    return neighbors;
}

// Метод выбора следующей вершины
function makeChoice(ant)
{
    let neighbourVertexes = getNeighbourVertexes(ant);

    // Подсчёт вероятности перехода муравья в соседние вершины
    let choosingProbabilities = new Array(neighbourVertexes.length);
    let wishes = [];
    let summWishes = 0.0;
    for(let neighbour of neighbourVertexes)
    {
        let pheromone = pheromoneMatrix[ant.at(-1)][neighbour];  // Кол-во феромона между текущим городом и neighbour
        let proximity = 1 / adj[ant.at(-1)][neighbour];

        let wish = Math.pow(pheromone, ALPHA) * Math.pow(proximity, BETA)

        wishes.push(wish);
        summWishes += wish;
    }

    let probabilities = [];
    probabilities.push(wishes[0] / summWishes);
    choosingProbabilities[0] = probabilities.at(-1);
    for(let i = 1; i < neighbourVertexes.length; i++)
    {
        probabilities.push(wishes[i] / summWishes);
        choosingProbabilities[i] = choosingProbabilities[i - 1] + probabilities.at(-1);
    }

    //Выбор следующей вершины
    let nextVertex;
    let choose = Math.random();
    for(let i = 0; i < neighbourVertexes.length; i++)
        if (choose <= choosingProbabilities[i])
        {
            nextVertex = neighbourVertexes[i];
            break;
        }

    ant.push(nextVertex);
}

// Глобальное обновление феромонов
function globalUpdatePheromone(lup)
{
    for(let i = 0; i < lup.length; i++)
        for(let j = 0; j < lup.length; j++)
        {
            pheromoneMatrix[i][j] = (1 - EVAPORATION) * pheromoneMatrix[i][j] + lup[i][j];

            if(pheromoneMatrix[i][j] < MIN_PHEROMONE)
                pheromoneMatrix[i][j] = MIN_PHEROMONE;
            else if(pheromoneMatrix[i][j] > MAX_PHEROMONE)
                pheromoneMatrix[i][j] = MAX_PHEROMONE;
        }
}

// Муравьинный алгоритм
async function antAlgorithm()
{
    if (adj.length < 2)
        return;

    initializePheromoneMatrix();

    let iter = 0;
    let stagnation = 0;
    
    let bestPath = [];

    while (!controller.signal.aborted)
    {
        let lup = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0)); // lup - local update pheromone
        let ants = createAnts();

        for(let ant of ants)
        {
            if (controller.signal.aborted)
                break;

            // Проходим каждым муравьём весь путь
            for(let i = 0; i < adj.length - 1; i++)
                makeChoice(ant);

            let dist = calculateDistance(ant);

            // Обновление феромонов
            let T_ijk = Q / dist;
            for(let v = 0; v < ant.length - 1; v++)
            {
                lup[ant[v]][ant[v + 1]] += T_ijk;
                lup[ant[v + 1]][ant[v]] += T_ijk;
            }
            lup[ant.at(-1)][ant[0]] += T_ijk;
            lup[ant[0]][ant.at(-1)] += T_ijk;
        }
        if (controller.signal.aborted)
            break;


        // Проверка на отличие от последнего лучшего найденного пути
        {
            let newBestPath = getBestPath(ants); 
            if (bestPath.length == 0)
                bestPath = newBestPath;
            else
            {
                let newBestDist = calculateDistance(newBestPath);
                let bestDist = calculateDistance(bestPath);
                if (newBestDist >= bestDist)
                    stagnation++;
                else
                {
                    bestPath = newBestPath;
                    stagnation = 0;
                }
            }
        }

        // Если алгоритм застоялся, принимаем меры
        if (stagnation === STAGNATION_TRESHOLD)
        {
            EVAPORATION = BASE_EVAPORATION;
            stagnation = 0;

            initializePheromoneMatrix();

            let dist = calculateDistance(bestPath);
            lup = new Array(adj.length).fill(1 / (1 - EVAPORATION)).map(() => new Array(adj.length).fill(1 / (1 - EVAPORATION)));

            let T_ijk = Q / dist;
            for(let v = 0; v < bestPath.length - 1; v++)
            {
                lup[bestPath[v]][bestPath[v + 1]] += 0.2 * T_ijk;
                lup[bestPath[v + 1]][bestPath[v]] += 0.2 * T_ijk;
            }
            lup[bestPath.at(-1)][bestPath[0]] += 0.2 * T_ijk;
            lup[bestPath[0]][bestPath.at(-1)] += 0.2 * T_ijk;

        }
        else if (stagnation % Math.floor(STAGNATION_TRESHOLD / 10) === 0 && stagnation !== 0)
            EVAPORATION += 0.1;

        
        globalUpdatePheromone(lup);


        // Если пришла пора для отрисовкиы
        if (iter % UPDATE_RATE === 0 && iter !== 0)
        {
            console.log(calculateDistance(bestPath));
            await drawPath(bestPath);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        iter += 1;
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

    
    if(isWorking)
    {   
        controller.abort();
        setTimeout(() =>
        {
            controller = new AbortController();
            antAlgorithm();
        }, 50);
    }
});


controlButton = document.getElementById('control_button');
controlButton.addEventListener('click', () =>
{
    if (!isWorking)
    {
        controlButton.textContent = "STOP";

        controller = new AbortController();
        isWorking = true;
    
        // Берём пользовательские значения констант алгоритма
        {
            ALPHA               = parseInt(document.getElementById('alpha').value);
            BETA                = parseInt(document.getElementById('beta').value);
            Q                   = parseInt(document.getElementById('q').value);
            EVAPORATION         = parseFloat(document.getElementById('evaporation').value);
            BASE_EVAPORATION    = parseFloat(document.getElementById('evaporation').value);
            UPDATE_RATE         = parseInt(document.getElementById('update_rate').value);
            STAGNATION_TRESHOLD = parseInt(document.getElementById('stagnation_treshold').value);
        }
    
        antAlgorithm(); 
    }
    else
    {
        controlButton.textContent = "START";
        controller.abort();
        isWorking = false;
    }
});

document.getElementById('clear_button').addEventListener('click', () =>
{
    controlButton.textContent = "START";
    controller.abort();
    isWorking = false;

    // Подчищаем за собой
    clearCanvas();
    vertexes = [];
    adj = [];
    console.clear();
});