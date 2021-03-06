const rita = require('../node_modules/rita');
const classes = require('./speech_ER_Diagram');
const class_buttons = require('./button_ER_Diagram');


const regex_find_entities = [/([a-z]+) has ?(?:the|an)? attribute/g, /([a-z]+) as entity ?(?:type)?/g, /entity ?(?:type)? ?(?:named|called)? ([a-z]+)/g, /between ?(?:entity)? ?(?:type)? ([a-z]+) and ?(?:entity)? ?(?:type)? ([a-z]+)/g,/for ?(?:entity)? ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
const regex_find_attributes = [/(?:create|add|draw|paint|insert) ([a-z]+ ?([a-z]+)?) as attribute ?(?:type)?/g, /(?<!sub )attribute ?(?:type)? ?(?:named|called)? ([a-z]+ ?([a-z]+)?) (?:for|to)/g,/(?<!sub )attribute ?(?:type)? ?(?:named|called)? (.*)? (?:as)/g,/(?<!sub )attribute ?(?:type)? ?(?:named|called)? ([a-z]+ ?([a-z]+)?)/g,/for ?(?:attribute)? ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
const regex_find_sub_attribute = [/(?:named|called)? ([a-z]+ ?([a-z]+)?) as sub attribute ?(?:type)?/g, /sub attribute ?(?:type)? ?(?:named|called)? ([a-z]+ ?([a-z]+)?)/g];
const regex_find_relationship = [/relationship ?(?:type)? ?(?:named|called)? (.*)? (?:between|for)/g, /(?:between|for) .*? relationship ?(?:type)? ?(?:named|called)? (.*)?/g, /relationship ?(?:type)? ?(?:named|called)? (.*)? (!between )/g];
const regex_find_number_relationship = [/ ?(?:one|1|a lot of|many|several|multiple|a|n|m|each)? ?(?:entity)? ?(?:type)? ?(?:named |called )?([a-z]+) .*? (one|1|a lot of|many|several|multiple|a|n|m) ?(?:times)? ?(?:in)? ?(?:a)? ?(?:entity)? ?(?:type|types)? ?(?:named|called)? ([a-z]+)/g];
const regex_find_isa = [/(?:entity)? ?(?:type)? ?(?:named|called)? ?([a-z]+) (?:is a child of|is a|inherits from|inherit from|) ?(?:entity)? ?(?:type)? ?(?:named|called)? ([a-z]+)/g];
const regex_delete_object = [/ ?(?:the)? ?(?:entity|attribute|sub attribute|relationship|entitytype)? ?(?:type)? ?(?:named|called)? (.*)?/g];
const regex_find_update_names = [/(?:update|rename|change) ?(?:name|named)? ?(?:of)? ?(?:entity|sub attribute|attribute|relationship)? ?(?:type)? ?(?:name|named)? (.*)? to ?(?:name|named)? ?(?:of)? ?(?:entity|sub attribute|attribute|relationship)? ?(?:type)? ?(?:name|named)? (.*)/g];
const regex_find_undo = [/undo (?:primary key|multi valued|multi-valued|multivalued) ?(?:for)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)/g, /make ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)? not ?(?:as)? (?:primary key|multi valued|multi-valued|multivalued)/g, /make ?(?:sub attribute|attribute)? ?(?:type)? ?(?:name|named)? (.*)? (?:single valued|single-valued)/g];
const regex_find_do = [/ ?(?:make|set)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:named|called)? ?(.*) (?:as|is)? (?:the|a)? (?:multi-valued|multi valued|multivalued|primary key)/g, / ?(?:make|set)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:named|called)? ?(.*) (?:as|the|is)? (?:multi-valued|multi valued|multivalued|primary key)/g, / ?(?:make|set)? ?(?:sub attribute|attribute)? ?(?:type)? ?(?:named|called)? ?(.*) (?:multi-valued|multi valued|multivalued|primary key)/g, /(?:primary key|multi valued|multi-valued|multivalued) is ?(?:the)? (.*)?/];
const regex_noun = /nn.*/;

const dict_replace = {};
dict_replace['38'] = "create";
dict_replace['8'] = "create";
dict_replace['3 8'] = "create";
dict_replace['3/8'] = "create";
dict_replace['creates'] = "create";
dict_replace['a tribute'] = "attribute";
dict_replace[' s '] = " as ";
dict_replace['up a tribute'] = "sub attribute";
dict_replace['up attribute'] = "sub attribute";
dict_replace['sap attribute'] = "sub attribute";

