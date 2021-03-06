const joint = require('jointjs');
const uniqid = require('uniqid');

const user_id = uniqid();
const do_log = false;


const ent_button = document.getElementById('ent_button');
const rel_button = document.getElementById('rel_button');
const attr_button = document.getElementById('attr_button');
const sub_button = document.getElementById('sub_button');
const delete_button = document.getElementById('delete_button');
const save_button = document.getElementById('save-button');
const upload_button = document.getElementById('upload-button');

const ent_input = document.getElementById('ent_input');
const attr_input = document.getElementById('attr_input');
const rel_input = document.getElementById('rel_input');

const select_1_for_rel = document.getElementById('select1');
const select_2_for_rel = document.getElementById('select3');

const select_label_1 = document.getElementById('select2');
const select_label_2 = document.getElementById('select4');

const select_isa = document.getElementById('ISA-Select');

const checkbox_primary = document.getElementById('checkbox1');
const checkbox_multi = document.getElementById('checkbox2');

checkbox_primary.addEventListener('change', actionOnAttributeForPrimaryKey);
checkbox_multi.addEventListener('change', actionOnAttributeForMultivalued);

select_isa.addEventListener('change', createISA);

select_label_1.addEventListener('change', addLabelToConnectionOne);
select_label_2.addEventListener('change', addLabelToConnectionTwo);

select_1_for_rel.addEventListener('change', createRelationshipOne);
select_2_for_rel.addEventListener('change', createRelationshipTwo);

ent_input.addEventListener('keyup', writeTextInElement);
attr_input.addEventListener('keyup', writeTextInElement);
rel_input.addEventListener('keyup', writeTextInElement);

ent_button.addEventListener('click', createEntityType);
rel_button.addEventListener('click', createRelationshipType);
attr_button.addEventListener('click', createAttributType);
sub_button.addEventListener('click', createSubAttributType);
delete_button.addEventListener('click', deleteElement);
save_button.addEventListener('click', save_file);
upload_button.addEventListener('click', load_file);


const pickerOpts = {
    types: [
      {
        description: 'JSON',
        accept: {
          'json/*': ['.json']
        }
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false
  };

let fileHandle;
async function load_file(){
    [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    let fileData = await fileHandle.getFile();
    let json_string = await fileData.text();
    let json_text = json_string.split('&&$$');
    
    graph.clear();

    for(i in json_text){
        graph.addCell(JSON.parse(json_text[i]));
    }
}

async function save(){
    let stream = await fileHandle.createWritable();
    let all_objs = "";
    let elementsList = graph.getElements();

    let linkList = graph.getLinks();
    let all_links = "";

    for(i in elementsList){
        if(i == elementsList.length - 1){
            all_objs +=  JSON.stringify(elementsList[i]);
        }else{
            all_objs +=  JSON.stringify(elementsList[i]) + "&&$$";
        }
        
    }
    for(i in linkList){
        if(i == 0 && all_links.length != 1){
            all_links += '&&$$' + JSON.stringify(linkList[i]) + '&&$$';
        }else if(i == 0 && all_links.length == 1){
            all_links += '&&$$' + JSON.stringify(linkList[i]);
        }
        else if(i == linkList.length-1){
            all_links += JSON.stringify(linkList[i]);
        }
        else{
            all_links += JSON.stringify(linkList[i]) + "&&$$";
        }
    }
    let obj_plus_links = all_objs + all_links;


    await stream.write(obj_plus_links);
    await stream.close();
}


async function save_file(){
    fileHandle = await window.showSaveFilePicker(pickerOpts);
    save();
}


const erd = joint.shapes.erd;

const graph = new joint.dia.Graph();

const paper = new joint.dia.Paper({
    el: document.getElementById('drawing-container'),
    width: '100%',
    height: '77%',
    border: '4px solid black',
    model: graph,
    linkPinning: false,
    highlighting: false,
    gridSize: 10,
    drawGrid: true,
    background: {
        color: 'white'
    },

    defaultConnectionPoint: function(line, view) {
        let element = view.model;
        return element.getConnectionPoint(line.start) || element.getBBox().center();
    }
});

let highlighter = V('path', {
    'stroke': '#FFF701',
    'stroke-width': '5px',
    'fill': 'transparent',
    'pointer-events': 'none'
});

paper.options.restrictTranslate = function(cellView) {
    // move element inside the bounding box of the paper element only
   return cellView.paper.getArea();
}

// Define a specific highligthing path for every shape.

erd.Attribute.prototype.getHighlighterPath = function(w, h) {

    return ['M', 0, h / 2, 'A', w / 2, h / 2, '0 1,0', w, h / 2, 'A', w / 2, h / 2, '0 1,0', 0, h / 2].join(' ');
};

erd.Entity.prototype.getHighlighterPath = function(w, h) {

    return ['M', w, 0, w, h, 0, h, 0, 0, 'z'].join(' ');
};

erd.Relationship.prototype.getHighlighterPath = function(w, h) {

    return ['M', w / 2, 0, w, w / 2, w / 2, w, 0, w / 2, 'z'].join(' ');
};

erd.ISA.prototype.getHighlighterPath = function(w, h) {

    return ['M', -8, 1, w + 8, 1, w / 2, h + 2, 'z'].join(' ');
};


// Define a specific connection points for every shape

erd.Attribute.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with an ellipse
    return g.Ellipse.fromRect(this.getBBox()).intersectionWithLineFromCenterToPoint(referencePoint);
};

erd.Entity.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with a rectangle
    return this.getBBox().intersectionWithLineFromCenterToPoint(referencePoint);
};

erd.Relationship.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with a rhomb
    let bbox = this.getBBox();
    let line = new g.Line(bbox.center(), referencePoint);
    return (
        line.intersection(new g.Line(bbox.topMiddle(), bbox.leftMiddle())) ||
        line.intersection(new g.Line(bbox.leftMiddle(), bbox.bottomMiddle())) ||
        line.intersection(new g.Line(bbox.bottomMiddle(), bbox.rightMiddle())) ||
        line.intersection(new g.Line(bbox.rightMiddle(), bbox.topMiddle()))
    );
};


