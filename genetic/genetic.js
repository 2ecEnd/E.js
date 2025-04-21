let canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 600;
canvas.width  = 800;
let ctx = canvas.getContext('2d');
let points = []; 
let adj = []; 
//let controller = new AbortController();
let stopFlag = false;

//-=-=-=-Генетический алгоритм-=-=-=-
// Константы для настройки алгоритма
let POPULATION_SIZE = 1000; // Размер популяции
let MUTATION_RATE = 0.1; // Вероятность мутации
let TOURNAMENT_SIZE = 4;

// Генерация случайного числа
function randomNumber(start, end)
{
    return Math.floor(Math.random() * (end - start - 1) + start);
}
//Перемешивание элементов массива
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
// Расчет расстояния для маршрута
function calculateDistance(path) 
{
    let distance = adj[path.at(-1)][path[0]];
    for (let i = 0; i < path.length - 1; i++) 
        distance += adj[path[i]][path[i + 1]];

    return distance;
}

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

// Мутация маршрута
function mutation(path) 
{
    let index1 = randomNumber(0, path.length);
    let index2 = randomNumber(0, path.length);

    let temp = path[index1];
    path[index1] = path[index2];
    path[index2] = temp;
}
// Каластрофическая мутация популяции
function cataclysmicMutation(population) 
{
    for (let i = 1; i < 10; i++)
        population[i] = crossing(population[0], population[i]);

    for (let i = 10; i < population.length; i++)
        shuffle(population[i]);
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

async function genetic(vertexes) 
{
    // Инициализация начальной популяции
    let population = initializePopulation();
    let gen = 1;

    while(!stopFlag)
    //for(let i = 0; i < POPULATION_SIZE; i++)
    {
        // Создание нового поколения
        let newPopulation = [];
        while (newPopulation.length < POPULATION_SIZE) 
        {
            // Выбор родителей
            let parent1 = selectParent(population);
            let parent2 = selectParent(population);
            // Скрещивание родителей
            let child = crossing(parent1, parent2);
            // Применение мутации
            if (Math.random() < MUTATION_RATE) 
                mutation(child);
            newPopulation.push(child);
        }
        // Замена старой популяции новой
        population = newPopulation;
        gen++;

        
        if (gen % 10 === 0)
        {
            // Выбор лучшего маршрута
            let bestPath = getBestPath(population);
            let bestDistance = calculateDistance(bestPath);
            console.log("Поколение " + gen + ": Лучший маршрут = " + bestPath + ", Расстояние = " + bestDistance);
            await drawPath(bestPath);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        sleep(10);
    }
}

function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}


//-=-=-=-Работа с холстом-=-=-=-
// Очистка холста
function clearCanvas() 
{
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Повторная отрисовка всех точек
    ctx.fillStyle = "#5a5a5a";
    ctx.strokeStyle = "rgba(120, 120, 120, 0.2)";
    for(let i in points)
    {
        ctx.beginPath();
        ctx.arc(points[i][0], points[i][1], 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
    }

    // Повторная отрисовка всех рёбер
    ctx.beginPath();
    for(let i = 0; i < points.length; i++)
        for(let j = i + 1; j < points.length; j++)
        {
            ctx.moveTo(points[i][0], points[i][1]);
            ctx.lineTo(points[j][0], points[j][1]);
        }
    ctx.stroke();
    ctx.closePath();
}

async function drawPath(path) 
{
    clearCanvas();
    // Отрисовка найденного пути 
    ctx.strokeStyle = "rgba(0, 155, 0, 0.6)";
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

canvas.addEventListener('click', async function(e)
{
    // Преобразование координат курсора, чтобы точки отрисовывались корректно
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    const currX = (e.clientX - rect.left) * scaleX;
    const currY = (e.clientY - rect.top) * scaleY;

    // Очищаем холст
    clearCanvas();

    // Добавлям точку в мартрицу смежности
    points.push([currX, currY]);

    // Обновляем матрицу смежности
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

    // Отрисовка точки в месте клика 
    ctx.fillStyle = "#5a5a5a";
    ctx.beginPath();
    ctx.arc(currX, currY, 5, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.closePath();

    // Отрисовка рёбер
    ctx.beginPath();
    ctx.strokeStyle = "rgba(120, 120, 120, 0.2)";
    for(let i = 0; i < points.length - 1; i++)
    {
        ctx.moveTo(currX, currY);
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
    ctx.closePath();
});

document.getElementById('start').addEventListener('click', async function(e)
{
    // Отменяем перезагрузку страницы
    e.preventDefault(); 

    stopFlag = false;
    await genetic(points); 
    //await new Promise(resolve => setTimeout(resolve, 0));
});
document.getElementById('stop').addEventListener('click', async function(e)
{
    // Отменяем перезагрузку страницы
    e.preventDefault(); 

    stopFlag = true;
});