var classifier = require('./classifier');
var sendAjax = require('../node_modules/send-ajax');

const textbox = document.getElementById("textbox");
const micBtn = document.getElementById("voiceButton");  

const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;


const recognition = new speechRecognition();

recognition.interimResults = true;
recognition.continuous = true;
recognition.lang = 'en-US';


micBtn.addEventListener("click", start_or_stop_recording);
var started = false;

var tst = 'Create entity!';
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
        execute_ajax("Create-Entity", "Create entity type house");
        stop_speech_recognition();
    }
}

function execute_ajax(input_1, input_2){
    $.ajax({
        url: "https://maker.ifttt.com/trigger/log-trigger/json/with/key/oxQQU39-NxWKLgAMZSuRmKrGc9JE1VOrBBrVU0KHEN0",
        type: "POST",
        dataType: 'application/json',
        
        data: {action : input_1 ,user_input : input_2}
      });
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