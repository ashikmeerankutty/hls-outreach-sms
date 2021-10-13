/* eslint-disable camelcase */

/*
 * --------------------------------------------------------------------------------------------------------------
 * main controller javascript used by index.html
 *
 * Note that initialize() MUST be executed at the end of index.html
 * --------------------------------------------------------------------------------------------------------------
 */



let phoneNumber;
const baseUrl = new URL(location.href);
baseUrl.pathname = baseUrl.pathname.replace(/\/index\.html$/, '');
delete baseUrl.hash;
delete baseUrl.search;
const fullUrl = baseUrl.href.substr(0, baseUrl.href.length - 1);

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

// --------------------------------------------------------------------------------
function readyToUse() {
  THIS = readyToUse.name + ' -';
  console.log(THIS);

  $('#ready-to-use').show();
}

/*
 * --------------------------------------------------------------------------------------------------------------
 * checks if selected flow name is already deployed
 *
 * references:
 *    #flow-selector
 * --------------------------------------------------------------------------------------------------------------
 */
async function checkStudioFlow() {
  const THIS = checkStudioFlow.name + ' -';
  console.log(THIS);

  const selectedFlowName = $('#flow-selector').val();
  console.log(THIS, 'selected flow: ', selectedFlowName);

  try {
    const response = await fetch('/deployment/check-studio-flow', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({flowName: selectedFlowName, token: accessToken}),
    });
    if (!response.ok) {
      throw Error(response.statusText);
    }
    const sid = await response.text();
    console.log(THIS, 'server returned:', sid);
    $('#flow-deploy .button').removeClass('loading');
    $('.flow-loader').hide();
    if (sid === 'NOT-DEPLOYED') {
      $('#flow-deploy').show();
    } else {
      $('#flow-deployed').show();
      $('#flow-deploy').hide();
      $('#flow-open').attr('href', `https://www.twilio.com/console/studio/flows/${sid}`);
    }
  } catch (err) {
    console.log(THIS, err);
  }
}

/*
 * --------------------------------------------------------------------------------------------------------------
 * deploy flow name
 *
 * references:
 *    #flow-selector
 * --------------------------------------------------------------------------------------------------------------
 */
async function deployStudioFlow(e) {
  const THIS = deployStudioFlow.name + ' -';
  console.log(THIS);

  const selectedFlowName = $('#flow-selector').val();
  console.log(THIS, 'selected flow: ', selectedFlowName);

  e.preventDefault();
  $('#flow-deploy .button').addClass('loading');
  $('.flow-loader.button-loader').show();

  try {
    const response = await fetch('/deployment/deploy-studio-flow', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({flowName: selectedFlowName, token: accessToken}),
    });
    if (!response.ok) {
      throw Error(response.statusText);
    }
    console.log(THIS, await response.text());

    checkStudioFlow();

  } catch (err) {
    console.log(THIS, err);
    $('#flow-deploy .button').removeClass('loading');
    $('.flow-loader.button-loader').hide();
  }
}


/*
 * --------------------------------------------------------------------------------------------------------------
 * select specified flowName and check Flow deployment
 *
 * references:
 *    #flow-selector
 * calls:
 *    checkStudioFlow()
 * --------------------------------------------------------------------------------------------------------------
 */
async function selectFlow() {
  const THIS = selectFlow.name + ' -';
  console.log(THIS);
  try {
    const selectedFlowName = $('#flow-selector').val();

    // reset section
    $('.flow-loader').hide();
    $('#flow-deploy').hide();
    $('#flow-deployed').hide();

    checkStudioFlow();

    const response = await fetch('/deployment/assign-phone2flow', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({flowName: selectedFlowName, token: accessToken}),
    });
    if (!response.ok) {
      throw Error(response.statusText);
    }
    console.log(THIS, await response.text());


  } catch (err) {
    console.log(THIS, err);
  }
}

/*
 * --------------------------------------------------------------------------------------------------------------
 * fill flowSelector from available flow template assets
 *
 * references:
 *    #flow-selector
 * calls:
 *    selectFlow()
 * --------------------------------------------------------------------------------------------------------------
 */
async function fillFlowSelector() {
  const THIS = fillFlowSelector.name + ' -';
  console.log(THIS);

  let firstFlowName = null;
  try {
    const response = await fetch('/deployment/list-studio-flow-templates', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({token:accessToken})
    });
    const flows = await response.json();
    for (f of flows) {
      console.log(THIS, 'found flow template:', f);
      $('#flow-selector').append(`<option value="${f}">${f}</option>`);
      if (!firstFlowName) firstFlowName = f;
    }
  } catch (err) {
    console.log(THIS, 'Error fetching flow names!!!');
  }

  console.log(THIS, 'firstFlowName:', firstFlowName);
  if (firstFlowName) selectFlow(); // force select event
}

/*
 * --------------------------------------------------------------------------------------------------------------
 * update selected file info
 * --------------------------------------------------------------------------------------------------------------
 */
