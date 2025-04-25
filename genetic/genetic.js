// TODO:
// Улучшить скрещивание особей
// Увеличить гибкость мутации
// Добавить элитизм
// Проверить читаемость кода
// Добавить опсиание алгоритма

let vertexes = []; 
let adj = []; 

let controller = new AbortController();
let isWorking = false;

let vertexColor = "rgb(0, 0, 0)";
let edgeColor   = "rgba(160, 160, 160, 0.1)";
let pathColor   = "rgba(0, 200, 0, 0.8)";

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
    // "Лёгкая" мутация путём смены мест двух вершин 
    function lightMutation()
    {
        const i = randomNumber(0, path.length);
        const j = randomNumber(0, path.length);
    
        [path[i], path[j]] = [path[j], path[i]];
    }

    // "Тяжёлая" (Агрессивная) мутация путём инверсии подмассива
    function hardMutation()
    {
        let i = randomNumber(0, path.length - 1);
        let j = randomNumber(i + 1, path.length);
        
        while (i < j)
        {
            [path[i], path[j]] = [path[j], path[i]];
            i++;
            j--;
        }
    }

    if (adj.length < 20)
        lightMutation();
    else
        hardMutation();
}

// Катастрофическая мутация популяции (чтобы выходить из локального минимума)
function cataclysmicMutation(population) 
{
    let newPopulation = initializePopulation();
    newPopulation[0] = getBestPath(population);
    population = newPopulation;
}

// Непосредственно алгоритм
async function genetic() 
{
    // Инициализация начальной популяции
    let population = initializePopulation();
    let gen = 0;
    let stagnation = 0;
    let bestPath = [];

    while(!controller.signal.aborted)
    {
        // Создание нового поколения
        let newPopulation = [];
        for(let i = 0; i < POPULATION_SIZE; i++)
        {
            if (controller.signal.aborted)
                break;

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
        if (controller.signal.aborted)
            break;

        // Замена старой популяции новой
        population = newPopulation;

        // Проверка на отличие от последнего лучшего найденного пути
        let newBestPath = getBestPath(population);
        if (bestPath.length === 0)
            bestPath = newBestPath;
        else
        {
            if (calculateDistance(bestPath) === calculateDistance(newBestPath))
                stagnation++;
            else
            {
                stagnation = 0;
                bestPath = newBestPath;
            }
        }

        // Если алгоритм застоялся, принимаем меры
        if (stagnation === STAGNATION_TRESHOLD)
        {
            cataclysmicMutation(population);
            stagnation = 0;
        }
        
        // Если пришла пора для отрисовкиы
        if (gen % UPDATE_RATE === 0 && gen !== 0)
        {
            let bestDistance = calculateDistance(bestPath);
            console.log(bestDistance);
            await drawPath(bestPath);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        gen++;
    }
}