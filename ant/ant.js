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
    makeChoice(adj, pheromoneMatrix, a, b)
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
            this.path.push(this.start);
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

            wishes.push(Math.pow(pheromone, a) * Math.pow(proximity, b));
            summWishes += wishes.at(-1);
        }
        for(let i = 0; i < neighborVertexes.length; i++)
        {
            probability.push(wishes[i] / summWishes);
            if (i == 0)
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
    kAlpha;
    kBeta;
    kPheromone = 1;
    kQ;
    kEvaporation;

    adj = [];
    pheromoneMatrix = [];

    ants = [];

    constructor(adj, alpha, beta, Q, evaporation)
    {
        this.adj = adj;
        this.kAlpha = alpha;
        this.kBeta = beta;
        this.kQ = Q;
        this.kEvaporation = evaporation;

        for(let i = 0; i < this.adj.length; i++)
        {
            let row = []
            for(let j = 0; j < this.adj.length; j++)
                if (i == j)
                    row.push(0.0);
                else
                    row.push(this.kQ);
            this.pheromoneMatrix.push(row);
        }
    }

    createAnts()
    {
        this.ants = [];
        for(let i = 0; i < this.adj.length; i++)
            this.ants.push(new Ant(i));
    }

    updatePheromone(lup)
    {
        for(let i = 0; i < lup.length; i++)
            for(let j = 0; j < lup.length; j++)
            {
                this.pheromoneMatrix[i][j] = (1 - this.kEvaporation) * this.pheromoneMatrix[i][j] + lup[i][j];
                if(this.pheromoneMatrix[i][j] < 0.01 && i != j)
                    this.pheromoneMatrix[i][j] = 0.01;
            }
    }

    solveSalesmansProblem()
    {
        if (this.adj.length == 0)
            return;

        const maxIter = 100; // Через какое кол-во итераций прекратить после того, как путь перестал улучшаться
        let iter = 0;
        
        let path = [];
        let distance = Infinity;

        while (iter < maxIter)
        {
            iter += 1;
            let lup = []; // lup - local update pheromone 
            for(let i = 0; i < this.adj.length; i++)
            {
                let row = []
                for(let j = 0; j < this.adj.length; j++)
                    row.push(0);
                lup.push(row);
            }
            this.createAnts();

            for(let ant of this.ants)
            {
                // Проходим каждым муравьём весь путь
                while(ant.canContinue)
                    ant.makeChoice(this.adj, this.pheromoneMatrix, this.kAlpha, this.kBeta);

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
                    if (v == ant.path.length - 2)
                    {
                        lup[ant.path[v]][ant.path[0]] += this.kQ / ant.distance;
                        lup[ant.path[0]][ant.path[v]] += this.kQ / ant.distance;
                    }
                    else
                    {
                        lup[ant.path[v]][ant.path[v + 1]] += this.kQ / ant.distance;
                        lup[ant.path[v + 1]][ant.path[v]] += this.kQ / ant.distance;
                    }
                }
            }
            this.updatePheromone(lup);
        }

        return path;
    }
}

async function clearCanvas() 
{
    // Очистка холста
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

// Инициализация холста
let canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 600;
canvas.width  = 800;

// Точки, которые пользователь ставит на холсте
let points = []; 

//Работа с холстом
let ctx = canvas.getContext('2d');
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

    // Пушим точку в массив
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


// Активация алгоритма
document.getElementById('dataForm').addEventListener('submit', async function(e)
{
    // Отменяем перезагрузку страницы
    e.preventDefault(); 

    // Составление матрицы смежности
    adj = [];
    for(let i in points)
    {
        let row = []
        for(let j in points)
            row.push(((points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2) ** (0.5))
        adj.push(row);
    }

    // Инициализируем колонию
    let antColony = new AntColonyOptimization
    (
        adj, 
        parseInt(document.getElementById('alpha').value),
        parseInt(document.getElementById('beta').value),
        parseInt(document.getElementById('q').value),
        parseInt(document.getElementById('evaporation').value),
    );

    // Решение задачи
    let path = antColony.solveSalesmansProblem();

    // Очищаем холст
    clearCanvas();

    // Отрисовка найденного пути 
    ctx.strokeStyle = "rgba(0, 155, 0, 0.6)";
    ctx.beginPath();
    for(let point in path)
    {
        point = Number(point)
        ctx.moveTo(points[path[point]][0], points[path[point]][1]);
        if(point == path.length - 1)
            ctx.lineTo(points[path[0]][0], points[path[0]][1]);
        else
            ctx.lineTo(points[path[point + 1]][0], points[path[point + 1]][1]);
    }   
    ctx.stroke(); 
    ctx.closePath();   
});

const arrow = document.getElementById("arrow");

arrow.addEventListener('click', async function(){
    document.getElementById("header").classList.toggle("active");
});