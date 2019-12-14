
/// <reference types="@google/local-home-sdk" />

export class NodeRedApp {

  private port: number = 1880;
  private path: string = "/google-home/localControl/";
  private proxyDeviceID: string = "gh-node-red";

  constructor(private readonly app: smarthome.App) {
    this.app = app;
  }
  
  public identifyHandler = async (identifyRequest: smarthome.IntentFlow.IdentifyRequest):
    Promise<smarthome.IntentFlow.IdentifyResponse> => {
      console.log("idenityHandler",JSON.stringify(identifyRequest, null, 2));
    

      const device = identifyRequest.inputs[0].payload.device;
      //console.log(device);
      if (device.mdnsScanData === undefined) {
        throw Error(`indenty request is missing discovery response ${identifyRequest}`);
      }
      console.log(device.mdnsScanData);

      this.path = device.mdnsScanData.txt.path;
      this.port = parseInt(device.mdnsScanData.txt.port);


      return new Promise((resolve, reject) => {
        const response: smarthome.IntentFlow.IdentifyResponse = {
         intent: smarthome.Intents.IDENTIFY,
           requestId: identifyRequest.requestId,
           payload: {
             device: {
               id: this.proxyDeviceID,
               isProxy: true,
               isLocalOnly: true
             }
           }
        }
      console.log("identifyHAndler response", JSON.stringify(response, null, 2));
      resolve(response);
    });
  }

  public reachableDevicesHandler = async (reachableRequest: smarthome.IntentFlow.ReachableDevicesRequest):
    Promise<smarthome.IntentFlow.ReachableDevicesResponse> => {
      
      // return new Promise((resolve, reject) => {
        console.log("reachableDeviceHandler", JSON.stringify(reachableRequest, null, 2));

        const proxyDevice = reachableRequest.inputs[0].payload.device.id;
        //this.proxyDeviceID = proxyDevice.id;


        const lookUpDevices = new smarthome.DataFlow.HttpRequestData();
        lookUpDevices.requestId = reachableRequest.requestId;
        lookUpDevices.deviceId = this.proxyDeviceID;
        lookUpDevices.path = this.path;  //"/google-home/localControl/1234/identify";
        lookUpDevices.port = this.port;
        lookUpDevices.isSecure = false;
        lookUpDevices.method = smarthome.Constants.HttpOperation.GET;

        return new Promise((resolve, reject) => {
          this.app.getDeviceManager()
          .send(lookUpDevices)
          .then(result => {
            const httpResults = <smarthome.DataFlow.HttpResponseData>result; 
            //console.log(httpResults.httpResponse.body);

            const response: smarthome.IntentFlow.ReachableDevicesResponse = {
              intent: smarthome.Intents.REACHABLE_DEVICES,
              requestId: reachableRequest.requestId,
              payload: {
                devices: <Array<any>> JSON.parse(httpResults.httpResponse.body as string),
              },
            };
            console.log("reachableDeviceHandler Results",JSON.stringify(response, null, 2));
            resolve(response);
          });
        })
    }

  public executeHandler = async (executeRequest: smarthome.IntentFlow.ExecuteRequest):
       Promise<smarthome.IntentFlow.ExecuteResponse> => {
        console.log("executeHandler",  JSON.stringify(executeRequest, null, 2));

        const command = executeRequest.inputs[0].payload.commands[0];
        const id = command.devices[0].id;
        const execution = command.execution[0];

        const executeResponse =  new smarthome.Execute.Response.Builder()
          .setRequestId(executeRequest.requestId);

        return new Promise((resolve, reject) => {

          console.log("Sending command to " + this.proxyDeviceID + " on port " + this.port);
          console.log("and path " + this.path + id + "/execute");
          console.log(JSON.stringify(execution));

          const executeHttpRequest = new smarthome.DataFlow.HttpRequestData();
          executeHttpRequest.requestId = executeRequest.requestId;
          executeHttpRequest.deviceId = id;//this.proxyDeviceID;
          executeHttpRequest.method = smarthome.Constants.HttpOperation.POST;
          executeHttpRequest.port = this.port;
          executeHttpRequest.isSecure = false;
          executeHttpRequest.path = this.path  + id + "/execute";
          executeHttpRequest.data = JSON.stringify(execution);
          executeHttpRequest.dataType = "application/json";

          console.log(executeRequest);

          this.app.getDeviceManager()
            .send(executeHttpRequest)
            .then( result => {
              console.log("excuteHandler http response");
              const httpResults = result as smarthome.DataFlow.HttpResponseData;
              if (httpResults.httpResponse.statusCode == 200) {
                 executeResponse.setSuccessState(id,{on: true});
              } else {
                executeResponse.setErrorState(id,"problem");
              }
              resolve(executeResponse.build());
           })

      });
    }
}