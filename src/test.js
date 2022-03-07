const rita = require('../node_modules/rita');

const regex_find_attributes = [/(?<!sub )attribute ?(?:type)? ?(?:named|called)? (.*)? (?:as)/g];
let sentence = "create attribute id number as primary key";
let f = 0;
for(let i = 0; i < regex_find_attributes.length; i++){
    if(f == 1){
        break;
    }
    regex_find_attributes[i].lastIndex = 0;
    while(match = regex_find_attributes[i].exec(sentence)){
        console.log(match[1]+"#");
        f=1;
        break;
    }
}


let r = "mailing";
//console.log(r.split(' ').length);
//console.log(rita.pos("create attribute zip code for person"));

const regex_noun = /nn.*/;
function check_if_noun(word){
    if(regex_noun.test(rita.pos(word))){
        return true;
    }else{
        return false;
    }
}
console.log(rita.pos("to visits"));
//console.log(check_if_noun("matriculation number"));