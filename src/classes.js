var class_buttons = require('./classes_buttons');
const levenshtein = require('../node_modules/js-levenshtein');
var swal = require('../node_modules/sweetalert');



var erd = class_buttons.erd;
var graph = class_buttons.graph;
var paper = class_buttons.paper;
var highlighter = class_buttons.highlighter;

//Helpers
function get_levenshtein(word_input, name_object){
    return [levenshtein(word_input, name_object)/get_length_of_shorter_word(word_input,name_object), name_object];
}
function get_length_of_shorter_word(word1, word2){
    if(word1.length <= word2.length){
        return word1.length;
    }
    return word2.length;
}
//Helper functions to find objects by name
function find_entity_object_by_name(name_entity){
    if(name_entity != null){
        const elementsList = graph.getElements();
        var list_lev = [];
        for(elm in elementsList){
            var elementType = String(elementsList[elm].attributes.type);
            if(elementType.includes("Entity")){
                element_name = elementsList[elm].attr("text/text");
                //Calculate difference between words
                list_lev.push(get_levenshtein(name_entity, element_name));
                if(element_name == name_entity){
                    return elementsList[elm];
                }
            }
        }
        //Didn't understand the right word from user input, takes the closest word instead (if there is one)
        list_lev.sort();
        if(list_lev[0][0] < 1){
            var closest_word = list_lev[0][1];
            var ent_obj = find_entity_object_by_name(closest_word);
            return ent_obj;
        }else{
            return null;
        }
    }else{
        return null;
    }
    
}
function find_attribute_object_by_name(name_attribute){
    const elementsList = graph.getElements();
    var list_attr = [];
    var list_lev = [];
    for(elm in elementsList){
        var elementType = String(elementsList[elm].attributes.type);
        if(elementType.includes("Normal")){
            element_name = elementsList[elm].attr("text/text");
            list_lev.push(get_levenshtein(name_attribute, element_name));
            if(element_name == name_attribute){
                list_attr.push(elementsList[elm]);
            }
        }
    }
    
    if(list_attr.length == null){
        list_lev.sort();
        if(list_lev[0][0] < 1){
            var closest_word = list_lev[0][1];
            var attr_obj = find_attribute_object_by_name(closest_word);
            return [attr_obj];
        }else{
            return null;
        }
    }
    return list_attr;
}
function find_attribute_of_object(ent_obj, name_attribute){
    var list_attrs = ent_obj.attributes.listChildren;
    var list_lev = [];
    for(attr_obj in list_attrs){
        list_lev.push(get_levenshtein(name_attribute, list_attrs[attr_obj].attr("text/text")));
        if(list_attrs[attr_obj].attr("text/text") == name_attribute){
            return list_attrs[attr_obj];
        }
    }
    list_lev.sort();
    if(list_lev[0][0] < 1){
        var closest_word = list_lev[0][1];
        var attr_obj = find_attribute_of_object(closest_word);
        return attr_obj;
    }else{
        return null;
    }
}

/*function find_relationship(name_second_entity, ent_obj){
    list_rel = ent_obj.attributes.relationship_object;
    for(rel in rel_obj){
        if(rel_obj[rel][2].attr("text/text") == name_second_entity){
            return rel_obj[rel][1];
        }
    }
}*/

function find_object_by_name(name_object){
    var elementsList = graph.getElements();
    var match_elements = [];
    var list_lev = [];
    for(elm in elementsList){
        var element_name = elementsList[elm].attr("text/text");
        list_lev.push(get_levenshtein(name_object, element_name));
        if(element_name == name_object){
            match_elements.push(elementsList[elm]);
        }
    }
    if(match_elements.length == 0){
        list_lev.sort();
        if(list_lev[0][0] < 0.7){
            var closest_word = list_lev[0][1];
            var obj_list = find_object_by_name(closest_word);
            return obj_list;
        }else{
            return null;
        }
    }
    /*if(match_elements.length == 0){
        return null;
    }*/
    return match_elements;
}
function get_elements_by_id(id){
    var elementsList = graph.getElements();
    for(i in elementsList){
        if(elementsList[i].id == id){
            return elementsList[i];
        }
    }
    return null;
}

function get_links_by_id(id){
    var linksList = graph.getLinks();
    for(i in linksList){
        if(linksList[i].id == id){
            return linksList[i];
        }
    }
    return null;
}

