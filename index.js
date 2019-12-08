const mdns = require('mdns');
const express = require('express');
const morgan = require('morgan');
const mqtt = require('mqtt');
const fs = require('fs');

const app = express();
const port = 3000;

const brokerHost = process.env.BROKER_HOST;
const userName = process.env.USERNAME;
const password = process.env.PASSWORD;

if (!brokerHost || !userName || !password) {
	console.log("need to set env vars")
	process.exit(0);
}

const caPath = path.join(__dirname, "ca-chain.pem");
const mqttOptions = {
	username: userName,
	password: password,
	ca: [fs.readFileSync(caPath)],
	servers:[
    {
      protocol: 'mqtts',
      host: brokerHost,
      port: 8883
    },
    {
      protocol: 'mqtt',
      host: brokerHost,
      port: 1883
    }
  ]
};

const mqttCient = mqtt.connect(mqttOptions)

app.use(morgan('combined'));
app.use(express.static('dist'));

// const ad = mdns.createAdvertisement(mdns.makeServiceType('1234','gh-node-red','tcp'), 1880,{
const ad = mdns.createAdvertisement(mdns.tcp('gh-node-red'), port, {
	txtRecord: {
		path: "/google-home/localControl/",
		id: 1234,
		port: port
	}
});
ad.start();

app.get('/google-home/localControl/:id/identify',(req,resp) => {
	console.log("identify - ", req.params.id);
	const devs = [
		{verificationId: "4"}
	];
	resp.send(devs);
});

app.post('/google-home/localControl/:id/execute', (req,resp) =>{
  console.log("execute - ", req.body);
  const status = {
  	id: "4",
  	state: {
  		online: true,
  		on: body.params
  	}
  }
  resp.status(200).send()
});


app.listen(port, () => {
	console.log('listening on 3000');
});