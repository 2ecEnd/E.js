let canvas = document.querySelector("#canvas"); 
let contextCanvas = canvas.getContext('2d'); 
let clusterButton = document.getElementById("cluster"); 
let clearButton = document.getElementById("clear"); 
let clusterInfo = document.getElementById("cluster-info");

let points = []; 
let clusters = []; 
let colours = []; 




function generateClusterColours(k) {
    let hueStep = 360 / k;
    
    for (let i = 0; i < k; i++) {
        let hue = Math.round(i * hueStep);
        colours.push(`hsl(${hue}, 60%, 50%)`);
    }
}



function draw() {
    contextCanvas.clearRect(0, 0, canvas.width, canvas.height);
    
    clusters.forEach((center, i) => {
        contextCanvas.beginPath();
        contextCanvas.arc(center.x, center.y, 8, 0, Math.PI * 2);
        contextCanvas.fillStyle = colours[i];
        contextCanvas.fill();
        contextCanvas.strokeStyle = "black";
        contextCanvas.lineWidth = 2;
        contextCanvas.stroke();
    });
    
    for (let point of points) {
        contextCanvas.beginPath();
        contextCanvas.arc(point.x, point.y, 8, 0, Math.PI * 2);
        contextCanvas.fillStyle = point.cluster !== undefined ? colours[point.cluster] : "black";
        contextCanvas.fill();
    }
}


canvas.addEventListener("click", (event) => {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    points.push({ x, y, cluster: undefined});
    draw();
});





function kMeansPlusPlus(k) {
    
    let centers = [];
    
    let firstIndex = Math.floor(Math.random() * points.length);
    centers.push({x: points[firstIndex].x,  y: points[firstIndex].y,  count: 1});
    

    for (let i = 1; i < k; i++) {

        let distances = [];
        for (let point of points) {
            let minDistance = Infinity; 

            for (let center of centers) {
                let dist = Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2));

                if (dist < minDistance) {
                    minDistance = dist;
                }
            }
            distances.push(minDistance); 
        }

        let totalSum = 0;
        for (let dist of distances) {
            totalSum+= dist;
        }
        
        let rand = Math.random() * totalSum; 
        let selectedIndex;
        let sum = 0; 

        for (let j = 0; j < distances.length; j++) {
            sum += distances[j];
            if (sum > rand) {
                selectedIndex = j;
                break;
            }
        }
        
        centers.push({x: points[selectedIndex].x, y: points[selectedIndex].y, count: 1});
    }
    
    let changed = true; 
    
    while (changed) {
        changed = false;
        
        let clusterSums = [];
        for ( i = 0; i < k; i++) {
            clusterSums.push({x: 0, y: 0, count: 0}); 
        }

        for (let point of points) {
            let minDistance = Infinity;
            let currentDistance;
            let clusterIndex;
            

            for (let centerIndex = 0; centerIndex < centers.length; centerIndex++) {
                currentDistance = Math.sqrt(Math.pow(point.x - centers[centerIndex].x, 2) + Math.pow(point.y - centers[centerIndex].y, 2));

                if (currentDistance < minDistance) {
                    minDistance = currentDistance;
                    clusterIndex = centerIndex;
                }
            }
            

            if (point.cluster !== clusterIndex) {
                point.cluster = clusterIndex;
                changed = true;
            }
            
            clusterSums[point.cluster].x += point.x;
            clusterSums[point.cluster].y += point.y;
            clusterSums[point.cluster].count++;
        }
        
        for (let centerIndex = 0; centerIndex < centers.length; centerIndex++) {
            if (clusterSums[centerIndex].count > 0) {
                centers[centerIndex].x = clusterSums[centerIndex].x / clusterSums[centerIndex].count;
                centers[centerIndex].y = clusterSums[centerIndex].y / clusterSums[centerIndex].count;
                centers[centerIndex].count = clusterSums[centerIndex].count;
            }
        }
    }
            
    
    return centers;
}


function findOptimalK() {
    let maxK = 10;

    if (points.length < 2) return 1;
    maxK = Math.min(maxK, points.length); 

    let distances = []; 

    
    for (let k = 1; k <= maxK; k++) {
        clusters = kMeansPlusPlus(k);


        let withInClusterSum = 0;
        for (let point of points) {
            let center = clusters[point.cluster];
            withInClusterSum += Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2);
        }
        
        distances.push(withInClusterSum);
    
    }
    
    let optimalK = 1;
    let minDiffference = Infinity;
    
    for (let k = 1; k < distances.length - 1; k++) {
        let difference1 = distances[k + 1] - distances[k];
        let difference2 = distances[k] - distances[k - 1];
        let relativeDifference = difference1 / difference2;

        if (relativeDifference < minDiffference && relativeDifference > 0 && distances[k] < distances[k - 1])  {
            minDiffference = relativeDifference;
            optimalK = k + 1;
        }
    }

    return optimalK;
}


function performClustering() {
    if (clusters.length == 0) {
        if (points.length < 2) {
            clusterInfo.textContent = "Нужно как минимум 2 точки для кластеризации";
            return;
        }
        
        optimalK = findOptimalK();
        clusterInfo.textContent = `Оптимальное число кластеров: ${optimalK}`;
        

        clusters = kMeansPlusPlus(optimalK);
        generateClusterColours(optimalK);

        draw();
    }

    else {
        clusterInfo.textContent = "Очистите плоскость";
    }
}




clusterButton.addEventListener('click', performClustering);


clearButton.addEventListener('click', () => {
    points = []; 
    clusters = []; 
    colours = [];
    optimalK = 0; 
    clusterInfo.textContent = ''; 
    draw(); 
});


