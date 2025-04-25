// TODO:
// Улучшить скрещивание особей
// Увеличить гибкость мутации
// Проверить читаемость кода
// Добавить опсиание алгоритма

var vertexes = []; 
var adj = []; 

var controller = new AbortController();
var isWorking = false;

//-=-=-=-=-=- Утилитарные функции -=-=-=-=-=-
// Генерация случайного числа в пределах [start; end)
function randomNumber(start, end)
{
    return Math.floor(Math.random() * (end - start - 1) + start);
}

// Перемешивание элементов массива
function shuffle(array) 
{
    for(let i in array)
    {
        let j = Math.floor(Math.random() * array.length);

        [array[i], array[j]] = [array[j], array[i]];
    }
}


//-=-=-=-=-=- Генетический алгоритм -=-=-=-=-=-
// Базовые значения констант для алгоритма
let POPULATION_SIZE     = 1000; // Размер популяции
let MUTATION_RATE       = 0.1;  // Вероятность мутации
let TOURNAMENT_SIZE     = 16;   // Размер турнира для выбора родителя
let UPDATE_RATE         = 5;    // Спустя сколько итераций будет отрисовываться найденный путь
let STAGNATION_TRESHOLD = 100;  // Сколько поколений без изменения результата нужно, для запуска агрессивной мутации

// Инициализация начальной популяции случайными маршрутами
function initializePopulation() 
{
    let population = [];
    for (let i = 0; i < POPULATION_SIZE; i++) 
    {
        let path = [];
        for (let j in adj) 
            path.push(j);
        shuffle(path); // Перемешивание городов

        population.push(path);
    }
    return population;
}

// Расчет расстояния для маршрута
function calculateDistance(path) 
{
    let distance = adj[path.at(-1)][path[0]];
    for (let i = 0; i < path.length - 1; i++) 
        distance += adj[path[i]][path[i + 1]];

    return distance;
}

// Поиск лучшего маршрута в популяции
function getBestPath(population) 
{
    let bestPath = population[0];
    let bestDistance = calculateDistance(bestPath);
    for (let path of population) 
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

// Выбор родителя из популяции турнирным способом
function selectParent(population) 
{
    let candidates = [];
    for(let i = 0; i < TOURNAMENT_SIZE; i++)
        candidates.push(population[Math.floor(Math.random() * (population.length - 1))]);

    let winner = 0; //Индекс победителя турнира
    let minDist = calculateDistance(candidates[0]);
    for (let i = 1; i < candidates.length; i++)
    {
        let tmpDist = calculateDistance(candidates[i]);
        if (tmpDist < minDist)
        {
            winner = i;
            minDist = tmpDist;
        }
    }

    return candidates[winner];
}

// Скрещивание двух родителей для создания потомка
function crossing(parent1, parent2) 
{
    let child = new Array(parent1.length).fill(-1);
    let start = randomNumber(0, parent1.length);
    let end = randomNumber(0, parent1.length);
    if (start > end) 
        [start, end] = [end, start];

    // Копирование части маршрута из первого родителя
    for (let i = start; i < end; i++) 
        child[i] = parent1[i];

    // Заполнение оставшихся городов из второго родителя
    let childIndex = 0;
    for (let i = 0; i < parent2.length; i++) 
    {
        let currentCity = parent2[i];
        if (!child.includes(currentCity)) 
        {
            while (child[childIndex] != -1) 
                childIndex++;
            child[childIndex] = currentCity;
        }
    }

    return child;
}

// Динамическая мутация маршрута
function adaptiveMutation(path) 
{
    // Мутация перестановкой
    function swapMutatuon()
    {
        const i = randomNumber(0, path.length);
        const j = randomNumber(0, path.length);
    
        [path[i], path[j]] = [path[j], path[i]];
    }

    // Мутация вставкой
    function insertionMutatuon()
    {
        const i = randomNumber(0, path.length);
        const j = randomNumber(0, path.length);

        let tmp = path[i];
    
        path.splice(i, 1);
        path.splice(j, 0, tmp);
    }

    // Мутация инверсией подмассива
    function inverseMutation()
    {
        let i = randomNumber(0, path.length - 2);
        let j = randomNumber(i + 1, path.length);
        
        let subPath = path.slice(i, j);
        subPath.reverse();

        path.splice(i, j-i);
        path.splice(i, 0, ...subPath);
    }
    
    // Мутация перемешиванием подмассива
    function scrambleMutation()
    {
        let i = randomNumber(0, path.length - 2);
        let j = randomNumber(i + 1, path.length);
        
        let subPath = path.slice(i, j);
        shuffle(subPath);
        
        path.splice(i, j-i);
        path.splice(i, 0, ...subPath);
    }

    let prob = Math.random();
    if (adj.length < 20)
    {
        if (prob < 0.5)
            swapMutatuon();
        else
            insertionMutatuon();
    }
    else
    {
        if (prob < 0.33)
            insertionMutatuon();
        else if (prob < 0.66)
            inverseMutation();
        else
            scrambleMutation();
    }
}

// Катастрофическая мутация популяции (чтобы выходить из локального минимума)
function cataclysmicMutation(population) 
{
    let newPopulation = initializePopulation();
    newPopulation[0] = getBestPath(population);
    population = newPopulation;
}

// Решение задачи коммивояжёра жадным алгоритмом
function greedyAlgorithm()
{
    let path = [0];
    let visited = new Set();
    visited.add(0);
    for(let i = 1; i < adj.length; i++)
    {
        let v = path.at(-1);

        let minDist = Infinity;
        let nearestVertex;
        for(let u = 0; u < adj.length; u++)
        {
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

// Непосредственно алгоритм
async function genetic() 
{
    controller = new AbortController();
    isWorking = true;
    
    // Инициализация начальной популяции путём, найденным жадным алгоритмом (сразу близким к оптимальному)
    let bestPath = greedyAlgorithm();
    let population = [];
    for(let i = 0; i < adj.length; i++)
        population.push(bestPath);
    let gen = 0;
    let stagnation = 0;

    while(!controller.signal.aborted)
    {
        // Создание нового поколения
        let newPopulation = [];
        for(let i = 0; i < POPULATION_SIZE; i++)
        {
            if (controller.signal.aborted)
                return;

            // Выбор родителей
            let parent1 = selectParent(population);
            let parent2 = selectParent(population);

            // Скрещивание родителей
            let child = crossing(parent1, parent2);

            // Применение мутации
            if (Math.random() < MUTATION_RATE) 
                adaptiveMutation(child);

            newPopulation.push(child);
        }

        // Замена старой популяции новой
        population = newPopulation;

        // Проверка на отличие от последнего лучшего найденного пути
        let newBestPath = getBestPath(population);
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
            cataclysmicMutation(population);
            stagnation = 0;
        }
        
        // Если пришла пора для отрисовки
        if (gen % UPDATE_RATE === 0)
        {
            let bestDistance = calculateDistance(bestPath);
            console.log(bestDistance);
            await drawPath(bestPath);
        }
        await new Promise(resolve => setTimeout(resolve,1));

        gen++;
    }
}