let inputCanvas = document.getElementById('input-canvas');
let kmeansEuclideanCanvas = document.getElementById('kmeans-euclidean-canvas');
let hierarchicalEuclideanCanvas = document.getElementById('hierarchical-euclidean-canvas');
let kmeansManhattanCanvas = document.getElementById('kmeans-manhattan-canvas');
let hierarchicalManhattanCanvas = document.getElementById('hierarchical-manhattan-canvas');
let kmeansChebyshevCanvas = document.getElementById('kmeans-chebyshev-canvas');
let hierarchicalChebyshevCanvas = document.getElementById('hierarchical-chebyshev-canvas');

let clusterButton = document.getElementById('cluster');
let clearButton = document.getElementById('clear');
let clusterInfo = document.getElementById('cluster-info');
let kInput = document.getElementById('k-input');


let inputCtx = inputCanvas.getContext('2d');
let kmeansEuclideanCtx = kmeansEuclideanCanvas.getContext('2d');
let hierarchicalEuclideanCtx = hierarchicalEuclideanCanvas.getContext('2d');
let kmeansManhattanCtx = kmeansManhattanCanvas.getContext('2d');
let hierarchicalManhattanCtx = hierarchicalManhattanCanvas.getContext('2d');
let kmeansChebyshevCtx = kmeansChebyshevCanvas.getContext('2d');
let hierarchicalChebyshevCtx = hierarchicalChebyshevCanvas.getContext('2d');

let points = [];
let colours = [];


function generateColors(k) {
    colours = [];
    const hueStep = 360 / k;
    for (let i = 0; i < k; i++) {
        colours.push(`hsl(${i * hueStep}, 70%, 60%)`);
    }
}


function draw(context, pointsData, centers = []) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    pointsData.forEach(point => {
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, Math.PI * 2);
        context.fillStyle = point.cluster !== undefined ? colours[point.cluster] : 'black';
        context.fill();
    });
}


inputCanvas.addEventListener('click', (event) => {
    const rect = inputCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    points.push({ x, y });
    draw(inputCtx, points);
});


function euclideanDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function chebyshevDistance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}


function kMeansPlusPlus(k, distanceFunction) {
    let centers = [];
    

    let firstIndex = Math.floor(Math.random() * points.length);
    centers.push({x: points[firstIndex].x, y: points[firstIndex].y});
    

    for (let i = 1; i < k; i++) {
        let distances = [];
        let totalSum = 0;
        

        for (let point of points) {
            let minDistance = Infinity;
            for (let center of centers) {
                let dist = distanceFunction(point, center);
                if (dist < minDistance) {
                    minDistance = dist;
                }
            }
            distances.push(minDistance * minDistance); 
            totalSum += minDistance * minDistance;
        }
        
        let rand = Math.random() * totalSum;
        let sum = 0;
        let selectedIndex = 0;
        
        for (let j = 0; j < distances.length; j++) {
            sum += distances[j];
            if (sum > rand) {
                selectedIndex = j;
                break;
            }
        }
        
        centers.push({x: points[selectedIndex].x, y: points[selectedIndex].y});
    }
    

    let changed = true;
    let clusters = Array(points.length).fill(-1);
    
    while (changed) {
        changed = false;
        

        for (let i = 0; i < points.length; i++) {
            let minDistance = Infinity;
            let newCluster = -1;
            
            for (let j = 0; j < centers.length; j++) {
                let dist = distanceFunction(points[i], centers[j]);
                if (dist < minDistance) {
                    minDistance = dist;
                    newCluster = j;
                }
            }
            
            if (clusters[i] !== newCluster) {
                clusters[i] = newCluster;
                changed = true;
            }
        }
        

        let newCenters = Array(k).fill().map(() => ({x: 0, y: 0, count: 0}));
        
        for (let i = 0; i < points.length; i++) {
            let cluster = clusters[i];
            newCenters[cluster].x += points[i].x;
            newCenters[cluster].y += points[i].y;
            newCenters[cluster].count++;
        }
        
        for (let j = 0; j < k; j++) {
            if (newCenters[j].count > 0) {
                centers[j].x = newCenters[j].x / newCenters[j].count;
                centers[j].y = newCenters[j].y / newCenters[j].count;
            }
        }
    }
    

    let resultPoints = points;
    for (let i = 0; i < resultPoints.length; i++) {
        resultPoints[i].cluster = clusters[i];
    }
    
    return {
        points: resultPoints,
        centers: centers
    };
}


