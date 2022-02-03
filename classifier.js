//var BayesClassifier = require('bayes-classifier');
var rita = require('rita');
var classes = require('./classes');


var regex_find_entities = [/([a-z]+) as entity ?(?:type)?/g, /entity ?(?:type)? ?(?:named|called)? ([a-z]+)/g, /between ?(?:entity)? ?(?:type)? ([a-z]+) and ?(?:entity)? ?(?:type)? ([a-z]+)/g,];
var regex_find_attributes = [/([a-z]+) as attribute ?(?:type)?/g, /(?<!sub )attribute ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
var regex_find_sub_attribute = [/(?:named|called)? ([a-z]+) as sub attribute ?(?:type)?/g, /sub attribute ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
var regex_find_relationship = [/relationship ?(?:type)? ?(?:named|called)? (.*)? (?:between|for)/g, /(?:between|for) .*? relationship ?(?:type)? ?(?:named|called)? (.*)?/g, /relationship ?(?:type)? ?(?:named|called)? (.*)? (!between )/g];//hier g geaddet
var regex_find_number_relationship = [/(one|1|a lot of|many|several|multiple|a|n|m) ?(?:entity)? ?(?:type)? ?(?:named|called)? ([a-z]+) .*? (one|1|a lot of|many|several|multiple|a|n|m) ?(?:entity)? ?(?:type|types)? ?(?:named|called)? ([a-z]+)/];
var regex_find_isa = [/(?:entity)? ?(?:type)? ?(?:named|called)? ?([a-z]+) (?:is a child of|is a|inherits from|inherit from|) ?(?:entity)? ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
var regex_delete_object = [/ ?(?:entity|attribute|sub attribute|relationship)? ?(?:type)? ?(?:named|called)? (.*)?/g];
var regex_find_update_names = [/(?:update|rename|change) ?(?:name|named)? ?(?:of)? ?(?:entity|sub attribute|attribute|relationship)? ?(?:type)? ?(?:name|named)? (.*)? to ?(?:name|named)? ?(?:of)? ?(?:entity|sub attribute|attribute|relationship)? ?(?:type)? ?(?:name|named)? (.*)/g];
var regex_find_undo = [/undo (?:primary key|multi valued|multi-valued) ?(?:for)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)/g, /make ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)? not ?(?:as)? (?:primary key|multi valued|multi-valued)/g, /make ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)? (?:single valued|single-valued)/g];
var regex_find_do = [/make ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? ([a-z]+) ?(?:as)? (?:multi-valued|multi valued|primary key)/g, /(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? ([a-z]+) is (?:primary key|multi valued|multi-valued)/g];
var regex_noun = /nn.*/;

var dict_replace = {};
dict_replace['38'] = "create";
dict_replace['8'] = "create";
dict_replace['3 8'] = "create";
dict_replace['3/8'] = "create";
dict_replace['a tribute'] = "attribute";

function replace_common_mistakes(input, dict){
    for(var key in dict){
        if(input.indexOf(key) != -1){
            input = input.replace(key, dict[key]);
        }
    }
    return input;
}

function preprocess_sentence(input){
    var tokens = rita.tokenize(input);
    var sentence_conjugated = "";

    for(var i = 0; i < tokens.length; i++){
        if(/nn.*/.test(rita.pos(tokens[i]))){
            if(i == tokens.length -1){
                sentence_conjugated += rita.singularize(tokens[i]);
            }else{
                sentence_conjugated += rita.singularize(tokens[i]) + " ";
            }
        }else{
            if(i == tokens.length -1){
                sentence_conjugated += tokens[i];
            }else{
                sentence_conjugated += tokens[i] + " ";
            }
        }  
    }
    return sentence_conjugated.toLocaleLowerCase();
}

function check_if_noun(word){
    if(regex_noun.test(rita.pos(word))){
        return true;
    }else{
        return false;
    }
}

function find_do_name(input){
    var sentence_preprocessed = preprocess_sentence(input);
    for(var i = 0; i < regex_find_do.length; i++){
        regex_find_do[i].lastIndex = 0;
        while(match = regex_find_do[i].exec(sentence_preprocessed)){
            var name_do = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            if(check_if_noun(name_do)){
                return name_do;
            }
        }
    }
    if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1){
        classes.swal_to_user("What is the name of the attribute you want to make multi-valued?", "Please repeat your whole sentence!");
    }else{
        classes.swal_to_user("What is the name of the attribute you want to make primary key?", "Please repeat your whole sentence!");
    }
    //console.log("Cant find name for undoing primary key or multivalued");
    return null;
}
function find_undo_name(input){
    var sentence_preprocessed = preprocess_sentence(input);
    for(var i = 0; i < regex_find_undo.length; i++){
        regex_find_undo[i].lastIndex = 0;
        while(match = regex_find_undo[i].exec(sentence_preprocessed)){
            var name_undo = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            if(check_if_noun(name_undo)){
                return name_undo;
            }
        }
    }
    //console.log("Cant find name for undoing primary key or multivalued");
    if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1){
        classes.swal_to_user("What is the name of the multi-valued attribute you want to undo?", "Please repeat your whole sentence!");
    }else{
        classes.swal_to_user("What is the name of the primary key attribute you want to undo?", "Please repeat your whole sentence!");
    }
    return null;
}
function find_rename_obj(input){
    var sentence_preprocessed = preprocess_sentence(input);
    for(var i = 0; i < regex_find_update_names.length; i++){
        regex_find_update_names[i].lastIndex = 0;
        while(match = regex_find_update_names[i].exec(sentence_preprocessed)){
            var old_name = match[1];
            var new_name = match[2];
            if(check_if_noun(old_name) && check_if_noun(new_name)){
                old_name = old_name.charAt(0).toUpperCase() + old_name.slice(1);
                new_name = new_name.charAt(0).toUpperCase() + new_name.slice(1);
                return [old_name, new_name];
            }else{
                return [old_name, new_name];
            }
            
        }
    }
    //console.log("Not found name or rename");
    classes.swal_to_user("What object do you want to rename?","Please repeat your whole sentence!")
    return null;
}
function find_delete_object(input){
    var sentence_preprocessed = preprocess_sentence(input); 
    for(var i = 0; i < regex_delete_object.length; i++){
        regex_delete_object[i].lastIndex = 0;
        while(match = regex_delete_object[i].exec(sentence_preprocessed)){
            var name_obj;
            if(check_if_noun(match[1]) == true){
                name_obj = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            }else{
                name_obj = match[1];
            }
            
            console.log(name_obj);
            return name_obj;
        }
    }
    return null;
}

