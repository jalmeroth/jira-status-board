function store(obj) {
  var db = ScriptDb.getMyDb();

  var stored = null;
  
  if(obj) {
    var q = {'name': obj.name, 'day': obj.day};
    var count = db.count(q);
    
    //Logger.log("count: " + count);
    
    // update
    if(count) {
      var item = db.query(q).next();
      for(var key in obj) {
        item[key] = obj[key];
      }
      stored = db.save(item);

    // insert
    } else {
      stored = db.save(obj);
    }
  }
  
  return stored;
}

function retrieve(day) {
  var db = ScriptDb.getMyDb();
  
  var q = {};
  
  if(day) {
    q = {'day' : day};
  }
  
//  var count = db.count({});
//  Logger.log("Count: " + count);

  var results = db.query(q).sortBy("time", db.ASCENDING, db.LEXICAL);
  var grouped = {};
  
  while (results.hasNext()) {
    var obj = results.next();
    // group by name
    var key = obj.name;
    grouped[key] = grouped[key] || [];
    grouped[key].push(obj);
  }
  
  Logger.log(Utilities.jsonStringify(grouped));
  
  return grouped;
}

function insertTestData() {
  var date = new Date();
  var days = 14;
  var moment, moment_str, time;
  
  for(var a = 0; a <= assignees.length; a++) {
    for(var i = 1; i <= days; i++) {
      moment = new Date(date.valueOf() - (i*1000*3600*24));
      moment_str = dateFormat(moment, 'YYYYMMDD');
      time = moment.getTime().toString();
      
      var obj = {
        "time" : time,
        "day" : moment_str,
        "name" : assignees[a],
        "open" : Math.floor(Math.random()*11),
        "resolved" : Math.floor(Math.random()*11)
      }
      
      store(obj);
    }
  }
  
  return;
}

function removeTestData() {
  var db = ScriptDb.getMyDb();
  var q = {'day': db.lessThan(20130414)}
  var qc = db.count(q);
  Logger.log(qc);
  if(qc) {
    var result = db.query(q);
    while (result.hasNext()) {
      db.remove(result.next());
    }
  }
}

function deleteAll() {
  var db = ScriptDb.getMyDb();
  while (true) {
    var result = db.query({}); // get everything, up to limit
    if (result.getSize() == 0) {
      break;
    }
    while (result.hasNext()) {
      db.remove(result.next());
    }
  }
}