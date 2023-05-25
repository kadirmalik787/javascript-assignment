const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const resultDiv = document.getElementById("result");
const dis = document.getElementById("dis");
const align = document.getElementById("align");

let scanning = false;

function startScan() {
    scanning = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
            video.srcObject = stream;
            video.play();
            requestAnimationFrame(tick);
        })
        .catch((error) => {
            console.error("Error accessing camera: ", error);
        });
}

function stopScan() {
    scanning = false;
    video.pause();
    video.srcObject.getVideoTracks()[0].stop();
}

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

            const distance = Math.round(calculateDistance(
                code.location.topLeftCorner,
                code.location.topRightCorner
            ));
            const alignment = Math.round(calculateAlignment(
                code.location.topLeftCorner,
                code.location.bottomLeftCorner
            ));

            const blur = detectBlur(imageData);
            const contrast = detectPoorContrast(imageData);

            resultDiv.innerText = `QR Code Detected!\nDistance: ${distance}px\nAlignment: ${alignment}px\nBlur: ${blur}\nPoor Contrast: ${contrast}`;

            if(distance<=150){
                dis.innerText= "distance is so ling"
            
            }if (alignment<=150) {
            align.innerText="please align the qr code and try"
            
            }  
        }
    }

    if (scanning) {
        requestAnimationFrame(tick);
    }
}

function drawLine(begin, end, color) {
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x, end.y);
    context.lineWidth = 4;
    context.strokeStyle = color;
    context.stroke();
}

function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateAlignment(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.abs(dx) + Math.abs(dy);
}

function detectBlur(imageData) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const threshold = 20;
    let sum = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        sum += luminance;
    }

    const average = sum / (pixels.length / 4);
    const blur = Math.abs(average - 0.5) < threshold ? "No" : "Yes";
    return blur;
}

function detectPoorContrast(imageData) {
    const pixels = imageData.data;
    const threshold = 0.25;
    let darkPixels = 0;
    let lightPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        
        if (luminance < threshold) {
            darkPixels++;
        } else if (luminance > 1 - threshold) {
            lightPixels++;
        }
    }

    const contrast = darkPixels > 0 && lightPixels > 0 ? "No" : "Yes";
    return contrast;
}

startScan();