function find_relationship_number(input){
    var sentence_preprocessed = preprocess_sentence(input); 
    for(var i = 0; i < regex_find_number_relationship.length; i++){
        regex_find_number_relationship[i].lastIndex = 0;
        while(match = regex_find_number_relationship[i].exec(sentence_preprocessed)){
            regex_find_number_relationship[i].lastIndex = 0;
            var number1 = match[1];
            var entity1 = match[2].charAt(0).toUpperCase() + match[2].slice(1);
            var number2 = match[3];
            var entity2 = match[4].charAt(0).toUpperCase() + match[4].slice(1);
            if(['one', '1', 'a'].includes(number1)){
                number1 = '1';
            } else if(['many', 'several', 'multiple', 'a lot of', 'n', 'm'].includes(number1)){
                number1 = 'N';
            }else{
                console.log("What are the numbers for the relationship?");
                return null;
            }

            if(['one', '1', 'a'].includes(number2)){
                number2 = '1';
            } else if(['many', 'several', 'multiple', 'a lot of', 'n', 'm'].includes(number2)){
                number2 = 'N';
            }else{
                console.log("What are the numbers for the relationship?");
                return null;
            }

            if(check_if_noun(entity1) && check_if_noun(entity2)){
                return [number1, entity1, number2, entity2]; 
            }else{
                console.log('What are the names of the enitites to insert the numbers for the relatioship?');
                return null;
            }
        }
    }
    console.log("What are the numbers for the relationship?");
    classes.swal_to_user("What are the numbers for the relationship?", "Pleas repeat your whole sentence!")
    return null;
}

