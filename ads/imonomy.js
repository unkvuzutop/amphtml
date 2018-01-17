/**
 * Copyright 2016 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {writeScript, loadScript} from '../3p/3p';
import {doubleclick} from '../ads/google/doubleclick';

const DEFAULT_TIMEOUT = 500; // ms
const EVENT_SUCCESS = 0;
const EVENT_TIMEOUT = 1;
const EVENT_ERROR = 2;
const EVENT_BADTAG = 3;

/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function imonomy(global, data) {
  if (!('slot' in data)) {
    global.CasaleArgs = data;
    writeScript(global, '//srv.imonmy.com/indexJTag.js');
  } else { //DFP ad request call

    const start = Date.now();
    let calledDoubleclick = false;
    data.ixTimeout = isNaN(data.ixTimeout) ? DEFAULT_TIMEOUT : data.ixTimeout;
    const timer = setTimeout(() => {
      callDoubleclick(EVENT_TIMEOUT);
    }, data.ixTimeout);

    const callDoubleclick = function(code) {
      if (calledDoubleclick) { return; }
      calledDoubleclick = true;
      clearTimeout(timer);
      reportStats(data.ixid, data.ixslot, data.slot, start, code);
      prepareData(data);
      doubleclick(global, data);
    };

    if (typeof data.ixid === 'undefined' || isNaN(data.ixid)) {
      callDoubleclick(EVENT_BADTAG);
      return;
    }

    global.IndexArgs = {
      ampCallback: callDoubleclick,
      ampSuccess: EVENT_SUCCESS,
      ampError: EVENT_ERROR,
    };

    loadScript(global, '//srv.imonomy.com/amp/amp.js', undefined, () => {
      callDoubleclick(EVENT_ERROR);
    });
  }
}

function prepareData(data) {
  for (const attr in data) {
    if (data.hasOwnProperty(attr) && /^ix[A-Z]/.test(attr)) {
      delete data[attr];
    }
  }
  data.targeting = data.targeting || {};
  data.targeting['IX_AMP'] = '1';
}

function reportStats(siteID, slotID, dfpSlot, start, code) {
  reportUrl();
  try {
    if (code == EVENT_BADTAG) { return; }
    const xhttp = new XMLHttpRequest();
    xhttp.withCredentials = true;

    // const deltat = Date.now() - start;
    // const ts = start / 1000 >> 0;
    // const ets = Date.now() / 1000 >> 0;
    // let url = '//srv.imonomy.com/internal/reporter?s=' + siteID;
    // if (typeof window.context.location.href !== 'undefined') {
    //   url += '&u=' + encodeURIComponent(window.context.location.href);
    // }
    // let stats = '{"p":"display","d":"mobile","t":' + ts + ',';
    // stats += '"sl":[{"s": "' + slotID + '",';
    // stats += '"t":' + ets + ',';
    // stats += '"e": [{';
    // if (code == EVENT_SUCCESS) {
    //   stats += '"n":"amp-s",';
    // } else if (code == EVENT_TIMEOUT) {
    //   stats += '"n":"amp-t",';
    // } else {
    //   stats += '"n":"amp-e",';
    // }
    // stats += '"v":"' + deltat + '",';
    // stats += '"b": "INDX","x": "' + dfpSlot.substring(0,64) + '"}]}]}';

    xhttp.open('GET', reportUrl(), true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send();
  } catch (e) {};
}

//publisher Id from data  (long int)
// 9999
function reportUrl() {
  const subId = '',
      unitFormat = '',
      trackId = '1',
      pageLocation = escape(document.location),
      notFirst = true,
      cid = '1',
      abLabel = '',
      rand = Math.random();
  const uid = '',
      isLocked = false,
      isTrackable = false,
      isClient = false,
      tier = null;
  const baseUrl = '//srv.imonomy.com/internal/reporter';
  let unitCodeUrl = `${baseUrl}?v=2&subid=${subId}&format=${unitFormat}&ai=`;
  unitCodeUrl = unitCodeUrl + `${trackId}&ctxu=${pageLocation}&fb=${notFirst}&`;
  unitCodeUrl = unitCodeUrl + `cid=${cid} &ab=${abLabel}&cbs=${rand}`;
  if (uid) {
    unitCodeUrl = unitCodeUrl + `&uid=${uid}`;
  }
  if (isLocked) {
    unitCodeUrl = unitCodeUrl + `&is_locked=${isLocked}`;
  }
  if (isTrackable) {
    unitCodeUrl = unitCodeUrl + `&istrk=${isTrackable}`;
  }
  if (isClient) {
    unitCodeUrl = unitCodeUrl + `&is_client=${isClient}`;
    if (tier) {
      unitCodeUrl = unitCodeUrl + `&tier=${tier}`;
    }
  }
  	return unitCodeUrl;
}