erd.ISA.prototype.getConnectionPoint = function(referencePoint) {
    // Intersection with a triangle
    let bbox = this.getBBox();
    let line = new g.Line(bbox.center(), referencePoint);
    return (
        line.intersection(new g.Line(bbox.topMiddle(), bbox.bottomRight())) ||
        line.intersection(new g.Line(bbox.bottomRight(), bbox.bottomLeft())) ||
        line.intersection(new g.Line(bbox.bottomLeft(), bbox.topMiddle()))
    );
};

function highlightElement(elm){
    currentElement = elm;
    
    let padding = 5;
    let bbox = elm.getBBox({ useModelGeometry: true }).inflate(padding);

    highlighter.translate(bbox.x, bbox.y, { absolute: true });
    highlighter.attr('d', elm.getHighlighterPath(bbox.width, bbox.height));

    V(paper.viewport).append(highlighter);

    let elementType = String(currentElement.attributes.type);

    if(elementType.includes("Entity")){
        addOptionsToSelectIsA();
        updateIsaSelect();

        document.getElementById("selectid_1").style.visibility = "hidden";
        document.getElementById("Eingabefeld-Entity").style.visibility = "visible";
        document.getElementById("Eingabefeld-Attribute").style.visibility = "hidden";
        document.getElementById("attr_button").disabled = false;
        document.getElementById("ent_input").focus();
        document.getElementById("ent_input").value = currentElement.attr("text/text");
    }else if(elementType.includes("Normal")){
        document.getElementById("selectid_1").style.visibility = "hidden";
        document.getElementById("Eingabefeld-Entity").style.visibility = "hidden";
        document.getElementById("Eingabefeld-Attribute").style.visibility = "visible";
        document.getElementById("sub_button").disabled = false;
        document.getElementById("attr_button").disabled = true;
        document.getElementById("attr_input").focus();
        document.getElementById("attr_input").value = currentElement.attr("text/text");
    }else if(elementType.includes("Relationship")){
        addOptionsToSelect();
        initializeSelectValues();
        document.getElementById("selectid_1").style.visibility = "visible";
        document.getElementById("Eingabefeld-Entity").style.visibility = "hidden";
        document.getElementById("Eingabefeld-Attribute").style.visibility = "hidden";
        document.getElementById("sub_button").disabled = true;
        document.getElementById("attr_button").disabled = false;
        document.getElementById("rel_input").focus();
        document.getElementById("rel_input").value = currentElement.attr("text/text");
    }
    
}

paper.on('element:pointerdown', function(cellView) {
    highlightElement(cellView.model);
});

paper.on('element:pointermove', function(cellView) {
    highlightElement(cellView.model);
    let elementType = String(currentElement.attributes.type);
    if(elementType.includes("Entity") && currentElement.attributes.isParentEntity){
            updateIsaPosition();   
    }
});

paper.on('blank:pointerdown', function() {
    highlighter.remove();
    currentElement = null;
});

// Classes
class Paper extends joint.dia.Paper {
    constructor(args = {}) {
      let args_new = {
           linkPinning: false,
           defaultConnectionPoint: function(line, view) {
               let element = view.model;
               return element.getConnectionPoint(line.start) || element.getBBox().center();
           }
       }
       for (let attrname in args) { args_new[attrname] = args[attrname]; }
       super(args_new);
   
    }
}

class Entity extends erd.Entity {
    constructor(args = {}) {
        let args_new = {
            isParentEntity : false,
            inheritanceConnectionToParent : [],
            inheritanceConnectionsToChildren : [],
            listChildren : [],
            relationship_object: [],
            position: { x: 100, y: 200 },
            size: {width: 100, height: 45},
            attrs: {
                text: {
                    fill: '#000000',
                    text: '',
                    letterSpacing: 0,
                    fontWeight: 'bold'
                },
                '.outer': {
                    fill: '#ffaa63',
                    stroke: 'none',
                    filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
                },
                '.inner': {
                    fill: '#ffaa63',
                    stroke: 'black',
                    filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
                }
            }
        }
        super(args_new)
    }     
}