function find_relationship_name(input){
    var sentence_preprocessed = preprocess_sentence(input);
    for(var i = 0; i < regex_find_relationship.length; i++){
        regex_find_relationship[i].lastIndex = 0;
        while(match = regex_find_relationship[i].exec(sentence_preprocessed)){
            relationship_name = match[1];
            if(check_if_noun(relationship_name) == false){
                return relationship_name;
            }
            //console.log("Relationship can't be a noun!");
            classes.swal_to_user("Relationship name can't be a noun!", "Pleas repeat your whole sentence!")
            return null;
        }
    }
    //console.log("What is the name of the relationship?");
    classes.swal_to_user("What is the name of the relationship?", "Please include the name of the relationship in you whole sentence!");
    return null;
}

function find_attribute_name(input){
    var sentence_preprocessed = preprocess_sentence(input);
    for(var i = 0; i < regex_find_attributes.length; i++){
        regex_find_attributes[i].lastIndex = 0;
        while(match = regex_find_attributes[i].exec(sentence_preprocessed)){
            if(check_if_noun(match[1])){
                attribute_name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                return attribute_name;
            }else{
                //console.log("What is the name of the attribute?");
                classes.swal_to_user("Name of attribute isn't a noun!", "Please rephrase and repeat your sentence!")
                return null;
            }
        }
    }
    //console.log("What is the name of the attribute?");
    classes.swal_to_user("What is the name of the Attribute?", "Please repeat in a whole sentence?");
    return null;
}

function find_sub_attribute_name(input){
    var sentence_preprocessed = preprocess_sentence(input);
    for(var i = 0; i < regex_find_sub_attribute.length; i++){
        regex_find_sub_attribute[i].lastIndex = 0;
        while(match = regex_find_sub_attribute[i].exec(sentence_preprocessed)){
            if(check_if_noun(match[1])){
                var sub_attribute_name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                return sub_attribute_name;
            }else{
                //return console.log("What is the name of the sub attribute?");
                classes.swal_to_user("Name of sub attribute must be a noun!", "Please repeat in a whole sentence?");
            }
        }
    }
    classes.swal_to_user("Couldn't find name for sub attribute!", "Please repeat in a whole sentence?");
    //return console.log("What is the name of the sub attribute?");
}

function find_entity_names(input, bool_for_rel){
    var sentence_preprocessed = preprocess_sentence(input);
    list_entity_names = [];
    for(var i = 0; i < regex_find_entities.length; i++){
        regex_find_entities[i].lastIndex = 0;
        while(match = regex_find_entities[i].exec(sentence_preprocessed)){
            if(match.length == 3){
                if(check_if_noun(match[1]) && check_if_noun(match[2])){
                    entity_name1 = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                    entity_name2 = match[2].charAt(0).toUpperCase() + match[2].slice(1);
                    list_entity_names.push(entity_name1);
                    list_entity_names.push(entity_name2);
                }else{
                    //return console.log("What is the name of the entity types for the relationship?");
                    classes.swal_to_user("What is the name of the entity types for the relationship?",null)
                }
            }else{
                if(check_if_noun(match[1])){
                    entity_name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                    list_entity_names.push(entity_name);
                }else{
                    //console.log("What is the name of the entity?");
                    classes.swal_to_user("Name of entity must be a noun?",null);
                    list_entity_names.push(null);
                    return list_entity_names;
                }
            }
        }

    }
    //Eliminate dublicats in list
    var set_entity_names = [...new Set(list_entity_names)];
    if(set_entity_names[0] == null && input.indexOf('attribute') == -1 && bool_for_rel == false){
        classes.swal_to_user("What is the name of the entity-type you want to create?",null);
    }else if(set_entity_names[0] == null && input.indexOf('attribute') == -1 && bool_for_rel == true){
        classes.swal_to_user("Between what entity-types do you want to create a relationship?",'Please repeat whole sentence!');
    }
    return set_entity_names;
}