//Functions for creating objects
function create_isa_type(name_child, name_parent){
    var child_ent = find_entity_object_by_name(name_child);
    var parent_ent = find_entity_object_by_name(name_parent);
    if(child_ent.attributes.inhertitanceConnectionToParent.length == 0){
        make_new_isa_connection(child_ent, parent_ent);
    }else{
        change_isa_connections(child_ent);
        make_new_isa_connection(child_ent, parent_ent);
    }
}

function create_entity_type(name_entity){
    if(name_entity != null){
        var ent_obj = new class_buttons.Entity;
        ent_obj.attr("text/text", name_entity); 

        ent_obj.position(Math.floor(Math.random() * (paper.getArea().width-150)),
            Math.floor(Math.random() * (paper.getArea().height-65)));

        graph.addCell(ent_obj);
        class_buttons.highlightElement(ent_obj);
    }
}
function create_attribute_type(name_attribute, name_entity, is_primary_key, is_multi_valued){
    var list_entities = class_buttons.findAllEntities();
    if(list_entities.length == 0){
        //swal_to_user("You need to create an entity-type first before adding an attribute-type!",null);
        toastr.error("","You need to create an entity-type first before adding an attribute-type!");
    }else{
        var attr_obj = new class_buttons.Attribute();
        attr_obj.attr("text/text", name_attribute); 
        if(is_primary_key){
            attr_obj.attr("text/text-decoration", "underline");
        }
        if(is_multi_valued){
            makeAttributeMultivalued(attr_obj);
        }
    
        ent_obj = find_entity_object_by_name(name_entity);
        if(ent_obj != null){
            attr_obj.position(ent_obj.position().x-30+Math.floor(Math.random()*60),
                ent_obj.position().y-30+Math.floor(Math.random()*60));
            
            attr_obj.attributes.listParent.push(ent_obj.id);
    
            graph.addCell(attr_obj);
            class_buttons.createLink(ent_obj, attr_obj);
            ent_obj.attributes.listChildren.push(attr_obj.id);
            class_buttons.highlightElement(attr_obj);
        }else if(currentElement != null){
            attr_obj.position(currentElement.position().x-120+Math.floor(Math.random()*240),
                currentElement.position().y-120+Math.floor(Math.random()*240));
                
            attr_obj.attributes.listParent.push(currentElement.id);
    
            graph.addCell(attr_obj);
            class_buttons.createLink(currentElement, attr_obj);
            currentElement.attributes.listChildren.push(attr_obj.id);
            class_buttons.highlightElement(attr_obj);
        }
    }
}

function create_sub_attribute_type(name_sub_attribute, name_attribute, name_entity){
    var list_attr = find_attribute_object_by_name(name_attribute);
    //There is only one attribut with that name
    if(list_attr.length == 1){
        var attr_obj = list_attr[0];
        var sub_attr_obj = new class_buttons.Attribute();
        sub_attr_obj.attr("text/text", name_sub_attribute);

        sub_attr_obj.position(attr_obj.position().x-120+Math.floor(Math.random()*240),
            attr_obj.position().y-120+Math.floor(Math.random()*240));

        sub_attr_obj.attributes.listParent.push(attr_obj.id);

        attr_obj.attributes.listChildren.push(sub_attr_obj.id);

        graph.addCell(sub_attr_obj);
        class_buttons.createLink(attr_obj,sub_attr_obj);
        class_buttons.highlightElement(sub_attr_obj);
    //There are more attributes with that name
    }else{
        if(name_entity == null){
            //swal("There are multiple attributes with the name \"" + name_attribute + "\"", "Please mention the name of the entity aswell!");
            toastr.error( "Please mention the name of the entity aswell!","There are multiple attributes with the name \"" + name_attribute + "\"");
        }else{
            var ent_obj = find_entity_object_by_name(name_entity);
            if(ent_obj != null){
                var attr_obj = find_attribute_of_object(ent_obj, name_attribute);
                if(attr_obj != null){
                    var sub_attr_obj = new class_buttons.Attribute();
                    sub_attr_obj.attr("text/text", name_sub_attribute);

                    sub_attr_obj.position(attr_obj.position().x-120+Math.floor(Math.random()*240),
                        attr_obj.position().y-120+Math.floor(Math.random()*240));
            
                    sub_attr_obj.attributes.listParent.push(attr_obj.id);
                    attr_obj.attributes.listChildren.push(sub_attr_obj.id);
            
                    graph.addCell(sub_attr_obj);
                    class_buttons.createLink(attr_obj,sub_attr_obj);
                    class_buttons.highlightElement(sub_attr_obj);
                }else{
                    //console.log("Can not find attribute named \"" + name_attribute + "\" from entity \"" + name_entity + "\"");
                    //swal("Can not find attribute named \"" + name_attribute + "\" from entity \"" + name_entity + "\"");
                    toastr.error("","Can not find attribute named \"" + name_attribute + "\" from entity \"" + name_entity + "\"");
                }
            }else{
                //console.log("Can not find entity named \"" + name_entity + "\"");
                //swal("Can not find entity named \"" + name_entity + "\"");
                toastr.error("","Can not find entity named \"" + name_entity + "\"");
            }
        }
    }
}

