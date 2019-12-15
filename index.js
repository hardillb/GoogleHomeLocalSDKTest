const mdns = require('mdns');
const express = require('express');
const bodyParser = require('body-parser')
const morgan = require('morgan');
const mqtt = require('mqtt');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(express.static('dist'));

const ad = mdns.createAdvertisement(mdns.tcp('gh-lc'), port, {
	txtRecord: {
		path: "/google-home/localControl/",
		id: 1234,
		port: port
	}
});
ad.start();

app.get('/google-home/localControl/:id/identify',(req,resp) => {
  console.log("identify");
  console.log(req.params.id);
	const devs = [
		{verificationId: "4"}
	];
  console.log(devs);
	resp.send(devs);
});

app.post('/google-home/localControl/:conf/execute/:id', (req,resp) =>{
  console.log("body - ", req.body);
  console.log("conf - ", req.params.conf);
  console.log("device id - " + req.params.id);

  req.body.execution.params.online = true;

  var status = {
  	id: "" + req.params.id,
  	state: req.body.execution.params
  }
  resp.status(200).send(status);
});


app.listen(port, () => {
	console.log('listening on 3000');
});