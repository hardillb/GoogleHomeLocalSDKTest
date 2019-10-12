/// <reference types="@google/local-home-sdk" />

import {NodeRedApp} from "./app";

const smarthomeApp: smarthome.App = new smarthome.App("0.0.1");
const homeApp = new NodeRedApp(smarthomeApp);

const createResponse = (
  request: smarthome.IntentRequest,
  payload: smarthome.IntentResponse["payload"]
): any => ({
  intent: request.inputs[0].intent,
  requestId: request.requestId,
  payload
});


smarthomeApp
  .onExecute(homeApp.executeHandler)
  .onIdentify(homeApp.identifyHandler)
  .onReachableDevices(homeApp.reachableDevicesHandler)
  // @ts-ignore
  .onProxySelected(req => {
    console.log("ProxySelected", JSON.stringify(req, null, 2));
    return createResponse(req, {} as any);
  })
  .listen()
  .then(() => {
    console.log("Up and Running")
  });