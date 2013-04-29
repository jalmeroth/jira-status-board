var jira_name = "example"; // your hosted instance-name e.g. https://example.jira.com
var assignees = ["username1", "username2"]; // array of usernames to query


function doGet(request) {

  switch(request.parameter.type) {
    case 'history':
      return ContentService.createTextOutput(JSON.stringify(buildHistoryJsonFromDb_()))
      .setMimeType(ContentService.MimeType.JSON);
    default:
      return ContentService.createTextOutput(JSON.stringify(buildCurrentJsonFromDb_()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
}

function getDataFromJira() {
  
  var date = new Date();
  var time = date.getTime().toString();
  var day = dateFormat(date, 'YYYYMMDD');
  
  var name = "", value1 = "", value2 = "";
  var obj = {};

  for(var i = 0; i < assignees.length; i++) {
    //Logger.log(assignees[i]);
    obj = {};
    name = assignees[i];
    
    value1 = query_("'assignee' = '"+name+"' and 'resolution' = 'unresolved'").total;
    
    value2 = query_("'assignee' = '"+name+"' and 'resolution' != 'unresolved' and 'resolutiondate' >= '-1d'").total;
    
    obj = {
      "time" : time,
      "day" : day,
      "name" : name,
      "open" : value1,
      "resolved" : value2
    }
    //  Logger.log(obj);
    
    store(obj);

  }
  
  return;
}

function query_(query_str) {  
  var base_url = "https://" + jira_name + ".jira.com/rest/api/latest/";
  var query = base_url + encodeURI("search?jql=" + query_str + "&maxResults=0&fields=*none");
  
  //Logger.log(query);

  var username = ScriptProperties.getProperty('username'); // "jalmeroth";
  var password = ScriptProperties.getProperty('password'); // "secret";
  
  var options = {
    "contentType" : "application/json",
    "headers" : {
      "Authorization" : ("Basic " + Utilities.base64Encode(username+":"+password))
    },
    "method" : "GET"
  };
  
  var output = "";
  
  try {
    var result = UrlFetchApp.fetch(query, options);
    output = Utilities.jsonParse(result.getContentText());
  } catch(e) {
    //
  }
  
  //Logger.log(result);
  return output;

}

function buildCurrentJsonFromDb_() {
  
  var date = new Date();
  var today = dateFormat(date, 'YYYYMMDD');
  
  var results = retrieve(today);
  var name = "";

  var result = {
    "graph" : {
      "title" : ("Ticket Counter " + date.getHours() + ":" + ((date.getMinutes()<10?'0':'') + date.getMinutes())),
      "total" : true,
      "type" : "bar",
      "datasequences" : [{
        "datapoints" : [],
        "color" : "red",
        "title" : "Open"
      },{
        "datapoints" : [],
        "color" : "green",
        "title" : "Resolved"
      }]
    }
  };

  for(var i = 0; i < assignees.length; i++) {
    name = assignees[i];
    result['graph']['datasequences'][0]['datapoints'][i] = {
      "title" : (name),
      "value" : (results[name][0]["open"])
    }
    result['graph']['datasequences'][1]['datapoints'][i] = {
      "title" : (name),
      "value" : (results[name][0]["resolved"])
    }
  }

  //Logger.log(Utilities.jsonStringify(result));
  
  return result;
  
}

function buildHistoryJsonFromDb_() {
  var date = new Date();
  var today = dateFormat(date, 'YYYYMMDD');
  var moment, moment_str, resolved, day;
  var results = [];
  
  var l = {};
  var o = {};
  
  var days = 6;
  var name = "";
  
  for(var i = 0; i <= days; i++) {
    moment = new Date(date.valueOf() - ((days-i)*1000*3600*24));
    moment_str = dateFormat(moment, 'YYYYMMDD');
    //Logger.log(moment_str);
    
    results[i] = retrieve(moment_str);
    
    for(var a = 0; a < assignees.length; a++) {
      name = assignees[a];
      
      day = (results[i][name] ? results[i][name][0]["day"]  : "YYYYMMDD");
      resolved = (results[i][name] ? results[i][name][0]["resolved"]  : 0);
      
      o = {
        "title": day,
        "value": resolved
      };
      
      l[name] = l[name] || [];
      l[name].push(o);

    }
  }

//  Logger.log(Utilities.jsonStringify(results));
//  Logger.log(Utilities.jsonStringify(l));

  var result = {
    "graph" : {
      "title" : ("Resolved Tickets History"),
      "total" : false,
      "type" : "line",
      "datasequences" : []
    }
  };


  var dp = {};
  
  for(var name in l) {

    dp = {
      "datapoints": l[name],
      "title": name
    };
    
    result.graph.datasequences.push(dp);
//    Logger.log(dp);
    
  }

  Logger.log(Utilities.jsonStringify(result));

  return result;
  
}
