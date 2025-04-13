let canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 600;
canvas.width  = 800;
let ctx = canvas.getContext('2d');
let points = []; 
let stopFlag = false;

//-=-=-=-Генетический алгоритм-=-=-=-
class GeneticAlgorithm
{
    // Константы для настройки алгоритма
    POPULATION_SIZE = 100; // Размер популяции
    MUTATION_RATE = 0.1; // Вероятность мутации

    constructor(vertexes)
    {
        this.adj = [];
        for(let i in vertexes)
        {
            let row = []
            for(let j in vertexes)
                row.push(((vertexes[i][0] - vertexes[j][0]) ** 2 + (vertexes[i][1] - vertexes[j][1]) ** 2) ** 0.5);
            this.adj.push(row);
        }
    }

    randomNumber(start, end)
    {
        return Math.floor(Math.random() * (end - start - 1) + start);
    }
    
    shuffle(array) 
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

    // Инициализация начальной популяции случайными маршрутами
    initializePopulation() 
    {
        let population = [];
        for (let i = 0; i < this.POPULATION_SIZE; i++) 
        {
            let path = [];
            for (let j = 0; j < this.adj.length; j++) 
                path.push(j);
            this.shuffle(path); // Перемешивание городов
            population.push(path);
        }
        return population;
    }

    // Выбор родителя из популяции
    selectParent(population) 
    {
        return population[this.randomNumber(0, population.length - 1)];
    }

    // Скрещивание двух родителей для создания потомка
    crossing(parent1,  parent2) 
    {
        let child = new Array(parent1.length).fill(-1);
        let start = this.randomNumber(0, parent1.length);
        let end = this.randomNumber(0, parent1.length);
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
    mutate(path) 
    {
        let index1 = this.randomNumber(0, path.length);
        let index2 = this.randomNumber(0, path.length);

        let temp = path[index1];
        path[index1] = path[index2];
        path[index2] = temp;
    }

    // Поиск лучшего маршрута в популяции
    getBestPath(population) 
    {
        let bestPath = population[0];
        let bestDistance = this.calculateDistance(bestPath);
        for (let path of population) 
        {
            let distance = this.calculateDistance(path);
            if (distance < bestDistance) 
            {
                bestPath = path;
                bestDistance = distance;
            }
        }
        return bestPath;
    }

    // Расчет расстояния для маршрута
    calculateDistance(path) 
    {
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) 
            distance += this.adj[path[i]][path[i + 1]];
        return distance;
    }

    async genetic() 
    {
        // Инициализация начальной популяции
        let population = this.initializePopulation();
        let gen = 1;
        //while(!stopFlag)
        for(let i = 0; i < this.POPULATION_SIZE; i++)
        {
            // Создание нового поколения
            let newPopulation = [];
            while (newPopulation.length < this.POPULATION_SIZE) 
            {
                // Выбор родителей
                let parent1 = this.selectParent(population);
                let parent2 = this.selectParent(population);
                // Скрещивание родителей
                let child = this.crossing(parent1, parent2);
                // Применение мутации
                if (Math.random() < this.MUTATION_RATE) 
                    this.mutate(child);
                newPopulation.push(child);
            }
            // Замена старой популяции новой
            population = newPopulation;
            // Выбор лучшего маршрута
            let bestPath = this.getBestPath(population);
            let bestDistance = this.calculateDistance(bestPath);
            console.log("Поколение " + gen + ": Лучший маршрут = " + bestPath + ", Расстояние = " + bestDistance);
            gen++;


            clearCanvas();
            // Отрисовка найденного пути 
            ctx.strokeStyle = "rgba(0, 155, 0, 0.6)";
            ctx.beginPath();
            for(let point = 0; point < bestPath.length - 1; point++)
            {
                ctx.moveTo(points[bestPath[point]][0], points[bestPath[point]][1]);
                ctx.lineTo(points[bestPath[point + 1]][0], points[bestPath[point + 1]][1]);
            }   
            ctx.moveTo(points[bestPath.at(-1)][0], points[bestPath.at(-1)][1]);
            ctx.lineTo(points[bestPath[0]][0], points[bestPath[0]][1]);
            ctx.stroke(); 
            ctx.closePath();

            //sleep(100);
        }
    }
}

function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

//-=-=-=-Работа с холстом-=-=-=-
// Очистка холста
async function clearCanvas() 
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

    // Составление матрицы смежности
    let GA = new GeneticAlgorithm(points);

    GA.genetic(); 
});
document.getElementById('stop').addEventListener('click', async function(e)
{
    // Отменяем перезагрузку страницы
    e.preventDefault(); 

    stopFlag = true; 
});