const rita = require('../node_modules/rita');

const regex_find_attributes = [/ ?(?:make)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:named|called)? ?(.*) (?:as|is)? (?:the|a)? (?:multi-valued|multi valued|multivalued|primary key)/g, / ?(?:make)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:named|called)? ?(.*) (?:as|the|is)? (?:multi-valued|multi valued|multivalued|primary key)/g, / ?(?:make)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:named|called)? ?(.*) (?:multi-valued|multi valued|multivalued|primary key)/g,/([a-z]+ ?([a-z]+)?) is ?(?:a|the)? (?:primary key|multi valued|multi-valued|multivalued) ?(?:attribute)?/g, /(?:primary key|multi valued|multi-valued|multivalued) is ?(?:the)? (.*)?/];
let sentence = "university name is a primary key";
let f = 0;
for(let i = 0; i < regex_find_attributes.length; i++){
    if(f == 1){
        break;
    }
    regex_find_attributes[i].lastIndex = 0;
    while(match = regex_find_attributes[i].exec(sentence)){
        console.log(match[1]+"#");
        console.log(regex_find_attributes[i]);
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