function replace_common_mistakes(input, dict){
    for(let key in dict){
        if(input.indexOf(key) != -1){
            input = input.replace(key, dict[key]);
        }
    }
    return input;
}

function preprocess_sentence(input){
    let tokens = rita.tokenize(input);
    let sentence_conjugated = "";

    for(let i = 0; i < tokens.length; i++){
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
    let sentence_preprocessed = preprocess_sentence(input);
    for(let i = 0; i < regex_find_do.length; i++){
        regex_find_do[i].lastIndex = 0;
        while(match = regex_find_do[i].exec(sentence_preprocessed)){
            let name_do = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            return name_do;
        }
    }
    if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1 || input.indexOf('multivalued') != -1){
        if(class_buttons.do_log){
            execute_ajax_error(class_buttons.user_id, "Couldn't find name of attribute-type to make multi-valued!", input);
        }
        toastr.error("Please repeat your whole sentence!","What is the name of the attribute you want to make multi-valued?");
    }else{
        if(class_buttons.do_log){
            execute_ajax_error(class_buttons.user_id, "Couldn't find name of attribute-type to make primary key!", input);
        }
        toastr.error("Please repeat your whole sentence!", "What is the name of the attribute you want to make primary key?");
    }
    return null;
}
function find_undo_name(input){
    let sentence_preprocessed = preprocess_sentence(input);
    for(let i = 0; i < regex_find_undo.length; i++){
        regex_find_undo[i].lastIndex = 0;
        while(match = regex_find_undo[i].exec(sentence_preprocessed)){
            let name_undo = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            return name_undo;
        }
    }
    if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1 || input.indexOf('multivalued') != -1){
        if(class_buttons.do_log){
            execute_ajax_error(class_buttons.user_id, "Couldn't find name of attribute-type to undo multi-valued!", input);
        }
        toastr.error("Please repeat your whole sentence!","What is the name of the multi-valued attribute you want to undo?");
    }else{
        if(class_buttons.do_log){
            execute_ajax_error(class_buttons.user_id, "Couldn't find name of attribute-type to undo primary key!", input);
        }
        toastr.error("Please repeat your whole sentence!","What is the name of the primary key attribute you want to undo?");
    }
    return null;
}