function create_relationship_type(name_relationship, name_entity_1, name_entity_2){
    
    var ent_obj_1 = find_entity_object_by_name(name_entity_1);
    
    var ent_obj_2 = find_entity_object_by_name(name_entity_2);
    

    //Every entity-type knows their whole relationsships
    if(ent_obj_1 != null && ent_obj_2 != null){
        var rel_obj = new class_buttons.Relationship();
        rel_obj.attr("text/text", name_relationship);

        rel_obj.position((ent_obj_1.position().x + ent_obj_2.position().x)/2, 
            (ent_obj_1.position().y + ent_obj_2.position().y)/2);

        graph.addCell(rel_obj);
        class_buttons.highlightElement(rel_obj);

        ent_obj_1.attributes.relationship_object.push([ent_obj_1.id, rel_obj.id, ent_obj_2.id]);
        ent_obj_2.attributes.relationship_object.push([ent_obj_2.id, rel_obj.id, ent_obj_1.id]);
        create_relationship_connection_1(rel_obj, ent_obj_1);
        create_relationship_connection_2(rel_obj, ent_obj_2);
    }
}

function create_relationship_connection_1(curr_rel_obj, ent_obj){
    var first_link = class_buttons.createLink(curr_rel_obj, ent_obj);
    first_link.set(create_label("1"));
    curr_rel_obj.attributes.firstConnectionLink = first_link.id;
    curr_rel_obj.attributes.firstConnectionObject = ent_obj.id;
}

function create_relationship_connection_2(curr_rel_obj, ent_obj){
    var second_link = class_buttons.createLink(curr_rel_obj, ent_obj);
    second_link.set(create_label("1"));
    curr_rel_obj.attributes.secondConnectionLink = second_link.id;
    curr_rel_obj.attributes.secondConnectionObject = ent_obj.id;
}
var create_label = function(txt) {
    return {
        labels: [{
            position: 0.3,
            attrs: {
                text: { dy: -8, text: txt+"\n", fill: '#000000' },
                rect: { fill: 'none' }
            }
        }]
    };
};

/*function swal_to_user(input1, input2){
    if(input2 == null){
        swal(input1);
    }else{
        swal(input1, input2);
    }
    
}*/

//Helpers to change appearance of objects
function make_primary_key(name_attr){
    var attr_objs = find_attribute_object_by_name(name_attr);
    var elm_found = false;
    if(attr_objs != null){
        if(attr_objs.length == 1){
            attr_objs[0].attr("text/text-decoration", "underline");
        }else{
            for(elm in attr_objs){
                if(attr_objs[elm] == currentElement){
                    attr_objs[elm].attr("text/text-decoration", "underline"); 
                    elm_found = true;
                    break;
                }
            }
            if(!elm_found){
                //swal('There are multiple attributes with the name \"' + name_attr +"\".", 'Please click on the attribute you want to make as primary key and repeat your sentence!');
                toastr.error('Please click on the attribute you want to make as primary key and repeat your sentence!','There are multiple attributes with the name \"' + name_attr +"\".");
            }
        }

    }
}
function undo_primary_key(name_attr){
    var attr_objs = find_attribute_object_by_name(name_attr);
    var elm_found = false;
    if(attr_objs != null){
        if(attr_objs.length == 1){
            attr_objs[0].attr("text/text-decoration", "none");
        }else{
            for(elm in attr_objs){
                if(attr_objs[elm] == currentElement){
                    attr_objs[elm].attr("text/text-decoration", "none"); 
                    elm_found = true;
                    break;
                }
            }
            if(!elm_found){
                //swal('There are multiple attributes with the name \"' + name_attr +"\".",'Please click on the attribute you want to undo primary key and repeat your sentence!');
                toastr('Please click on the attribute you want to undo primary key and repeat your sentence!','There are multiple attributes with the name \"' + name_attr +"\".");
            }
        }

    }
}

