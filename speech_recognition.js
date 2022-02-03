const { execute_speech } = require('./classifier');
var classifier = require('./classifier');

const textbox = document.getElementById("textbox");
const micBtn = document.getElementById("voiceButton");  

const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;


const recognition = new speechRecognition();

recognition.interimResults = true;
recognition.continuous = true;
recognition.lang = 'en-US';

//micBtn.addEventListener("mousedown", start_speech_recognition);
//micBtn.addEventListener("mouseup", stop_speech_recognition);
micBtn.addEventListener("click", start_or_stop_recording);
var started = false;

function start_or_stop_recording(){
    if(started == false){
        started = true;
        document.getElementById('voiceButton').classList.add('glow-on-hover');
        textbox.value = '';
        fianl_transcript = '';
        start_speech_recognition();
        
    }else{
        started = false;
        document.getElementById('voiceButton').classList.remove('glow-on-hover');
        stop_speech_recognition();
        
    }
}

function start_speech_recognition(){
    console.log("started speech recognition");    
    recognition.start();
    }
    
function stop_speech_recognition(){
    console.log("stopped speech recognition"); 
    recognition.stop();
}



recognition.addEventListener("start", startSpeechRecognition);
function startSpeechRecognition(){
    console.log("Speechrecognition Active");
}

recognition.addEventListener("end", endSpeechRecognition);
function endSpeechRecognition(){
    console.log("Speech Recognition disconnected");
    console.log(fianl_transcript);
    classifier.execute_speech(fianl_transcript);
}

recognition.addEventListener("result", resultOfSpeechRecognition);
/*function resultOfSpeechRecognition(event){
    const transcript = event.results[0][0].transcript;
    textbox.value = transcript;
}*/

var fianl_transcript = '';

function resultOfSpeechRecognition(event){
    var interim_transcript = '';
    for(var i = event.resultIndex; i < event.results.length; ++i){
        if(event.results[i].isFinal){
            fianl_transcript += event.results[i][0].transcript;
        }else{
            
            interim_transcript += event.results[i][0].transcript;
            textbox.value = interim_transcript;
        }
    }
    fianl_transcript = textbox.value;
}