//Работа с холстом
var points = [];

var canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 480;
canvas.width  = 640;

var context = example.getContext('2d');
canvas.addEventListener('click', function(e)
{
    // Сдвиг на 8 нужен для того, центр точки был ровно на курсоре
    let currX = e.x - 8, currY = e.y - 8;

    // Отрисовка точки в месте клика 
    context.fillStyle = "#5a5a5a";
    context.beginPath();
    context.arc(currX, currY, 5, 0, 2 * Math.PI, true);
    context.fill();
    context.closePath();

    // Пушим точку в массив
    points.push([currX, currY]);

    let index = 0;
    context.strokeStyle = "rgba(120, 120, 120, 0.1)";
    while (index < points.length - 1)
    {
        context.moveTo(currX, currY);
        context.lineTo(points[index][0], points[index][1]);
        context.stroke();

        index++;
    }
});


// Активация алгоритма
var button = document.getElementById('start');
button.addEventListener('click', function(e)
{
    // Составление матрицы смежности
    adj = [];
    for(let i in points)
    {
        let row = []
        for(let j in points)
            row.push(((points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2) ** (0.5))
        adj.push(row);
    }

    for(let i in points)
    {
        let row = '';
        for(let j in points)
            row += ' ' + adj[i][j].toFixed(3);
        console.log(row);
    }
});