function make_multi_valued(name_attr){
    var attr_objs = find_attribute_object_by_name(name_attr);
    var elm_found = false;
    if(attr_objs != null){
        if(attr_objs.length == 1){
            makeAttributeMultivalued(attr_objs[0]);
        }else{
            for(elm in attr_objs){
                if(attr_objs[elm] == currentElement){
                    makeAttributeMultivalued(attr_obj[elm]);
                    elm_found = true;
                    break;
                }
            }
            if(!elm_found){
                //swal('There are multiple attributes with the name \"' + name_attr +"\"", 'Please click on the attribute you want to make multi valued and repeat your sentence!');
                toastr.error('Please click on the attribute you want to make multi valued and repeat your sentence!','There are multiple attributes with the name \"' + name_attr +"\"");
            }
        }

    }
}
function undo_multi_valued(name_attr){
    var attr_objs = find_attribute_object_by_name(name_attr);
    var elm_found = false;
    if(attr_objs != null){
        if(attr_objs.length == 1){
            attr_objs[0].attr(".inner/display", "none");
            attr_objs[0].attr(".outer/stroke", "#ffcb63");
        }else{
            for(elm in attr_objs){
                if(attr_objs[elm] == currentElement){
                    attr_objs[0].attr(".inner/display", "none");
                    attr_objs[0].attr(".outer/stroke", "#ffcb63"); 
                    elm_found = true;
                    break;
                }
            }
            if(!elm_found){
                //swal('There are multiple attributes with the name \"' + name_attr +"\".", 'Please click on the attribute you want to undo primary key and repeat your sentence!');
                toastr.error('Please click on the attribute you want to undo primary key and repeat your sentence!','There are multiple attributes with the name \"' + name_attr +"\".");
            }
        }

    }
}
function rename_object(old_name, new_name){
    var old_objects = find_object_by_name(old_name);
    var elm_found = false;
    if(old_objects != null){
        if(old_objects.length == 1){
            var obj = old_objects[0];
            obj.attr('text/text', new_name);
            elm_found = true;
        }else{
            for(elm in old_objects){
                if(old_objects[elm] == currentElement){
                    var obj = old_objects[elm];
                    obj.attr('text/text', new_name);
                    elm_found = true;
                    break;
                }
            }
            if(!elm_found){
                //swal('There are multiple objects with the name \"' + old_name +"\".", 'Please click on the object you want to rename and repeat your sentence!');
                toastr.error('There are multiple objects with the name \"' + old_name +"\".",'Please click on the object you want to rename and repeat your sentence!');
            }
        }
    }

}
function delete_object(name_object){
    var del_obj_list = find_object_by_name(name_object);
    var found_elm = false;
    if(del_obj_list == null){
        //swal("There is no object called \"" + name_object + "\".", "Can't delete object!");
        toastr.error("Can't delete object!","There is no object called \"" + name_object + "\".");
    }else if(del_obj_list.length == 1){
        class_buttons.deleteElement(del_obj_list[0]);
    }else{
        for(elm in del_obj_list){
            if(del_obj_list[elm] == currentElement){
                class_buttons.deleteElement(del_obj_list[elm]);
                found_elm = true;
                break;
            }
        }
        if(found_elm == false){
            //swal("There are multiple objects with the name \"" + name_object + "\".", "Please click on the object you want to delete and repeat your sentence!");
            toastr.error("Please click on the object you want to delete and repeat your sentence!","There are multiple objects with the name \"" + name_object + "\".");
        }
    }  
}

