const rita = require('../node_modules/rita');

const regex_find_attributes = [/make ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)? ?(?:as)? (?:multi-valued|multi valued|primary key)/g, /(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)? is (?:primary key|multi valued|multi-valued)/g];//[/ ?(?:entity|attribute|sub attribute|relationship)? ?(?:type)? ?(?:named|called)? (.*)?/g];//[/(?:create|add|draw|paint|insert) ([a-z]+ ?([a-z]+)?) as attribute ?(?:type)?/g, /(?<!sub )attribute ?(?:type)? ?(?:named|called)? ([a-z]+ ?([a-z]+)?) (?:for|to)/g,/(?<!sub )attribute ?(?:type)? ?(?:named|called)? ([a-z]+ ?([a-z]+)?)/g];
let sentence = "make mailing adress multi-valued";
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
console.log(r.split(' ').length);
//console.log(rita.pos("create attribute zip code for person"));

const regex_noun = /nn.*/;
function check_if_noun(word){
    if(regex_noun.test(rita.pos(word))){
        return true;
    }else{
        return false;
    }
}

console.log(check_if_noun("matriculation number"));