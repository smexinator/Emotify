const video = document.getElementById('video');
const canvas = document.getElementById('emotionCanvas');
const displaySize = { width: video.width, height: video.height };
let detectedEmotion = ""; // Variable to store the detected emotion
const options = document.getElementsByClassName('option');
// let local = document.getElementById('local').checked ? 'yes' : 'no';


Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
]).then(turnCameraOff);

const cameraToggle = document.getElementById('camera-toggle');

// Function to turn camera on
function turnCameraOn() {
    // Code to turn the camera on
    navigator.getUserMedia(
      { video: {} },
      stream => video.srcObject = stream,
      err => console.error(err)
    );
    document.getElementById('camera-text').textContent = 'Camera On';
    console.log('Camera turned on');
}
// Function to turn camera off
function turnCameraOff() {
    // Code to turn the camera off
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    const stream = video.srcObject;
if (stream) {
const tracks = stream.getTracks();

tracks.forEach(function(track) {
  track.stop();
});

video.srcObject = null;
}
    document.getElementById('camera-text').textContent = 'Camera Off';
    console.log('Camera turned off');
}

// Event listener for checkbox change
cameraToggle.addEventListener('change', function() {
    if (this.checked) {
        turnCameraOn();
    } else {
        turnCameraOff();
    }
});

// const camera = document.getElementsByClassName("button-85")[0];
// camera.addEventListener('click', function(e) {
//   if (camera.innerHTML == "Camera on") {
//     cameraoff();
//     camera.innerHTML = "Camera off";
//   } else {
//     startVideo();
//     camera.innerHTML = "Camera on";
//   }
// });

// function startVideo() {
//   navigator.getUserMedia(
//     { video: {} },
//     stream => video.srcObject = stream,
//     err => console.error(err)
//   );
// }

// function cameraoff() {
//   const stream = video.srcObject;
//   if (stream) {
//     const tracks = stream.getTracks();

//     tracks.forEach(function(track) {
//       track.stop();
//     });

//     video.srcObject = null;
//   }
// }

// Function to detect the most prominent emotion
function detectEmotion() {
  console.log("Detecting Emotion");
  faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions()
    .then(detection => {
      if (detection) {
        const expressions = detection.expressions;
        console.log(expressions);
        const maxExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        console.log("Detected Emotion:", maxExpression); // Logging the detected emotion
        detectedEmotion = maxExpression;
        document.getElementById('expression').innerHTML = detectedEmotion
        
        modifyOptionsUrl();
      } else {
        document.getElementById('expression').innerHTML = 'No Expressions Detected!'
        console.log("No face detected.");
      }

      turnCameraOff();
      cameraToggle.checked = false
    });
}


// Add event listener to the detect button
const detectButton = document.getElementById('detectButton'); // Replace 'detectButton' with the actual ID of your button
detectButton.addEventListener('click', detectEmotion);

video.addEventListener('play', () => {
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 100);
});

//Modify options href on Detection

function modifyOptionsUrl(){
  for (let option of options){
    option.href = option.id +'/' + detectedEmotion;
    console.log(option);
  }
}

// //Get value of local music option
// document.getElementById('local').addEventListener('change', function(){
//   local = this.checked ? 'yes' : 'no';
// })