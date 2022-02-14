const regex_find_number_relationship = [/ ?(?:one|1|a lot of|many|several|multiple|a|n|m)? ?(?:entity)? ?(?:type)? ?(?:named |called )?([a-z]+) .*? (one|1|a lot of|many|several|multiple|a|n|m) ?(?:entity)? ?(?:type|types)? ?(?:named|called)? ([a-z]+)/g];
let sentence = "person has many houses";

for(let i = 0; i < regex_find_number_relationship.length; i++){
    regex_find_number_relationship[i].lastIndex = 0;
    while(match = regex_find_number_relationship[i].exec(sentence)){
        console.log(match);
    }
    console.log("not found");
}