function find_rename_obj(input){
    let sentence_preprocessed = preprocess_sentence(input);
    for(let i = 0; i < regex_find_update_names.length; i++){
        regex_find_update_names[i].lastIndex = 0;
        while(match = regex_find_update_names[i].exec(sentence_preprocessed)){
            let old_name = match[1];
            let new_name = match[2];
            if(check_if_noun(old_name) && check_if_noun(new_name)){
                old_name = old_name.charAt(0).toUpperCase() + old_name.slice(1);
                new_name = new_name.charAt(0).toUpperCase() + new_name.slice(1);
                return [old_name, new_name];
            }else{
                return [old_name, new_name];
            }
            
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Couldn't find name of object to rename!", input);
    }
    toastr.error("Please repeat your whole sentence!","What object do you want to rename?");
    return null;
}
function find_delete_object(input){
    let sentence_preprocessed = preprocess_sentence(input); 
    for(let i = 0; i < regex_delete_object.length; i++){
        regex_delete_object[i].lastIndex = 0;
        while(match = regex_delete_object[i].exec(sentence_preprocessed)){
            let name_obj;
            if(check_if_noun(match[1]) == true){
                name_obj = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            }else{
                name_obj = match[1];
            }
            return name_obj;
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Couldn't find name of object to delete!", input);
    }
    toastr.error("Please repeat your whole sentence!","What object do you want to delete?");
    return null;
}

function find_relationship_number(input){
    let sentence_preprocessed = preprocess_sentence(input); 
    for(let i = 0; i < regex_find_number_relationship.length; i++){
        regex_find_number_relationship[i].lastIndex = 0;
        while(match = regex_find_number_relationship[i].exec(sentence_preprocessed)){
            let entity1 = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            let number = match[2];
            let entity2 = match[3].charAt(0).toUpperCase() + match[3].slice(1);
            if(['one', '1', 'a'].includes(number)){
                number = '1';
                return [entity1, number, entity2]; 
            } else if(['many', 'several', 'multiple', 'a lot of', 'n', 'm'].includes(number)){
                number = 'N';
                return [entity1, number, entity2]; 
            }else{
                if(class_buttons.do_log){
                    execute_ajax_error(class_buttons.user_id, "Couldn't identify numbers for relationship!", input);
                }
                return null;
            }
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Couldn't find numbers for relationship or entity names!", input);
    }
    toastr.error("Pleas repeat your whole sentence!","What are the numbers for the relationship?");
    return null;
}

function find_relationship_name(input){
    let sentence_preprocessed = preprocess_sentence(input);
    for(let i = 0; i < regex_find_relationship.length; i++){
        regex_find_relationship[i].lastIndex = 0;
        while(match = regex_find_relationship[i].exec(sentence_preprocessed)){
            relationship_name = match[1];
            return relationship_name;
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Couldn't find name of relationsship!", input);
    }
    toastr.error("Please include the name of the relationship in you whole sentence!","What is the name of the relationship?");
    return null;
}

function find_attribute_name(input){
    let sentence_preprocessed = preprocess_sentence(input);
    for(let i = 0; i < regex_find_attributes.length; i++){
        regex_find_attributes[i].lastIndex = 0;
        while(match = regex_find_attributes[i].exec(sentence_preprocessed)){
            attribute_name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            return attribute_name;
 
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Couldn't find name of attribute-type!", input);
    }
    toastr.error("Please repeat in a whole sentence?","What is the name of the Attribute?");
    return null;
}

function find_sub_attribute_name(input){
    let sentence_preprocessed = preprocess_sentence(input);
    for(let i = 0; i < regex_find_sub_attribute.length; i++){
        regex_find_sub_attribute[i].lastIndex = 0;
        while(match = regex_find_sub_attribute[i].exec(sentence_preprocessed)){
            let sub_attribute_name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
            return sub_attribute_name;
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Couldn't find name of sub attribute-type!", input);
    }
    toastr.error("Please repeat in a whole sentence?","Couldn't find name for sub attribute!");
}

function find_entity_names(input, bool_for_rel){
    let sentence_preprocessed = preprocess_sentence(input);
    list_entity_names = [];
    for(let i = 0; i < regex_find_entities.length; i++){
        regex_find_entities[i].lastIndex = 0;
        while(match = regex_find_entities[i].exec(sentence_preprocessed)){
            if(match.length == 3){
                entity_name1 = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                entity_name2 = match[2].charAt(0).toUpperCase() + match[2].slice(1);
                list_entity_names.push(entity_name1);
                list_entity_names.push(entity_name2);
            }else{
                entity_name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                list_entity_names.push(entity_name);
            }
        }

    }
    //Eliminate dublicats in list
    let set_entity_names = [...new Set(list_entity_names)];
    if(set_entity_names[0] == null && input.indexOf('attribute') == -1 && bool_for_rel == false){
        if(class_buttons.do_log){
            execute_ajax_error(class_buttons.user_id, "Couldn't find name for create entity-type!", input);
        }
        toastr.error("","What is the name of the entity-type you want to create?");
    }else if(set_entity_names[0] == null && input.indexOf('attribute') == -1 && bool_for_rel == true){
        if(class_buttons.do_log){
            execute_ajax_error(class_buttons.user_id, "Couldn't find names of entity-types to create relationship!", input);
        }
        toastr.error('Please repeat whole sentence!',"Between what entity-types do you want to create a relationship?");
    }
    return set_entity_names;
}

function find_entities_for_isa(input){
    let sentence_preprocessed = preprocess_sentence(input);
    list_entity_names = [];
    for(let i = 0; i < regex_find_isa.length; i++){
        regex_find_isa[i].lastIndex = 0;
        while(match = regex_find_isa[i].exec(sentence_preprocessed)){
                entity_name1 = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                entity_name2 = match[2].charAt(0).toUpperCase() + match[2].slice(1);
                list_entity_names.push(entity_name1);
                list_entity_names.push(entity_name2);
                return list_entity_names;
        }
    }
    if(class_buttons.do_log){
        execute_ajax_error(class_buttons.user_id, "Could not find names of entity-types to create isa-type!", input);
    }
    toastr.error("","What are the names of the entity types for isa type?");
    return list_entity_names;
}

//Helper for looging, write to google sheets
function execute_ajax(user_id, action_identified, user_input){
    $.ajax({
        url: "https://maker.ifttt.com/trigger/log-trigger/json/with/key/oxQQU39-NxWKLgAMZSuRmKrGc9JE1VOrBBrVU0KHEN0",
        type: "POST",
        dataType: 'application/json',
        data: {user_id: user_id, action_identified : action_identified ,user_input : user_input}
    });
}

function execute_ajax_error(user_id, err, user_input){
    $.ajax({
        url: "https://maker.ifttt.com/trigger/log-trigger/json/with/key/oxQQU39-NxWKLgAMZSuRmKrGc9JE1VOrBBrVU0KHEN0",
        type: "POST",
        dataType: 'application/json',
        data: {user_id: user_id, error: err, user_input: user_input},
    });
}

function execute_speech(input){
    input = replace_common_mistakes(input, dict_replace);
    //Create new Object
    if(input.indexOf('create ') != -1 || input.indexOf('insert ') != -1 || input.indexOf('draw ') != -1 || input.indexOf('paint ') != -1 || input.indexOf('add ') != -1 || input.indexOf(' has the attribute ') != -1 || input.indexOf(' has attribute ') != -1 || input.indexOf(' has an attribute ') != -1){
        //Create entity type
        if(input.indexOf('entity') != -1 && input.indexOf('attribute') == -1 && input.indexOf('relationship') == -1){
            let find_entity_for_rel = false;
            let param = find_entity_names(input,find_entity_for_rel);
            if(class_buttons.do_log){
                execute_ajax(class_buttons.user_id, "Create entity-type", input);
            }
            classes.create_entity_type(param[0]);
        //Create attributes
        }else if(input.indexOf('sub attribute') == -1 && input.indexOf('attribute') != -1){;
            let param_attribute = find_attribute_name(input);
            let param_entity = null;
            if(param_attribute != null){
                let find_entity_for_rel = false;
                param_entity = find_entity_names(input,find_entity_for_rel);
            }
            //Create multi valued attribute
            if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1 || input.indexOf('multivalued') != -1){
                let is_primary_key = false;
                let is_multi_valued = true;
                if(class_buttons.do_log){
                    execute_ajax(class_buttons.user_id, "Create multi valued attribute-type", input);
                }
                classes.create_attribute_type(param_attribute, param_entity[0], is_primary_key, is_multi_valued);
            //Create attribute as primary key
            }else if(input.indexOf('primary key') != -1){
                let is_primary_key = true;
                let is_multi_valued = false;
                if(class_buttons.do_log){
                    execute_ajax(class_buttons.user_id, "Create attribute-type as primary key", input);
                }
                classes.create_attribute_type(param_attribute, param_entity[0], is_primary_key, is_multi_valued);
            //Create normal attribute
            }else{
                let is_primary_key = false;
                let is_multi_valued = false;
                if(class_buttons.do_log){
                    execute_ajax(class_buttons.user_id, "Create attribute-type", input);
                }
                classes.create_attribute_type(param_attribute, param_entity[0], is_primary_key, is_multi_valued);
            }
        //Create sub attribute
        }else if(input.indexOf('entity') == -1 && input.indexOf('sub attribute') != -1){
            let param_sub_attribute = find_sub_attribute_name(input);
            let param_attribute = find_attribute_name(input);
            let find_entity_for_rel = false;
            let param_entity = find_entity_names(input,find_entity_for_rel);
            if(class_buttons.do_log){
                execute_ajax(class_buttons.user_id, "Create sub attribute-type", input);
            }
            if (param_sub_attribute != null && param_attribute != null){
                classes.create_sub_attribute_type(param_sub_attribute, param_attribute, param_entity[0]);
            }
        //create relationship
        }else if(input.indexOf('relationship') != -1 && input.indexOf('attribute') == -1){
            let param_relationship = find_relationship_name(input);
            let find_entity_for_rel = true;
            let param_entities = find_entity_names(input, find_entity_for_rel);
            if(class_buttons.do_log){
                execute_ajax(class_buttons.user_id, "Create relationship-type", input);
            }
            if(param_relationship != null && param_entities != null && param_entities.length == 2){
                classes.create_relationship_type(param_relationship, param_entities[0], param_entities[1]);
            }
        }else{
            toastr.error("Please mention the type and the name of the element!","What kind of element type do you want to create?")
        }
    //Create isa type
    }else if((input.indexOf('is a') != -1 || input.indexOf('inherits from') != -1 || input.indexOf('inherit from') != -1 || input.indexOf('is a child of') != -1) && (input.indexOf('primary key') == -1 && input.indexOf('multi valued') == -1) && input.indexOf('multi-valued') == -1 && input.indexOf('multivalued') == -1){
        if(class_buttons.do_log){
            execute_ajax(class_buttons.user_id, "Create isa-type", input);
        }
        let entities_for_isa = find_entities_for_isa(input,false);
        if(entities_for_isa[0] != null){
            classes.create_isa_type(entities_for_isa[0], entities_for_isa[1]);
        }else{
            toastr.error("Could not find entitiy-types!","Between what entity-types do you want to create an isa-type?")
        }
    //Create value for label
    }else if(input.indexOf('several') != -1 || input.indexOf('multiple') != -1 || input.indexOf('a lot of') != -1 || input.indexOf('many') != -1 || input.indexOf('numerous') != -1 || input.indexOf('plenty of') != -1 || input.indexOf('one') != -1 || input.indexOf('1') != -1){
        if(class_buttons.do_log){
            execute_ajax(class_buttons.user_id, "Update numbers for relationsship-type", input);
        }
        let param_relation_numbers = find_relationship_number(input);

        if(param_relation_numbers != null){
            let entity_1 = param_relation_numbers[0];
            let number = param_relation_numbers[1];
            let entity_2 = param_relation_numbers[2];

            classes.add_label_to_connection(entity_1, number, entity_2);
        }else{
            console.log("not found");
        }
    //Update objects (change name)
    }else if(input.indexOf('update') != -1 || input.indexOf('change') != -1 || input.indexOf('rename') != -1){
        if(class_buttons.do_log){
            execute_ajax(class_buttons.user_id, "Rename element", input);
        }
        let params_rename = find_rename_obj(input);
        classes.rename_object(params_rename[0], params_rename[1]);
    //Delet objects
    }else if (input.indexOf('delete') != -1 || input.indexOf('remove') != -1 || input.indexOf('cancel') != -1 || input.indexOf('drop ') != -1){
        if(class_buttons.do_log){
            execute_ajax(class_buttons.user_id, "Delete element", input);
        }
        let param_delete = find_delete_object(input);
        classes.delete_object(param_delete);
    }else if(input.indexOf('undo') != -1 || input.indexOf('make') != -1 || input.indexOf('primary key') != -1 || input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1 || input.indexOf('multivalued') != -1){
        //Undo primary key or multivalued
        if(input.indexOf('undo') != -1 || input.indexOf('make') != -1 && input.indexOf('not') != -1 || input.indexOf('make') != -1 && input.indexOf('single valued') != -1){
            if(input.indexOf('primary key') != -1){
                if(class_buttons.do_log){
                    execute_ajax(class_buttons.user_id, "Undo primary key", input);
                }
                let param_undo = find_undo_name(input);
                if(param_undo != null){
                    classes.undo_primary_key(param_undo);
                }
            }else if(input.indexOf('multi valued') != -1 || input.indexOf('single valued') || input.indexOf('multi-valued') != -1 || input.indexOf('single-valued') || input.indexOf('multivalued') != -1 || input.indexOf('singlevalued')){
                if(class_buttons.do_log){
                    execute_ajax(class_buttons.user_id, "Undo multivalued", input);
                }
                let param_undo = find_undo_name(input);
                if(param_undo != null){
                    classes.undo_multi_valued(param_undo);
                }
            }else{
                toastr.error("Can't find attribute to undo action!");
                
            }
        //Make attribute multivalued or as primary key
        }else if((input.indexOf('make') != -1 && input.indexOf('not') == -1) || (input.indexOf('primary key') != -1 || input.indexOf('multi valued') != -1) || input.indexOf('multi-valued') != -1 || input.indexOf('multivalued') != -1){
            //Make attribute primary key
            if(class_buttons.do_log){
                execute_ajax(class_buttons.user_id, "Make attribute-type primary key or multi-valued", input);
            }
            let param_do = find_do_name(input);
            if(param_do != null){
                if(input.indexOf('primary key') != -1){
                    if(class_buttons.do_log){
                        execute_ajax(class_buttons.user_id, "Make attribute-type primary key", input);
                    }
                    classes.make_primary_key(param_do);
                }else if(input.indexOf('multi valued') != -1 || input.indexOf('multi-valued') != -1 || input.indexOf('multivalued') != -1){
                    if(class_buttons.do_log){
                        execute_ajax(class_buttons.user_id, "Make attribute-type multi-valued", input);
                    }
                    classes.make_multi_valued(param_do);
                }
            }
        }
    }
    else{
        if(class_buttons.do_log){
            execute_ajax(class_buttons.user_id, "Could not identity any action!", input);
        }
        toastr.error("Could not identify any action!","What do you want to do?");
    }
}

module.exports = {
    execute_speech: execute_speech
}