class WeakEntity extends erd.WeakEntity {
    constructor(args = {}) {
    let args_new = {
    listChildren : [],
    position: { x: 530, y: 200 },
       size: {width: 100, height: 45},
       attrs: {
           text: {
               fill: '#000000',
               text: '',
               letterSpacing: 0,
               fontWeight: 'bold'
           },
           '.inner': {
               fill: '#ffaa63',
               stroke: 'none',
               points: '155,5 155,55 5,55 5,5'
           },
           '.outer': {
               fill: 'none',
               stroke: '#ffaa63',
               points: '160,0 160,60 0,60 0,0',
               filter: { name: 'dropShadow',  args: { dx: 0.5, dy: 2, blur: 2, color: '#333333' }}
           }
       }
    }
        super(args_new)
    }  
    
}

class IdentifyingRelationship extends erd.IdentifyingRelationship {
    constructor(args = {}) {
        let args_new = {
        position: { x: 350, y: 190 },
        attrs: {
            text: {
                fill: '#ffffff',
                text: '',
                letterSpacing: 0,
                style: { textShadow: '1px 0 1px #333333' }
            },
            '.inner': {
                fill: '#797d9a',
                stroke: 'none'
            },
            '.outer': {
                fill: 'none',
                stroke: '#797d9a',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 1, color: '#333333' }}
            }
        }
        }
        super(args_new)
    }     
}

class ISA extends erd.ISA {
    constructor(args = {}) {
        let args_new = {
        position: { x: 160, y: 260 },
        attrs: {
            text: {
                text: '\n\nis-a',
                fontSize: '14px',
                fill: '#ffffff',
                letterSpacing: 0,
                style: { 'text-shadow': '1px 0 1px #333333' }
            },
            polygon: {
                fill: '#42aaaa',
                stroke: 'none',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 1, color: '#333333' }},
                points: "0,50 50,0 100,50"
            }
        },
        size: {width: 30, height:30}
        }
        super(args_new)
    }     
}

class Key extends erd.Key {
    constructor(args = {}) {
        let args_new = {
        position: { x: 10, y: 90 },
        attrs: {
            text: {
                fill: '#000000',
                text: '',
                letterSpacing: 0,
                fontWeight: 'bold'
            },
            '.outer': {
                fill: '#ffcb63',
                stroke: 'none',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
            },
            '.inner': {
                fill: '#ffcb63',
                stroke: 'none'
            }
        }
        }
        super(args_new)
    }     
}
   
class Attribute extends erd.Normal {
    constructor(args = {}) {
        let args_new = {
        parentObj: null,
        listChildren : [],
        position: { x: 75, y: 30 },
        attrs: {
            text: {
                fill: '#000000',
                text: '',
                letterSpacing: 0,
                fontWeight: 'bold'
            },
            '.outer': {
                fill: '#ffcb63',
                stroke: '#ffcb63',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
            }
        }
        }
        super(args_new)
    }    
}

class Multivalued extends erd.Multivalued {
    constructor(args = {}) {
        let args_new = {
        position: { x: 150, y: 90 },
        attrs: {
            text: {
                fill: '#000000',
                text: '',
                letterSpacing: 0,
                fontWeight: 'bold'
            },
            '.inner': {
                fill: '#ffcb63',
                stroke: '#797d9a',
                rx: 43,
                ry: 21

            },
            '.outer': {
                fill: '#ffcb63',
                stroke: '#797d9a',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#000000' }}
            }
        }
        }
        super(args_new)
    }    
}

class Derived extends erd.Derived {
    constructor(args = {}) {
        let args_new = {
        position: { x: 440, y: 80 },
        attrs: {
            text: {
                fill: '#000000',
                text: '',
                letterSpacing: 0,
                fontWeight: 'bold'
            },
            '.inner': {
                fill: '#ffcb63',
                stroke: 'none',
                display: 'block'
            },
            '.outer': {
                fill: '#ffcb63',
                stroke: '#000000',
                'stroke-dasharray': '5,5',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 2, color: '#222138' }}
            }
        }
        }
        super(args_new)
    }    
}

class Relationship extends erd.Relationship {
    constructor(args = {}) {
        let args_new = {
        listChildren : [],
        firstConnectionObject: null,
        firstConnectionLink : null,

        secondConnectionObject : null,
        secondConnectionLink : null,

        position: { x: 300, y: 390 },
        size: {width: 70, height: 70},
        attrs: {
            text: {
                fill: '#ffffff',
                text: '',
                letterSpacing: 0,
                style: { textShadow: '1px 0 1px #333333' }
            },
            '.inner': {
                fill: '#7c68fd',
                stroke: 'none'
            },
            '.outer': {
                fill: '#7c68fd',
                stroke: 'none',
                filter: { name: 'dropShadow',  args: { dx: 0, dy: 2, blur: 1, color: '#333333' }}
            }
        }
        }
        super(args_new)
    }    
}


