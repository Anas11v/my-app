const express = require('express');
const si = require('systeminformation');
const app = express();

const verifyKey = (req, res, next) => {
  const key = req.headers['x-server-key'];
  if (key !== process.env.SERVER_SECRET) return res.status(403).send('Forbidden');
  next();
};



app.get('/system/static', verifyKey, async (req,res)=> {
    
    const cpu = await si.cpu();
    const os = await si.osInfo();
    const mem = await si.memInfo();
    res.json({ cpu, os, mem })
    });

app.get('/system/stream', verifyKey, async (req,res) => {

    res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    });
    setInterval( async () => {
        try {
        const load = await si.currentLoad();
        const temp = await si.cpuTemperature();
        }
    }, 2000 )
    
});

app.listen(3000,()=>{
    console.log('app lising')
});
