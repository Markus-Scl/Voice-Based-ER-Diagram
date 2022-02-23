const rita = require('../node_modules/rita');

const regex_find_attributes = [/([a-z]+) has the attribute/g,/([a-z]+) as entity ?(?:type)?/g, /entity ?(?:type)? ?(?:named|called)? ([a-z]+)/g, /between ?(?:entity)? ?(?:type)? ([a-z]+) and ?(?:entity)? ?(?:type)? ([a-z]+)/g,/for ?(?:entity)? ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
let sentence = "house has the attribute mailing adress";
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