//Helpers
//Find Objects
function get_elements_by_id(id){
    let elementsList = graph.getElements();
    for(i in elementsList){
        if(elementsList[i].id == id){
            return elementsList[i];
        }
    }
    return null;
}
function get_links_by_id(id){
    let linksList = graph.getLinks();
    for(i in linksList){
        if(linksList[i].id == id){
            return linksList[i];
        }
    }
    return null;
}

function findAllEntities(){
    let elementsList = graph.getElements();

    let onlyEntities = [];
    for(elm in elementsList){
        let elementType = String(elementsList[elm].attributes.type);
        if(elementType.includes("Entity")){
            onlyEntities.push(elementsList[elm]);
        }
    }
    return onlyEntities;
}

//Helper for writing to google sheets
function execute_ajax(user_id, action_on, action){
    $.ajax({
        url: "https://maker.ifttt.com/trigger/log-trigger/json/with/key/oxQQU39-NxWKLgAMZSuRmKrGc9JE1VOrBBrVU0KHEN0",
        type: "POST",
        dataType: 'application/json',
        data: {user_id: user_id, action_on : action_on ,action : action}
    });
}

//Create Objects

let createLink = function(elm1, elm2) {
    if(elm1 != null){
        let myLink = new erd.Line({
            markup: [
                '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
                '<path class="connection-wrap" d="M 0 0 0 0"/>',
                '<g class="labels"/>',
                '<g class="marker-vertices"/>',
                '<g class="marker-arrowheads"/>'
            ].join(''),
            source: { id: elm1.id },
            target: { id: elm2.id }
        });
    
        return myLink.addTo(graph);
    }
};

function createEntityType(){
    let ent_obj = new Entity();
    ent_obj.position(Math.floor(Math.random() * (paper.getArea().width-150)),
            Math.floor(Math.random() * (paper.getArea().height-65)));
    graph.addCell(ent_obj);
    highlightElement(ent_obj);
    if(do_log){
        execute_ajax(user_id,"On Button Click", "Create Entity-Type");
    }
}


function createAttributType(){
    let attr_obj = new Attribute();
    //Every attribute-type knows its parent entity-type
    attr_obj.attributes.parentObj = currentElement.id;

    attr_obj.position(currentElement.position().x-120+Math.floor(Math.random()*240),
            currentElement.position().y-120+Math.floor(Math.random()*240));

    graph.addCell(attr_obj);

    createLink(currentElement, attr_obj);
    //Every entity-tipe knows all of its children attribute-types
    currentElement.attributes.listChildren.push(attr_obj.id);

    highlightElement(attr_obj);
    if(do_log){
        execute_ajax(user_id,"On Button Click", "Create Attribute-Type");
    }
}

function createSubAttributType(){
    let sub_attr_obj = new Attribute();
    //Every sub attribute-type knows its parent attribute
    sub_attr_obj.attributes.parentObj = currentElement.id;
    sub_attr_obj.position(currentElement.position().x-120+Math.floor(Math.random()*240),
        currentElement.position().y-120+Math.floor(Math.random()*240));

    //Every attribute-type knowsnits children sub attribute-types
    currentElement.attributes.listChildren.push(sub_attr_obj.id);
    graph.addCell(sub_attr_obj);
    createLink(currentElement, sub_attr_obj);
    highlightElement(sub_attr_obj);
    if(do_log){
        execute_ajax(user_id,"On Button Click", "Create Sub-Attribute-Type");
    }
}

function createRelationshipType(){
    let rel_obj = new Relationship();

    rel_obj.position(Math.floor(Math.random() * (paper.getArea().width-150)),
            Math.floor(Math.random() * (paper.getArea().height-65)));
    graph.addCell(rel_obj);
    highlightElement(rel_obj);
    if(do_log){
        execute_ajax(user_id,"On Button Click", "Create Relationship-Type");
    }
}

function writeTextInElement(){
    let elementType = String(currentElement.attributes.type);
    if(elementType.includes("Relationship")){
        let msg = document.getElementById("rel_input").value;
        currentElement.attr("text/text", msg); 
    }else if(elementType.includes("Entity")){
        let msg = document.getElementById("ent_input").value;
        currentElement.attr("text/text", msg.charAt(0).toUpperCase() + msg.slice(1));
    }else if(elementType.includes("Normal")){
        let msg = document.getElementById("attr_input").value;
        currentElement.attr("text/text", msg.charAt(0).toUpperCase() + msg.slice(1)); 
    } 
}

//Global dictionary of current entity-type names as key and the object as value
let storedEntities = {};