let file = null;
function updateFileInfo() {
  const THIS = updateFileInfo.name + ' -';
  console.log(THIS);

  const fileList = this.files;
  if (!this.files.length) return;

  console.log("selected file count: " + fileList.length);
  file = fileList[0];
  document.getElementById("file-name").innerHTML = file.name;
  document.getElementById("file-size").innerHTML = '(' + file.size + ' bytes)';

  // const reader = new FileReader();
  // reader.readAsText(file);
  // reader.onload = function(event) {
  //   console.log('entering reader.onload');
  //   console.log(event.target);
  //   var csv = event.target.result;
  //   console.log(csv);
  //   const data = csv => csv.split(/\r?\n/);
  //   let i = 0;
  //   for (let row in data) {
  //     console.log(i++, row);
  //   }
  // };
  // reader.onerror = function() {
  //   alert('Unable to read ' + file.name);
  // }

  $('#process-file').prop('disabled', false);
};

/*
 * --------------------------------------------------------------------------------------------------------------
 * convert csv data to json string
 * --------------------------------------------------------------------------------------------------------------
 */
function csv2json(csv){
  const THIS = csv2json.name + ' -';
  console.log(THIS);

  const result = [];

  const lines = csv.split(/\r?\n/);
  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  const headers=lines[0].split(",");
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length === 0) continue; // skip empty row
    const obj = {};
    let currentline = lines[i].split(",");
    for(let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }
    result.push(obj);
  }
  //return result; //JavaScript object
  return JSON.stringify(result); //JSON
}

/*
 * --------------------------------------------------------------------------------------------------------------
 * process json
 * --------------------------------------------------------------------------------------------------------------
 */
async function processFile(e) {
  const THIS = processFile.name + ' -';
  console.log(THIS);
  console.log(THIS, 'file: ' + file.name);
  if (file.size == 0) return;

  const selectedFlowName = $('#flow-selector').val();

  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event) {
    console.log('entering reader.onload');
    const csv = event.target.result;
    console.log(csv);
    const data = csv.split(/\r?\n/);
    console.log(data);
    let i = 0;
    for (let row of data) {
      if (row.length === 0) continue; // skip empty rows
      console.log(i++ + ':' + row);
    }
    const jsonText = csv2json(csv);
    //console.log(jsonText);
    const jsonObj = JSON.parse(jsonText);
    //console.log(jsonObj);
    for (let j of jsonObj) {
      j.outreach_id = file.name;
      console.log(j);
      console.log(JSON.stringify({
        flowName: selectedFlowName,
        patient: j,
      }));
      fetch(`/execute-flow`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowName: selectedFlowName,
          patient: j,
          token: accessToken
        }),
      })
        .then((response) => response.text())
        .then((t) => {
          console.log(t);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  reader.onerror = function() {
    alert('Unable to read ' + file.name);
  }

  document.getElementById("process-file").disabled = true;
};

/*
 * --------------------------------------------------------------------------------------------------------------
 * download responses
 * --------------------------------------------------------------------------------------------------------------
 */
async function downloadResponses(e) {
  const THIS = downloadResponses.name + ' -';
  console.log(THIS);
  try {
    const selectedFlowName = $('#flow-selector').val();
    const orientation = 'ROW';
    let body = null;

    let response = await fetch(`/collect-responses-header`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flowName: selectedFlowName,
        orientation: orientation,
      }),
    });
    body = await response.text();

    response = await fetch(`/list-executions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flowName: selectedFlowName,
      }),
    });
    const execution_sids = JSON.parse(await response.text());

    let i = 0;
    for (esid of execution_sids) {
      response = await fetch(`/collect-responses-data`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowName: selectedFlowName,
          execution_sid: esid,
          orientation: orientation,
        }),
      });
      const row = await response.text();
      console.log('downloaded:', ++i);
      body += row;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = "data:application-octet-stream,"+encodeURIComponent(body);
    downloadLink.download = 'outreach-responses.csv';
    downloadLink.click();
    downloadLink.remove();

  } catch (err) {
    console.log(THIS, err);
  }
}


/*
 * --------------------------------------------------------------------------------------------------------------
 * initialize client javascript objects/triggers
 * --------------------------------------------------------------------------------------------------------------
 */
async function initialize() {
  fillFlowSelector();

  const inputElement = document.getElementById('patient-file');
  const fileSelect = document.getElementById('select-file');
  fileSelect.addEventListener("click", function(e) {
    if (inputElement) {
        inputElement.click();
    }
    e.preventDefault(); // prevent navigation to "#"
  }, false);
  inputElement.addEventListener("change", updateFileInfo, false);
  // eventListener must be placed AFTER addEventListener
  document.getElementById("process-file").addEventListener("click", processFile);

  const downloadButton = document.getElementById('downloadResponses');
  downloadButton.addEventListener("click", downloadResponses);
}