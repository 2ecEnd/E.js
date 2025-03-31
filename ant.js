var canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 480;
canvas.width  = 640;

var contex = example.getContext('2d');
canvas.addEventListener('click', function(e){
    // Отрисовка точки в месте клика 
    // Сдвиг на 8 нужен для того, центр точки был ровно на курсоре
    contex.beginPath();
    contex.arc(e.x - 8, e.y - 8, 5, 0, 2 * Math.PI, true);
    contex.fill();
    contex.closePath();
});