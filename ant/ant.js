var points = [];

var canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 480;
canvas.width  = 640;

var context = example.getContext('2d');
canvas.addEventListener('click', function(e)
{
    let currX = e.x - 8, currY = e.y - 8;

    // Отрисовка точки в месте клика 
    // Сдвиг на 8 нужен для того, центр точки был ровно на курсоре
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