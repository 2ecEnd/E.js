// TODO:
// Элитарность
// Бинарный поиск в выборе следующей вершины
// Заменить список соседних вершин на множество соседних вершин
// Может быть 2-opt (слишком затратно)

var vertexes = []; 
var adj = []; 

var controller = new AbortController();
var isWorking = false;


//-=-=-=-=-=- Муравьинный алгоритм -=-=-=-=-=-
let ALPHA               = 1;    // В эту степень возмодится кол-во феромонов между i и j городами
let BETA                = 3;    // В эту степень возводится близость между i и j городами
let PHEROMONE_0         = 1;    // Базовое значение феромонов
let Q                   = 1000; // Константа, которая делится на длину пути, пройденного муравьём
let EVAPORATION         = 0.1;  // Коэффициент испарения феромонов
let BASE_EVAPORATION    = EVAPORATION;
let UPDATE_RATE         = 5;    // Спустя сколько итераций будет отрисовываться найденный путь
let STAGNATION_TRESHOLD = 100;  // Сколько поколений без изменения результата нужно, для запуска агрессивной мутации
let DRAW_EDGES          = false;// Нужно ли отрисовывать рёбра

const MAX_PHEROMONE = 10;
const MIN_PHEROMONE = 0.1;

let pheromoneMatrix = new Array();

// Инициализация матрицы феромонов начальными значениями
function initializePheromoneMatrix()
{
    pheromoneMatrix = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0));
    for(let i = 0; i < adj.length; i++)
    {
        if(controller.signal.aborted)
            return;
        
        for(let j = 0; j < adj.length; j++)
        {
            if(controller.signal.aborted)
                return;

            if (i !== j)
                pheromoneMatrix[i][j] = PHEROMONE_0;
        }
    }
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
        if(controller.signal.aborted)
            return;

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
    {
        if(controller.signal.aborted)
            return;

        if (!ant.includes(v))
            neighbors.push(v);
    }
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
        if(controller.signal.aborted)
            return;

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
        if(controller.signal.aborted)
            return;

        probabilities.push(wishes[i] / summWishes);
        choosingProbabilities[i] = choosingProbabilities[i - 1] + probabilities.at(-1);
    }

    // Выбор следующей вершины бинарным поиском
    let choose = Math.random();
    let left = 0;
    let right = neighbourVertexes.length - 1
    let mid = Math.floor((left + right) / 2);

	while (left <= right)
	{
        if(controller.signal.aborted)
            return;

	 	mid = Math.floor((left + right) / 2);

	 	if (choosingProbabilities[mid] > choose)
	 		right = mid - 1;
		else if (choosingProbabilities[mid] < choose)
	 		left = mid + 1;
	}
    ant.push(neighbourVertexes[left]);

    /*let choose = Math.random();
    let nextVertex;
    for(let i = 0; i < neighbourVertexes.length; i++)
        if (choose <= choosingProbabilities[i])
        {
            nextVertex = neighbourVertexes[i];
            break;
        }

    ant.push(nextVertex);*/
}

// Глобальное обновление феромонов
function globalUpdatePheromone(lup)
{
    for(let i = 0; i < lup.length; i++)
    {
        if(controller.signal.aborted)
            return;
        
        for(let j = 0; j < lup.length; j++)
            {
                if(controller.signal.aborted)
                    return;
                
                pheromoneMatrix[i][j] = (1 - EVAPORATION) * pheromoneMatrix[i][j] + lup[i][j];
    
                if(pheromoneMatrix[i][j] < MIN_PHEROMONE)
                    pheromoneMatrix[i][j] = MIN_PHEROMONE;
                else if(pheromoneMatrix[i][j] > MAX_PHEROMONE)
                    pheromoneMatrix[i][j] = MAX_PHEROMONE;
            }
    }
}

// Локальное обновление феромонов
function localUpdatePheromone(lup, path, coef = 1)
{
    let distance = calculateDistance(path)
    let T_ijk = Q / distance;
    for(let v = 0; v < adj.length - 1; v++)
    {
        lup[path[v]][path[v + 1]] += coef * T_ijk;
        lup[path[v + 1]][path[v]] += coef * T_ijk;
    }
    lup[path.at(-1)][path[0]] += coef * T_ijk;
    lup[path[0]][path.at(-1)] += coef * T_ijk;
}

// Решение задачи коммивояжёра жадным алгоритмом
function greedyAlgorithm()
{
    let path = [0];
    let visited = new Set();
    visited.add(0);
    for(let i = 1; i < adj.length; i++)
    {
        if(controller.signal.aborted)
            return;

        let v = path.at(-1);

        let minDist = Infinity;
        let nearestVertex;
        for(let u = 0; u < adj.length; u++)
        {
            if(controller.signal.aborted)
                return;
            if(visited.has(u))
                continue;

            if (adj[v][u] < minDist)
            {
                minDist = adj[v][u];
                nearestVertex = u
            }
        }

        path.push(nearestVertex);
        visited.add(nearestVertex);
    }

    return path;
}

// Муравьинный алгоритм
async function antAlgorithm()
{
    controller = new AbortController();
    isWorking = true;

    initializePheromoneMatrix();

    let iter = 0;
    let stagnation = 0;
    
    let bestPath = greedyAlgorithm();

    while (!controller.signal.aborted)
    {
        let lup = new Array(adj.length).fill(0).map(() => new Array(adj.length).fill(0)); // lup - local update pheromone
        let ants = createAnts();

        for(let ant of ants)
        {
            if (controller.signal.aborted)
                return;

            // Проходим каждым муравьём весь путь
            for(let i = 0; i < adj.length - 1; i++)
                makeChoice(ant);

            let dist = calculateDistance(ant);

            // Обновление феромонов
            localUpdatePheromone(lup, ant);
        }

        // Проверка на отличие от последнего лучшего найденного пути
        let newBestPath = getBestPath(ants);
        if (calculateDistance(newBestPath) >= calculateDistance(bestPath))
            stagnation++;
        else
        {
            stagnation = 0;
            bestPath = newBestPath;
        }

        // Если алгоритм застоялся, принимаем меры
        if (stagnation === STAGNATION_TRESHOLD)
        {
            EVAPORATION = BASE_EVAPORATION;
            stagnation = 0;

            initializePheromoneMatrix();

            lup = new Array(adj.length).fill(1 / (1 - EVAPORATION)).map(() => new Array(adj.length).fill(1 / (1 - EVAPORATION)));

            localUpdatePheromone(lup, bestPath, 0.1);

        }
        else if (stagnation % Math.floor(STAGNATION_TRESHOLD / 10) === 0 && stagnation !== 0)
            EVAPORATION += 0.1;


        globalUpdatePheromone(lup);


        // Если пришла пора для отрисовкиы
        if (iter % UPDATE_RATE === 0)
        {
            console.log(calculateDistance(bestPath));
            await drawPath(bestPath);
        }
        await new Promise(resolve => setTimeout(resolve,1));
        
        iter += 1;
    }

    isWorking = false;
}