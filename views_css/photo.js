// Function to start webcam and draw video frames on canvas
async function loadPage(){

  // Fetch page.json and populate HTML elements
  fetch('./assets/page.json')
    .then(response => response.json())
    .then(data => {
      document.getElementById('bannerPart1').innerText = data.banner.part1;
      document.getElementById('bannerPart2').innerText = data.banner.part2;
      document.getElementById('pageTitle').innerText = data.pageTitle;
      document.getElementById('pageReference').innerText = data.pageReference;
      document.getElementById('timeLine1Title').innerText = data.timeLine1.title;
      document.getElementById('timeLine1Subtitle').innerText = data.timeLine1.subtitle;
      document.getElementById('timeLine1Text').innerText = data.timeLine1.text;
      document.getElementById('timeLine2Title').innerText = data.timeLine2.title;
      document.getElementById('timeLine2Subtitle').innerText = data.timeLine2.subtitle;
      document.getElementById('timeLine2Text').innerText = data.timeLine2.text;
    })
    .catch(error => console.error('Error fetching page data:', error));
}

async function startWebcam() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const ctx = canvas.getContext('2d');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }});
        video.srcObject = stream;
        
        video.onloadedmetadata = function() {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Draw video frames onto canvas
            drawToCanvas();
        };
    } catch (err) {
        console.error('Error accessing webcam:', err);
    }
}

// Function to continuously draw video frames onto canvas
function drawToCanvas() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const ctx = canvas.getContext('2d');

    // Get the aspect ratio of the video
    const aspectRatio = video.videoWidth / video.videoHeight;

    // Calculate the new width and height for the canvas
    let newWidth, newHeight;
    if (aspectRatio > 1) {
        newWidth = canvas.width;
        newHeight = canvas.width / aspectRatio;
    } else {
        newWidth = canvas.height * aspectRatio;
        newHeight = canvas.height;
    }

    // Set the new canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw video frame onto canvas with new dimensions
    ctx.drawImage(video, 0, 0, newWidth, newHeight);

    // Request next frame
    requestAnimationFrame(drawToCanvas);
}

// Function to take a photo
function takePhoto() {
    const shutterSound = new Audio('./assets/cameraShutter.mp3');
    shutterSound.play();
    console.log('Photo captured!');
    
    // Display response div
    const responseDiv = document.getElementById("response");
    responseDiv.style.display = "block";

    // Pause the video
    const video = document.getElementById('videoElement');
    video.pause();

    // Fetch response and handle it
    getResponse(video);
}


async function getResponse(video) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame of the video onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the base64 encoded data URL of the canvas image
    const imageDataURL = canvas.toDataURL('image/jpeg');

    console.log('Image Data URL:', imageDataURL); // Log the image data URL

    try {
        const resp = await fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: "food2", image: imageDataURL }) // Sending image data along with the prompt
        });

        if (!resp.ok) {
            throw new Error('Failed to call API');
        }
        const respJson = await resp.json();
        displayTxt(respJson.result);
        video.play();
    } catch (error) {
        console.error('Error calling API:', error);
        displayTxt("AI回复在这里");
        video.play();
    }
}

function NowTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function displayTxt(resStr) {
    console.log(resStr);

    // Update HTML with the response content
    const resContainer = document.getElementById('resDisplay');
    const newResElement = document.createElement('div');
    newResElement.innerHTML = `
    <div>
        <br>
        <div class="text-neutral-900" id="timeLine1Text">--${NowTime()}--</div>
        <div class="font-bold" id="timeLine1Subtitle">${resStr.replaceAll('\n', '<br><br>')}</div>
        <div class="text-neutral-900" id="timeLine1Text">(温馨提示：我无法百分之百准确地识别照片，对于相同照片也不一定会每次识别结果相同，请谨慎判断以上建议内容。)</div>
        ----</div>
        <br>
    </div>
    `;
    resContainer.appendChild(newResElement);
}

// Start webcam when page loads
window.onload = function() {
    loadPage();
    startWebcam();
};

// Event listener for camera button click
document.getElementById("cameraButton").addEventListener("click", takePhoto);
