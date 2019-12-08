
/// <reference types="@google/local-home-sdk" />

export class NodeRedApp {

  private ports: object = {};
  private paths: object = {};
  private proxyDeviceID: string = "";

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
      //console.log(device.mdnsScanData);

      return new Promise((resolve, reject) => {
        const response: smarthome.IntentFlow.IdentifyResponse = {
         intent: smarthome.Intents.IDENTIFY,
           requestId: identifyRequest.requestId,
           payload: {
             device: {
               id: "gh-node-red",
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

        const proxyDevice = reachableRequest.inputs[0].payload.device.proxyDevice;
        this.proxyDeviceID = proxyDevice.id;


        const lookUpDevices = new smarthome.DataFlow.HttpRequestData();
        lookUpDevices.requestId = reachableRequest.requestId;
        lookUpDevices.deviceId = proxyDevice.id;
        lookUpDevices.path = "/google-home/localControl/1234/identify";
        // this port number should come from the mDNS lookup
        lookUpDevices.port = 3000;
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
           const executeHttpRequest = new smarthome.DataFlow.HttpRequestData();
           executeHttpRequest.requestId = executeRequest.requestId;
           executeHttpRequest.deviceId = this.proxyDeviceID;
           executeHttpRequest.method = smarthome.Constants.HttpOperation.POST;
           executeHttpRequest.port = 3000;
           executeHttpRequest.isSecure = false;
           executeHttpRequest.path = "/google-home/localControl/1234/execute"
           executeHttpRequest.data = JSON.stringify(execution);
           executeHttpRequest.dataType = "application/json"

           this.app.getDeviceManager()
           .send(executeHttpRequest)
           .then( result => {
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