function addOptionsToSelect(){
    storedEntities = [];
    let allEntities = findAllEntities();
    
    let optionsContainer1 = document.getElementById("select1");
    let optionsContainer2 = document.getElementById("select3");
    //Delete all previous stored options
    while(optionsContainer1.length > 1){
        optionsContainer1.remove(1);
        optionsContainer2.remove(1);
    }
    //Add all entity-type names to select
    for(ent in allEntities){
        let option1 = document.createElement("option");
        option1.value = allEntities[ent].attr("text/text");
        option1.text = allEntities[ent].attr("text/text");

        storedEntities[allEntities[ent].attr("text/text")] = allEntities[ent];
        
        let option2 = document.createElement("option");
        option2.value = allEntities[ent].attr("text/text");
        option2.text = allEntities[ent].attr("text/text");
        
        optionsContainer1.appendChild(option1);
        optionsContainer2.appendChild(option2);
    }
}

function createRelationshipOne(){
    //Get text of the selected value in dropdown-list
    let selectValue = document.getElementById("select1").value;
    //Get the Entity-Object, which has to be connected with the relationsship
    let connectionObject = storedEntities[selectValue];

    //Get current connection and connected Entity of the relationship
    let currentLink = get_links_by_id(currentElement.attributes.firstConnectionLink);
    let currentObject = get_elements_by_id(currentElement.attributes.firstConnectionObject);
    let firstLink;
    //Current connection has changed
    if(currentObject != null  && currentObject != connectionObject){
        graph.removeCells(currentLink);
        firstLink = createLink(currentElement, connectionObject);
    //Relationship hasn't a conneciton until yet
    }else if(currentObject == null){
        firstLink = createLink(currentElement, connectionObject);
    //Current connection and new connection are the same
    }else{
        firstLink = currentLink;
    }
    //Set varible in relationship
    firstLink.set(createLabel("1"));
    currentElement.attributes.firstConnectionLink = firstLink.id;
    currentElement.attributes.firstConnectionObject = connectionObject.id;
    writeWholeRelationshipInEntityFromRelOne(currentElement, connectionObject);
    if(do_log){
        execute_ajax(user_id,"On Select Value", "Create Relationship-One for " + selectValue);
    }
}
function writeWholeRelationshipInEntityFromRelOne(rel_obj, first_con_obj){
    if(rel_obj.attributes.secondConnectionObject != null){
        let second_con_obj = get_elements_by_id(rel_obj.attributes.secondConnectionObject);
        first_con_obj.attributes.relationship_object.push([first_con_obj.id, rel_obj.id, second_con_obj.id]);
        second_con_obj.attributes.relationship_object.push([second_con_obj.id, rel_obj.id, first_con_obj.id]);
    }
}
function writeWholeRelationshipInEntityFromRelTwo(rel_obj, second_con_obj){
    if(rel_obj.attributes.firstConnectionObject != null){
        let first_con_obj = get_elements_by_id(rel_obj.attributes.firstConnectionObject);
        first_con_obj.attributes.relationship_object.push([first_con_obj.id, rel_obj.id, second_con_obj.id]);
        second_con_obj.attributes.relationship_object.push([second_con_obj.id, rel_obj.id, first_con_obj.id]);
    }
}
function createRelationshipTwo(){
    //Get text of the selected value in dropdown-list
    let selectValue = document.getElementById("select3").value;
    //Get the Entity-Object, which has to be connected with the relationsship
    let connectionObject = storedEntities[selectValue];

    //Get current connection and connected Entity of the relationship
    let currentLink = get_links_by_id(currentElement.attributes.secondConnectionLink);
    let currentObject = get_elements_by_id(currentElement.attributes.secondConnectionObject);
    let secondLink;
    //Current connection has changed
    if(currentObject != null  && currentObject != connectionObject){
        graph.removeCells(currentLink);
        secondLink = createLink(currentElement, connectionObject);
    //Relationship hasn't a conneciton until yet
    }else if(currentObject == null){
        secondLink = createLink(currentElement, connectionObject);
    //Current connection and new connection are the same
    }else{
        secondLink = currentLink;
    }
    //Set varible in relationship
    secondLink.set(createLabel("1"));
    currentElement.attributes.secondConnectionObject = connectionObject.id;
    currentElement.attributes.secondConnectionLink = secondLink.id;
    writeWholeRelationshipInEntityFromRelTwo(currentElement, connectionObject);
    if(do_log){
        execute_ajax(user_id,"On Select Value", "Create Relationship-Two for " + selectValue);
    }
}