function makeAttributeMultivalued(attr_obj){
    attr_obj.attr(".inner/display", "block");
    attr_obj.attr(".inner/fill", "#ffcb63");
    attr_obj.attr(".inner/stroke", "#797d9a");
    attr_obj.attr(".outer/stroke", "#797d9a");
}
function add_label_to_connection(name_entity_1, name_entity_2, val_number){
    var ent_obj_1 = find_entity_object_by_name(name_entity_1);
    var ent_obj_2 = find_entity_object_by_name(name_entity_2);
    var rel_obj;
    list_relationships = ent_obj_1.attributes.relationship_object;

    for(rel in list_relationships){
        if(get_elements_by_id(list_relationships[rel][2]) == ent_obj_2){
            rel_obj = get_elements_by_id(list_relationships[rel][1]);
        }
    }
    if(get_elements_by_id(rel_obj.attributes.firstConnectionObject) == ent_obj_2){
        var link_to_change_val  = get_links_by_id(rel_obj.attributes.firstConnectionLink);
        var link = get_links_by_id(rel_obj.attributes.secondConnectionLink);
        var updated_value = check_and_update_label(link, val_number);
        link_to_change_val.set(create_label(updated_value));
    }else{
        var link_to_change_val = get_links_by_id(rel_obj.attributes.secondConnectionLink);
        var link = get_links_by_id(rel_obj.attributes.firstConnectionLink);
        var updated_value = check_and_update_label(link, val_number);
        link_to_change_val.set(create_label(updated_value));
    }
}

function check_and_update_label(link, value_to_insert){
   var value_label = link.attributes.labels[0].attrs.text.text;
   if(value_to_insert == '1' && value_label == "M\n"){
        link.set(create_label("N"));
        return value_to_insert;
   }else if(value_to_insert == 'N' && value_label == "N\n"){
        value_to_insert = "M";
        return value_to_insert;
    }else{
        return value_to_insert;
    }
}

function make_new_isa_connection(child_ent, parent_ent){
    var isa = new class_buttons.ISA;
    isa.position(parent_ent.position().x + 40, parent_ent.position().y +45);
    graph.addCell(isa);
    isa_link = class_buttons.createLink(child_ent, isa);
    
    parent_ent.attributes.isParentEntity = true;
    var inhertitance_connection_to_child = [child_ent.id,isa.id,isa_link.id];
    
    parent_ent.attributes.inhertitanceConnectionsToChildren.push(inhertitance_connection_to_child);

    child_ent.attributes.inhertitanceConnectionToParent.push(parent_ent.id,isa.id,isa_link.id);
}

function change_isa_connections(child_ent){
    var parent_ent = get_elements_by_id(child_ent.attributes.inhertitanceConnectionToParent[0]);
    var isa = get_elements_by_id(child_ent.attributes.inhertitanceConnectionToParent[1]);
    var isa_link = get_links_by_id(child_ent.attributes.inhertitanceConnectionToParent[2]);
    
    graph.removeCells(isa,isa_link);
    
    child_ent.attributes.inhertitanceConnectionToParent = [];
    
    parent_ent.attributes.inhertitanceConnectionsToChildren = remove_connection_from_child_list(child_ent, parent_ent.attributes.inhertitanceConnectionsToChildren);
    if(parent_ent.attributes.inhertitanceConnectionsToChildren.length == 0){
        parent_ent.attributes.isParentEntity = false;
    }
}

function remove_connection_from_child_list(elm, list){
    var index = find_index_of_child_entity(elm,list);
    list.splice(index,1);
    return list;
}

function find_index_of_child_entity(elm, listOfLists){
    index = 0;
    for(listElement in listOfLists){
        if(get_elements_by_id(listOfLists[listElement][0]) == elm){
            return index;
        }else{
            index +=1;
        }
    }
}

module.exports = {
    create_entity_type: create_entity_type,
    create_attribute_type: create_attribute_type,
    create_relationship_type: create_relationship_type,
    add_label_to_connection: add_label_to_connection,
    create_sub_attribute_type: create_sub_attribute_type,
    create_isa_type: create_isa_type,
    delete_object: delete_object,
    rename_object: rename_object,
    make_primary_key: make_primary_key,
    undo_primary_key: undo_primary_key,
    make_multi_valued: make_multi_valued,
    undo_multi_valued: undo_multi_valued,
    //swal_to_user: swal_to_user
}