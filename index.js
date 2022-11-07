const path = require("path")
const express = require('express');
const bodyParser = require("body-parser");
const EventEmitter = require('events');
const impressionsEmitter = new EventEmitter();


const app = express()
const port = 3000

function epochToHuman(ms) {
    let myDate = new Date(parseInt(ms, 10));
    let dateStr = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate() + " " + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + " UTC"
    return dateStr
}


function StatTotaller() {
    let impressions = {}
    // each impression object is computed and reduced to have the following info
    /*splitName: { 
        
        environmentName: {
            treatment: {
                count:total Number of impressions
                distinctKeyList: list distinct keys
                mostRecent: timestamp of most recent evaluation in an SDK
            }
        }
    }*/
    this.addImpression = function(incoming) {
        let splitName = incoming.split;
        let key = incoming.key;
        let time = incoming.time;
        let treatment = incoming.treatment;
        let env = incoming.environmentName;

        if(!(splitName in impressions)) {
            impressions[splitName] = {}
        }
        if (!(env in impressions[splitName])) {
            impressions[splitName][env] = {}
        }
        if(!(treatment in impressions[splitName][env])) {
            impressions[splitName][env][treatment] = {count: 0, distinctKeyList: [], mostRecent: 0}
        }
        impressions[splitName][env][treatment].count += 1;
        if(impressions[splitName][env][treatment].mostRecent < time) {
            impressions[splitName][env][treatment].mostRecent = time;
        }
        if(!(impressions[splitName][env][treatment].distinctKeyList.includes(key))) {
            impressions[splitName][env][treatment].distinctKeyList.push(key);
        }
        impressionsEmitter.emit('impressionAdded')
    }
    let listSplits = function () {
        return Object.keys(impressions);
    }
    let getSplit = function (splitName) {
        return impressions[splitName];
    }
    this.dumpAllImpressions = function () {
        return impressions
    }

    this.buildImpressionsHTML = function() {
        let listOfSplits = listSplits();
        let htmlString = ''
        if(listOfSplits.length != 0) {
            for(let splitIdx = 0; splitIdx < listOfSplits.length; splitIdx += 1) {
                let splitName = listOfSplits[splitIdx]
                let splitData = getSplit(splitName)
                htmlString += `<table border="1" cellpadding="10" cellspacing="1" class='styled-table'><thead><tr><th colspan="3" scope="col">${splitName}</th></tr></thead><tbody>`
                for (let envIdx = 0; envIdx < Object.keys(splitData).length; envIdx += 1) {
                    let environmentName = Object.keys(splitData)[envIdx];
                    let environment = splitData[environmentName];
                    for (let treatmentIdx = 0; treatmentIdx < Object.keys(environment).length; treatmentIdx += 1) {
                        let treatmentName = Object.keys(environment)[treatmentIdx];
                        let treatment = environment[treatmentName];
                        htmlString += `<tr><td>${environmentName}</td><td>${treatmentName}</td><td><ul><li>ImpressionsCount: ${treatment.count} </li><li>distinctKeyCount: ${treatment.distinctKeyList.length} </li><li>mostRecentHit: ${epochToHuman(treatment.mostRecent)} </li></ul></td></tr>`
                    }
                }
                htmlString += `</tbody></table>`
            }
        }

        return htmlString;
    }
}

let totals = new StatTotaller();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => {
     res.render('page')
})

app.get("/impressionsStream", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // flush the headers to establish SSE with client
    const interval = 60000; // every minute
    let intervalId = setInterval(function() {
      res.write(`:\n\n`);
    }, interval);
    impressionsEmitter.on('impressionAdded',  () => {
        res.write(`data: ${totals.buildImpressionsHTML()}\n\n`)
    }); 

    res.on("close", () => {
        console.log("client dropped");
        res.end();
      });
})


app.post("/impression", function (req, res) {
    const impressions = req.body;
    for (let index = 0; index < impressions.length; index++) {
        totals.addImpression(impressions[index]);
    }
    res.sendStatus(200);
  });

app.listen(port, () => {
  console.log(`Example Dashboard App listening on port ${port}`)
})