let createLabel = function(txt) {
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

function addLabelToConnectionOne(){
    let selectValue = document.getElementById("select2").value;
    let currentLink = get_links_by_id(currentElement.attributes.firstConnectionLink);
    currentLink.set(createLabel(selectValue));
    updateLabelsOfConnection();
    if(do_log){
        execute_ajax(user_id,"On Select Value", "Change number for Entity 1 to: " + selectValue);
    }
}

function addLabelToConnectionTwo(){
    let selectValue = document.getElementById("select4").value;
    let currentLink = get_links_by_id(currentElement.attributes.secondConnectionLink);
    currentLink.set(createLabel(selectValue));
    updateLabelsOfConnection();
    if(do_log){
        execute_ajax(user_id,"On Select Value", "Change number for Entity 2 to: " + selectValue);
    }
}

function updateLabelsOfConnection(){

    let firstCurrentLink = get_links_by_id(currentElement.attributes.firstConnectionLink);
    let secondCurrentLink = get_links_by_id(currentElement.attributes.secondConnectionLink);

    if(secondCurrentLink != null){
        let valueFirstLabel = firstCurrentLink.attributes.labels[0].attrs.text.text;
        let valueSecondLabel = secondCurrentLink.attributes.labels[0].attrs.text.text;

        if(valueFirstLabel != "1\n" && valueSecondLabel != "1\n"){
            
            valueSecondLabel = "M";
            secondCurrentLink.set(createLabel(valueSecondLabel));

            let dropdownListVal = document.getElementById("select4").value;
            if(dropdownListVal != "M"){
                updateValueLableDropdownListToValue_M();
                document.getElementById("select4").value = "M";
            }
        }else if(valueFirstLabel != "N\n" && valueSecondLabel != "1\n"){

            valueSecondLabel = "N";
            secondCurrentLink.set(createLabel(valueSecondLabel));

            let dropdownListVal = document.getElementById("select4").value;
            if(dropdownListVal != "N"){
                updateValueLableDropdownListToValue_N();
                document.getElementById("select4").value = "N";
            }
        }else if (valueFirstLabel != "1\n" && valueSecondLabel == "1\n"){

            let dropdownListVal = document.getElementById("select4").value;
            if(dropdownListVal != "M"){
                updateValueLableDropdownListToValue_M();
                document.getElementById("select4").value = "1";
            }
            
        }else{

            let dropdownListVal = document.getElementById("select4").value;
            if(dropdownListVal != "N"){
                updateValueLableDropdownListToValue_N();
            }
        }
    }else{
        let valueFirstLabel = firstCurrentLink.attributes.labels[0].attrs.text.text;
        if(valueFirstLabel != "1\n"){
            updateValueLableDropdownListToValue_M();
        }
    } 
}

function updateValueLableDropdownListToValue_M(){
    let dropdownList = document.getElementById("select4");
    let option = document.createElement("option");
    option.value = "M";
    option.text = "M";

    dropdownList.remove(1);
    dropdownList.appendChild(option);

}
function updateValueLableDropdownListToValue_N(){
    let dropdownList = document.getElementById("select4");
    let option = document.createElement("option");
    option.value = "N";
    option.text = "N";

    dropdownList.remove(1);
    dropdownList.appendChild(option);
}

//This if for creating relationship-types with select buttons
function initializeSelectValues(){

    if(get_elements_by_id(currentElement.attributes.firstConnectionObject) != null){
        let firstConnectionObjectName = get_elements_by_id(currentElement.attributes.firstConnectionObject).attributes.attrs.text.text;
        document.getElementById("select1").value = firstConnectionObjectName;
    }
    if(get_links_by_id(currentElement.attributes.firstConnectionLink) != null){
        let firstLinkLabelName = get_links_by_id(currentElement.attributes.firstConnectionLink).attributes.labels[0].attrs.text.text;
        firstLinkLabelName = firstLinkLabelName.trim();
        $("#select2").val(firstLinkLabelName);
    }
    if(get_elements_by_id(currentElement.attributes.secondConnectionObject) != null){
        let secondConnectionObjectName = get_elements_by_id(currentElement.attributes.secondConnectionObject).attributes.attrs.text.text;
        document.getElementById("select3").value = secondConnectionObjectName;
    }
    if(get_links_by_id(currentElement.attributes.secondConnectionLink) != null){
        let secondLinkLabelName = get_links_by_id(currentElement.attributes.secondConnectionLink).attributes.labels[0].attrs.text.text;
        secondLinkLabelName = secondLinkLabelName.trim();
        $("#select4").val(secondLinkLabelName);
    }
}

function deleteElement(elm){
    let type = String(elm.type);
    if(type.includes("click")){
        elm = currentElement;
    }
    if(elm != null){
        let elementType = String(elm.attributes.type);
        //Delete Entity and all it's children attributes
        if(elementType.includes("Entity")){
            if(do_log){
                execute_ajax(user_id,"On Button Click", "Delete Entity-Type: " + elm.attr("text/text"));
            }
            deleteEntity(elm);
        //Delet attributes and their children attributes
        }else if(elementType.includes("Normal")){
            if(do_log){
                execute_ajax(user_id,"On Button Click", "Delete Attribute-Type: " + elm.attr("text/text"));
            }
            deleteAttribute(elm);
        //Delete relationship and their children attributes and their connection links between Entities
        }else if(elementType.includes("Relationship")){
            if(do_log){
                execute_ajax(user_id,"On Button Click", "Delete Relationship-Type: " + elm.attr("text/text"));
            }
            deleteRelationship(elm);
        }
        graph.removeCells(elm);
        highlighter.remove();
    }
}

function deleteAttribute(elm){
    //Get the duplicate of the list, else you change dinamically the list you iterate through --> don't deletes every node
    let listAllChildren = elm.attributes.listChildren.slice();

    let parent = get_elements_by_id(elm.attributes.parentObj);
    let parentChildList = parent.attributes.listChildren;

    //Find index of attribute in the entity-types child list
    let index = findIndexInList(elm, parentChildList);
    //Delete childnode from list of the parent
    parentChildList.splice(index,1);
    
    //Delete children of attribute and their children
    for (child in listAllChildren){
        deleteElement(get_elements_by_id(listAllChildren[child]));
    }
    
    
}

function deleteEntity(elm){
    let isaParentEntity = elm.attributes.isParentEntity;
    //This is a Parent-Entity (other entity-types inherit), and doesn't inherit from other entity-type. Have to remove all connections to its children and the information of ConnectionToParent in chihldnode (entity-type)
    if(isaParentEntity && elm.attributes.inheritanceConnectionToParent.length == 0){
        removeChildrenInheritance(elm);
    //Is parent entity-type and inhertits from other entity-type
    }else if(isaParentEntity && elm.attributes.inheritanceConnectionToParent.length > 0){
        removeChildrenInheritance(elm);
        removeParentInheritance(elm);
    }
    else{
        //Only inherits form other entity-type --> has no entity-type children
        if(elm.attributes.inheritanceConnectionToParent.length > 0){
            removeParentInheritance(elm);
        }
    }
    //Delete all of the entity-types children(attributes)
    //Get the duplicate of the list, else you change dinamically the list you iterat threw --> doesn't delete every node
    let listAllChildren = elm.attributes.listChildren.slice();  
    for (child in listAllChildren){
        deleteElement(get_elements_by_id(listAllChildren[child]));
    }
}
//Helper function for deleteEntity()
function removeChildrenInheritance(elm){
    let childList = elm.attributes.inheritanceConnectionsToChildren;
    for(childConnection in childList){
        let child = get_elements_by_id(childList[childConnection][0]);
        //Delete informatin about its parent entity-type
        child.attributes.inheritanceConnectionToParent = [];
        let isa = get_elements_by_id(childList[childConnection][1]);
        let isaLink = get_links_by_id(childList[childConnection][2]);
        graph.removeCells(isa, isaLink);
    }
}
//Helper function to deletEntity()
function removeParentInheritance(elm){
    let parent = get_elements_by_id(elm.attributes.inheritanceConnectionToParent[0]);
    let isa = get_elements_by_id(elm.attributes.inheritanceConnectionToParent[1]);
    let isaLink = get_links_by_id(elm.attributes.inheritanceConnectionToParent[2]);
    let childListOfParent = parent.attributes.inheritanceConnectionsToChildren;

    //Delete information about child entity-type in parent
    childListOfParent = removeConnectionFromChildlist(elm, childListOfParent);
    if(childListOfParent.length == 0){
        parent.attributes.isParentEntity = false;
    }
    graph.removeCells(isa,isaLink);
}

function removeConnectionFromChildlist(elm, list){
    let index = findIndexOfChildEntity(elm,list);
    list.splice(index,1);
    return list;
}

function findIndexOfChildEntity(elm, listOfLists){
    index = 0;
    for(listElement in listOfLists){
        if(get_elements_by_id(listOfLists[listElement][0]) == elm){
            return index;
        }else{
            index +=1;
        }
    }
}
function findIndexInList(elm, list){
    let index = 0;
    for(item in list){
        if(get_elements_by_id(list[item]) == elm){
            return index;
        }else{
            index +=1;
        }
    }
}

function deleteRelationship(elm){
    let firstLink = get_links_by_id(elm.attributes.firstConnectionLink);
    let secondLink = get_links_by_id(elm.attributes.secondConnectionLink);

    graph.removeCells(firstLink);
    graph.removeCells(secondLink);

    let listAllChildren = elm.attributes.listChildren.slice();  
    for (child in listAllChildren){
        deleteElement(get_elements_by_id(listAllChildren[child]));
    }
}


function actionOnAttributeForMultivalued(){
    let checkbox1 = document.getElementById("checkbox1");
    let checkbox2 = document.getElementById("checkbox2");
    if(checkbox1.checked){
        checkbox1.checked = false;
        //function to uncheck primarykey
        undoPrimaryKey();
    }
    if(checkbox2.checked){
        makeAttributeMultivalued();
    }else{
        makeMultiSingleValued();
    }
}

function actionOnAttributeForPrimaryKey(){
    let checkbox1 = document.getElementById("checkbox1");
    let checkbox2 = document.getElementById("checkbox2");

    if(checkbox2.checked){
        checkbox2.checked = false;
        makeMultiSingleValued();
    }
    if(checkbox1.checked){
        makePrimaryKey();
    }else{
        undoPrimaryKey();
    }
}

function makeAttributeMultivalued(){
    currentElement.attr(".inner/display", "block");
    currentElement.attr(".inner/fill", "#ffcb63");
    currentElement.attr(".inner/stroke", "#797d9a");
    currentElement.attr(".outer/stroke", "#797d9a");
    if(do_log){
        execute_ajax(user_id,"On checkbox multivalued checked", "Make Attribute-Type multi valued: " + currentElement.attr("text/text"));
    }
}

function makeMultiSingleValued(){
    currentElement.attr(".inner/display", "none");
    currentElement.attr(".outer/stroke", "#ffcb63");
    if(do_log){
        execute_ajax(user_id,"On checkbox multivalued unchecked", "Make Attribute-Type single valued: " + currentElement.attr("text/text"));
    }
}

function makePrimaryKey(){
    currentElement.attr("text/text-decoration", "underline");
    if(do_log){
        execute_ajax(user_id,"On checkbox primary key checked", "Make Attribute-Type primary key: " + currentElement.attr("text/text"));
    }
}
function undoPrimaryKey(){
    currentElement.attr("text/text-decoration", "none");
    if(do_log){
        execute_ajax(user_id,"On checkbox primary key unchecked", "Undo primary key for Attribute-Type: " + currentElement.attr("text/text"));
    }
}

let storedEntitiesISA = [];
function addOptionsToSelectIsA(){
    storedEntitiesISA = [];
    let allEntities = findAllEntities();
    
    let optionsContainer1 = document.getElementById("ISA-Select");

    while(optionsContainer1.length > 1){
        optionsContainer1.remove(1);
    }
    for(ent in allEntities){
        if(allEntities[ent].attr("text/text") != currentElement.attr("text/text")){
            let option1 = document.createElement("option");
            option1.value = allEntities[ent].attr("text/text");
            option1.text = allEntities[ent].attr("text/text");
    
            storedEntitiesISA[allEntities[ent].attr("text/text")] = allEntities[ent];
            optionsContainer1.appendChild(option1);
        }
    }
}

function createISA(){
    let selectValue = document.getElementById("ISA-Select").value;
    //Get the Entity-Object, which has to be connected with the relationsship
    let connectionObject = storedEntitiesISA[selectValue];
    if(currentElement.attributes.inheritanceConnectionToParent.length == 0){
        makeNewIsaConnection(currentElement, connectionObject);
    // Entity is alreday inherited, but user select to undo the inheritance
    }else if(selectValue == "" && currentElement.attributes.inheritanceConnectionToParent.length > 0){
        changeIsaConnections(currentElement);
    // Current Entity already inherited, user chooses other parent --> delete current inheritance and create new one
    }else if(selectValue != "" && currentElement.attributes.inheritanceConnectionToParent.length > 0){
        changeIsaConnections(currentElement);
        makeNewIsaConnection(currentElement, connectionObject);
    }
    if(do_log){
        execute_ajax(user_id,"On select isa", "Create isa-type -->child: " + currentElement.attr("text/text") + " parent: " + selectValue);
    }
}

function makeNewIsaConnection(currElement, parentElement){
    let isa = new ISA();
    isa.position(parentElement.position().x + 40, parentElement.position().y +45);
    graph.addCell(isa);
    isaLink = createLink(currElement, isa);
    
    parentElement.attributes.isParentEntity = true;
    let inheritanceConnectionToChild = [currElement.id,isa.id,isaLink.id];
    
    parentElement.attributes.inheritanceConnectionsToChildren.push(inheritanceConnectionToChild);

    currElement.attributes.inheritanceConnectionToParent.push(parentElement.id,isa.id,isaLink.id);
}

function changeIsaConnections(currElement){
    let parent = get_elements_by_id(currElement.attributes.inheritanceConnectionToParent[0]);
    let isa = get_elements_by_id(currElement.attributes.inheritanceConnectionToParent[1]);
    let isaLink = get_links_by_id(currElement.attributes.inheritanceConnectionToParent[2]);
    
    graph.removeCells(isa,isaLink);
    
    currElement.attributes.inheritanceConnectionToParent = [];
    
    parent.attributes.inheritanceConnectionsToChildren = removeConnectionFromChildlist(currentElement, parent.attributes.inheritanceConnectionsToChildren);
    if(parent.attributes.inheritanceConnectionsToChildren.length == 0){
        parent.attributes.isParentEntity = false;
    }
}

function updateIsaPosition(){
    let childrenList = currentElement.attributes.inheritanceConnectionsToChildren;
    if(childrenList.length > 0){
        for(child in childrenList){
            let isa = get_elements_by_id(childrenList[child][1]);
            isa.position(currentElement.position().x + 40, currentElement.position().y + 45);
        }
    }
}

function updateIsaSelect(){
    let parentConnection = currentElement.attributes.inheritanceConnectionToParent;
    if(parentConnection.length > 0){
        document.getElementById("ISA-Select").value = get_elements_by_id(parentConnection[0]).attributes.attrs.text.text;
    }
    
}

module.exports = {
    graph:graph,
    paper:paper,
    highlighter: highlighter,
    user_id: user_id,
    do_log: do_log,
    Entity:Entity,
    WeakEntity:WeakEntity,
    Attribute:Attribute,
    Relationship:Relationship,
    ISA:ISA,
    highlightElement:highlightElement,
    createLink:createLink,
    deleteElement:deleteElement,
    updateIsaPosition:updateIsaPosition,
    findAllEntities: findAllEntities
}