function find_entities_for_isa(input){
    var sentence_preprocessed = preprocess_sentence(input);
    list_entity_names = [];
    for(var i = 0; i < regex_find_isa.length; i++){
        regex_find_isa[i].lastIndex = 0;
        while(match = regex_find_isa[i].exec(sentence_preprocessed)){
            if(check_if_noun(match[1]) && check_if_noun(match[2])){
                entity_name1 = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                entity_name2 = match[2].charAt(0).toUpperCase() + match[2].slice(1);
                list_entity_names.push(entity_name1);
                list_entity_names.push(entity_name2);
                //console.log("hallo");
            }else{
                //console.log("What is the name of the entity types for isa type?");
                classes.swal_to_user("What are the names of the entity types for isa type?",null);
                list_entity_names.push(null);
                return list_entity_names;
            }
        }
    }
    return list_entity_names;
}

function execute_speech(input){
    input = replace_common_mistakes(input, dict_replace);
    //Create new Object
    if(input.indexOf('create') != -1 || input.indexOf('insert') != -1 || input.indexOf('draw') != -1 || input.indexOf('paint') != -1){
        //console.log("Create");
        //Create entity type
        if(input.indexOf('entity') != -1 && input.indexOf('attribute') == -1 && input.indexOf('relationship') == -1){
            //console.log('Entity will be created');
            var param = find_entity_names(input,false);
            //console.log('Name of Entity: ' + param[0]);
            classes.create_entity_type(param[0]);
        //Create attributes
        }else if(input.indexOf('sub attribute') == -1 && input.indexOf('attribute') != -1){
            console.log("Create Attribute");
            var param_attribute = find_attribute_name(input);
            if(param_attribute != null){
                var param_entity = find_entity_names(input,false);
            }
            //Create multi valued attribute
            if(input.indexOf('multi valued') != -1){
                //console.log('Multi valued will be created');
                var is_primary_key = false;
                var is_multi_valued = true;
                classes.create_attribute_type(param_attribute, param_entity[0], is_primary_key, is_multi_valued);
            //Create attribute as primary key
            }else if(input.indexOf('primary key') != -1){
                //console.log('Primary key will be created');
                var is_primary_key = true;
                var is_multi_valued = false;
                classes.create_attribute_type(param_attribute, param_entity[0], is_primary_key, is_multi_valued);
            //Create normal attribute
            }else{
                //console.log('Attribute will be created');
                var is_primary_key = false;
                var is_multi_valued = false;
                classes.create_attribute_type(param_attribute, param_entity[0], is_primary_key, is_multi_valued);
            }
        //Create sub attribute
        }else if(input.indexOf('entity') == -1 && input.indexOf('sub attribute') != -1){
            var param_sub_attribute = find_sub_attribute_name(input);
            var param_attribute = find_attribute_name(input);
            var param_entity = find_entity_names(input,false);
            if (param_sub_attribute != null && param_attribute != null){
                //console.log('Name Sub Attribute: ' + param_sub_attribute);
                //console.log('Name Attribute: ' + param_attribute);
                classes.create_sub_attribute_type(param_sub_attribute, param_attribute, param_entity[0]);
            }
        //create relationship
        }else if(input.indexOf('relationship') != -1 && input.indexOf('attribute') == -1){
            //console.log('Relationship will be created');
            var param_relationship = find_relationship_name(input);
            var param_entities = find_entity_names(input, true);
            if(param_relationship != null && param_entities != null && param_entities.length == 2){
                //console.log("Name of relationship: " + param_relationship)
                //console.log("Name of first Entity: " + param_entities[0]);
                //console.log("Name of second Entity: " + param_entities[1]);
                classes.create_relationship_type(param_relationship, param_entities[0], param_entities[1]);
            }
        }
    //Create isa type
    }else if(input.indexOf('is a') != -1 || input.indexOf('inherits from') != -1 || input.indexOf('inherit from') != -1 || input.indexOf('is a child of') != -1){
        //console.log("Create isa type");
        var entities_for_isa = find_entities_for_isa(input,false);
        if(entities_for_isa[0] != null){
            //console.log("Name of first Entity: " + entities_for_isa[0]);
            //console.log("Name of second Entity: " + entities_for_isa[1]);
            classes.create_isa_type(entities_for_isa[0], entities_for_isa[1]);
        }else{
            //console.log("Can't find entities for isa")
        }
    //Create value for label
    }else if(input.indexOf('several') != -1 || input.indexOf('multiple') != -1 || input.indexOf('a lot of') != -1 || input.indexOf('many') != -1 || input.indexOf('numerous') != -1 || input.indexOf('plenty of') != -1 || input.indexOf('one') != -1 || input.indexOf('1') != -1){
        //console.log('Number relationship will be created');
        var param_relation_numbers = find_relationship_number(input);
        if(param_relation_numbers != null){
            if(param_relation_numbers[0] == "N" && param_relation_numbers[2] == "N"){
                param_relation_numbers[2] = "M";
            }
        }
        /*console.log("Number 1: " + param_relation_numbers[0]);
        console.log("Entity 1: " + param_relation_numbers[1]);
        console.log("Number 2: " + param_relation_numbers[2]);
        console.log("Entity 2: " + param_relation_numbers[3]);*/
        classes.add_label_to_connection(param_relation_numbers[1], param_relation_numbers[3], param_relation_numbers[2]);
    //Update objects (change name)
    }else if(input.indexOf('update') != -1 || input.indexOf('change') != -1 || input.indexOf('rename') != -1){
        //console.log('update');
        var params_rename = find_rename_obj(input);
        //console.log(params_rename);
        classes.rename_object(params_rename[0], params_rename[1]);
    //Delet objects
    }else if (input.indexOf('delete') != -1 || input.indexOf('remove') != -1 || input.indexOf('cancel') != -1){
        //console.log("Delete");
        var param_delete = find_delete_object(input);
        classes.delete_object(param_delete);
    }else if(input.indexOf('undo') != -1 || input.indexOf('make') != -1){
        //Undo primary key or multivalued
        if(input.indexOf('undo') != -1 || input.indexOf('make') != -1 && input.indexOf('not') != -1 || input.indexOf('make') != -1 && input.indexOf('single valued') != -1){
            if(input.indexOf('primary key') != -1){
                //console.log("undo primary key");
                var param_undo = find_undo_name(input);
                if(param_undo != null){
                    classes.undo_primary_key(param_undo);
                }
            }else if(input.indexOf('multi valued') != -1 || input.indexOf('single valued') || input.indexOf('multi-valued') != -1 || input.indexOf('single-valued')){
                //console.log("undo multi valued");
                var param_undo = find_undo_name(input);
                if(param_undo != null){
                    classes.undo_multi_valued(param_undo);
                }
            }else{
                //console.log("can't find attribute to undo action");
            }
        //Make attribute multivalued or as primary key
        }else if(input.indexOf('make') != -1 && input.indexOf('not') == -1){
            //Make attribute primary key
            var param_do = find_do_name(input);
            if(param_do != null){
                if(input.indexOf('primary key') != -1){
                    //console.log("Make attribute primary key!");
                    classes.make_primary_key(param_do);
                }else if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1){
                    classes.make_multi_valued(param_do);
                }
            }
        }
    }
    else{
        //console.log("Can't identify action");
        classes.swal_to_user("What do you want to do?", "Could not identify any action!");
    }
}

module.exports = {
    execute_speech: execute_speech
}

