let canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 720;
canvas.width  = 1280;
let ctx = canvas.getContext('2d');

let points = []; 
let adj = []; 

let controller = new AbortController();

let pointColor  = "rgb(0, 0, 0)";
let edgeColor   = "rgba(160, 160, 160, 0.1)";
let pathColor   = "rgba(0, 200, 0, 0.8)";

// -=-=-=-Утилитарные функции-=-=-=-
// Генерация случайного числа в пределах [start; end)
function randomNumber(start, end)
{
    return Math.floor(Math.random() * (end - start - 1) + start);
}

// Перемешивание элементов массива
function shuffle(array) 
{
    let currentIndex = array.length;
    while (currentIndex !== 0) 
    {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        let temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }
}

// "Усыпить" поготок на n мс
function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Расчет расстояния для маршрута
function calculateDistance(path) 
{
    let distance = adj[path.at(-1)][path[0]];
    for (let i = 0; i < path.length - 1; i++) 
        distance += adj[path[i]][path[i + 1]];

    return distance;
}


//-=-=-=-Генетический алгоритм-=-=-=-
// Базовые значения констант для алгоритма
let POPULATION_SIZE     = 1000; // Размер популяции
let MUTATION_RATE       = 0.1;  // Вероятность мутации
let STAGNATION_TRESHOLD = 0;    // Сколько поколений без изменения результата нужно, для запуска агрессивной мутации
let TOURNAMENT_SIZE     = 16;   // Размер турнира для выбора родителя
let UPDATE_RATE         = 50;   // Размер турнира для выбора родителя

// Инициализация начальной популяции случайными маршрутами
function initializePopulation() 
{
    let population = [];
    for (let i = 0; i < POPULATION_SIZE; i++) 
    {
        let path = [];
        for (let j = 0; j < adj.length; j++) 
            path.push(j);
        shuffle(path); // Перемешивание городов

        population.push(path);
    }
    return population;
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
    {
        let temp = start;
        start = end;
        end = temp;
    }

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
function adaptiveMutation(path, cataclysmic = false) 
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

    if (cataclysmic)
    {
        let r;
    }
    else
    {
        if (points.length <= 15)
            lightMutation();
        else
            hardMutation();
    }
}
// Катастрофическая мутация популяции (чтобы выходить из локального минимума)
function cataclysmicMutation(population) 
{
    let newPopulation = initializePopulation();
    newPopulation[0] = getBestPath(population);
    population = newPopulation;
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

// Непосредственно алгоритм
async function genetic() 
{
    // Инициализация начальной популяции
    let population = initializePopulation();
    let gen = 0;
    let stagnation = 0;
    let bestPath;

    while(true)
    {
        if (controller.signal.aborted)
            break;

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
        if (bestPath === newBestPath)
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
        
        // Если пришла пора для отрисовкиы
        if (gen % UPDATE_RATE === 0)
        {
            let bestDistance = calculateDistance(bestPath);
            console.log(bestDistance);
            await drawPath(bestPath);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        gen++;
    }
}


//-=-=-=-Работа с холстом-=-=-=-
// Очистка холста
function clearCanvas() 
{
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Отрисовка графа
function drawGraph()
{
    // Отрисовка всех рёбер
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i = 0; i < points.length; i++)
        for(let j = i + 1; j < points.length; j++)
        {
            ctx.moveTo(points[i][0], points[i][1]);
            ctx.lineTo(points[j][0], points[j][1]);
        }
    ctx.stroke();
    ctx.closePath();

    // Отрисовка всех точек
    ctx.fillStyle = "#5a5a5a";
    ctx.strokeStyle = pointColor;
    for(let i in points)
    {
        ctx.beginPath();
        ctx.arc(points[i][0], points[i][1], 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
    }
}

// Отрисовка найденного пути
async function drawPath(path) 
{
    clearCanvas();
    drawGraph();

    // Отрисовка найденного пути 
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let point = 0; point < path.length - 1; point++)
    {
        ctx.moveTo(points[path[point]][0], points[path[point]][1]);
        ctx.lineTo(points[path[point + 1]][0], points[path[point + 1]][1]);
    }   
    ctx.moveTo(points[path.at(-1)][0], points[path.at(-1)][1]);
    ctx.lineTo(points[path[0]][0], points[path[0]][1]);
    ctx.stroke(); 
    ctx.closePath();
}


//-=-=-=-Взаимодействие с пользователем-=-=-=-
canvas.addEventListener('click', function(e)
{
    // Преобразование координат курсора, чтобы точки отрисовывались корректно
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    const currX = (e.clientX - rect.left) * scaleX;
    const currY = (e.clientY - rect.top) * scaleY;

    // Добавлям точку в список точек
    points.push([currX, currY]);

    // Обновляем матрицу смежности
    {
        for(let i = 0; i < adj.length; i++)
        {
            let dist = ((points[i][0] - points.at(-1)[0]) ** 2 + (points[i][1] - points.at(-1)[1]) ** 2) ** 0.5;
            adj[i].push(dist);
        }
        let newRow = [];
        for(let i = 0; i < points.length; i++)
        {
            let dist = ((points[i][0] - points.at(-1)[0]) ** 2 + (points[i][1] - points.at(-1)[1]) ** 2) ** 0.5;
            newRow.push(dist);
        }
        adj.push(newRow);
    }

    //drawGraph();
    
    // Отрисовка точки в месте клика     
    ctx.beginPath();
    ctx.arc(currX, currY, 5, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.closePath();

    
    if(!controller.signal.aborted)
    {   
        controller.abort();
        setTimeout(() =>
        {
            controller = new AbortController();
            genetic();
        }, 50);
    }
});

document.getElementById('start').addEventListener('click', function(e)
{
    controller = new AbortController();

    // Берём пользовательские значения констант алгоритма
    {
        POPULATION_SIZE     = parseInt(document.getElementById('popilation_size').value);
        MUTATION_RATE       = parseFloat(document.getElementById('mutation_rate').value);
        STAGNATION_TRESHOLD = parseInt(document.getElementById('stagnation_treshold').value);
        TOURNAMENT_SIZE     = parseInt(document.getElementById('tournament_size').value);
        UPDATE_RATE         = parseInt(document.getElementById('update_rate').value);
    }

    genetic(); 
});

document.getElementById('stop').addEventListener('click', function(e)
{
    controller.abort();
});

document.getElementById('clear').addEventListener('click', function(e)
{
    controller.abort();

    // Подчищаем за собой
    clearCanvas();
    points = [];
    adj = [];
    console.clear();
});