function hierarchicalClustering(k, distanceFunction) {
    let pointsCopy = points;
    let clusters = pointsCopy.map(point => ({
        points: [point],
        centroid: {x: point.x, y: point.y}
    }));
    
    while (clusters.length > k) {
        let minDistance = Infinity;
        let cluster1 = -1, cluster2 = -1;
        

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                let distance = distanceFunction(clusters[i].centroid, clusters[j].centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    cluster1 = i;
                    cluster2 = j;
                }
            }
        }
        
        if (cluster1 !== -1 && cluster2 !== -1) {

            let mergedPoints = [...clusters[cluster1].points, ...clusters[cluster2].points];
            

            let sumX = 0, sumY = 0;
            mergedPoints.forEach(point => {
                sumX += point.x;
                sumY += point.y;
            });
            
            let mergedCentroid = {
                x: sumX / mergedPoints.length,
                y: sumY / mergedPoints.length
            };
            

            clusters.splice(cluster2, 1);
            clusters.splice(cluster1, 1);
            clusters.push({
                points: mergedPoints,
                centroid: mergedCentroid
            });
        }
    }
    

    let resultPoints = points;
    clusters.forEach((cluster, clusterIndex) => {
        cluster.points.forEach(clusterPoint => {
            resultPoints.forEach(point => {
                if (point.x === clusterPoint.x && point.y === clusterPoint.y) {
                    point.cluster = clusterIndex;
                }
            });
        });
    });
    
    return {
        points: resultPoints,
        centers: clusters.map(cluster => cluster.centroid)
    };
}


function performClustering() {
    const k = parseInt(kInput.value);
    if (isNaN(k) || k < 1 || k > 10) {
        clusterInfo.textContent = "Введите число кластеров от 1 до 10";
        return;
    }
    
    if (points.length < k) {
        clusterInfo.textContent = `Нужно как минимум ${k} точек для кластеризации`;
        return;
    }
    
    generateColors(k);
    

    let euclideanKmeans = kMeansPlusPlus(k, euclideanDistance);
    draw(kmeansEuclideanCtx, euclideanKmeans.points, euclideanKmeans.centers);
    
    let euclideanHierarchical = hierarchicalClustering(k, euclideanDistance);
    draw(hierarchicalEuclideanCtx, euclideanHierarchical.points, euclideanHierarchical.centers);
    

    let manhattanKmeans = kMeansPlusPlus(k, manhattanDistance);
    draw(kmeansManhattanCtx, manhattanKmeans.points, manhattanKmeans.centers);
    
    let manhattanHierarchical = hierarchicalClustering(k, manhattanDistance);
    draw(hierarchicalManhattanCtx, manhattanHierarchical.points, manhattanHierarchical.centers);
    

    let chebyshevKmeans = kMeansPlusPlus(k, chebyshevDistance);
    draw(kmeansChebyshevCtx, chebyshevKmeans.points, chebyshevKmeans.centers);
    
    let chebyshevHierarchical = hierarchicalClustering(k, chebyshevDistance);
    draw(hierarchicalChebyshevCtx, chebyshevHierarchical.points, chebyshevHierarchical.centers);
    
    clusterInfo.textContent = `Кластеризация выполнена с ${k} кластерами`;
}


function clearAll() {
    points = [];
    draw(inputCtx, points);
    draw(kmeansEuclideanCtx, []);
    draw(hierarchicalEuclideanCtx, []);
    draw(kmeansManhattanCtx, []);
    draw(hierarchicalManhattanCtx, []);
    draw(kmeansChebyshevCtx, []);
    draw(hierarchicalChebyshevCtx, []);
    clusterInfo.textContent = 'Поставьте точки на плоскости для кластеризации';
}


clusterButton.addEventListener('click', performClustering);
clearButton.addEventListener('click', clearAll);