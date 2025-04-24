// TODO:
// Улучшить скрещивание особей
// Увеличить гибкость мутации
// Добавить элитизм
// Проверить читаемость кода
// Добавить опсиание алгоритма

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

//-=-=-=-=-=- Утилитарные функции -=-=-=-=-=-
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


//-=-=-=-=-=- Генетический алгоритм -=-=-=-=-=-
// Базовые значения констант для алгоритма
let POPULATION_SIZE     = 1000; // Размер популяции
let MUTATION_RATE       = 0.1;  // Вероятность мутации
let TOURNAMENT_SIZE     = 16;   // Размер турнира для выбора родителя
let UPDATE_RATE         = 5;    // Спустя сколько итераций будет отрисовываться найденный путь
let STAGNATION_TRESHOLD = 0;    // Сколько поколений без изменения результата нужно, для запуска агрессивной мутации

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
    let bestPath = [];

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
        if (bestPath.length == 0)
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
        if (gen % UPDATE_RATE === 0 && gen != 0)
        {
            let bestDistance = calculateDistance(bestPath);
            console.log(bestDistance);
            await drawPath(bestPath);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        gen++;
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
async function drawPath(path) 
{
    clearCanvas();
    drawVertexes();
    //drawEdges();

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
canvas.addEventListener('click', function(e)
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
            genetic();
        }, 50);
    }
});

controlButton = document.getElementById('control_button');
controlButton.addEventListener('click', () =>
{
    if (!isWorking)
    {
        // Валидация ввода
        if (isNaN(parseInt(document.getElementById('popilation_size').value)) || 
            isNaN(parseFloat(document.getElementById('mutation_rate').value)) || 
            isNaN(parseInt(document.getElementById('tournament_size').value)) || 
            isNaN(parseInt(document.getElementById('update_rate').value)) || 
            isNaN(parseInt(document.getElementById('stagnation_treshold').value)))
            {
                showError("Неккоректный ввод данных! Пожалуйста, введите числа!");
                return;
            }

        controlButton.textContent = "ОСТАНОВИТЬ";

        controller = new AbortController();
        isWorking = true;
    
        // Берём пользовательские значения констант алгоритма
        {
            POPULATION_SIZE     = parseInt(document.getElementById('popilation_size').value);
            MUTATION_RATE       = parseFloat(document.getElementById('mutation_rate').value);
            TOURNAMENT_SIZE     = parseInt(document.getElementById('tournament_size').value);
            UPDATE_RATE         = parseInt(document.getElementById('update_rate').value);
            STAGNATION_TRESHOLD = parseInt(document.getElementById('stagnation_treshold').value);
        }
    
        genetic(); 
    }
    else
    {
        controlButton.textContent = "НАЧАТЬ";
        controller.abort();
        isWorking = false;
    }
});

document.getElementById('clear_button').addEventListener('click', () =>
{
    controlButton.textContent = "НАЧАТЬ";
    controller.abort();
    isWorking = false;

    // Подчищаем за собой
    clearCanvas();
    vertexes = [];
    adj = [];
    console.clear();
});