const mdns = require('mdns');
const express = require('express');
const morgan = require('morgan');

const app = express();
const port = 3000;

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
  resp.status(200).send()
});


app.listen(port, () => {
	console.log('listening on 3000');
});