const express = require('express');
const si = require('systeminformation');
const app = express();

//const verifyKey = (req, res, next) => {
//  const key = req.headers['x-server-key'];
//  if (key !== process.env.SERVER_SECRET) return res.status(403).send('Forbidden');
//  next();
//};



// ... inside app.get('/system/stream') ...

    const intervalId = setInterval(async () => {
        try {
            // 1. Fetch the raw data
            const [load, temp, mem] = await Promise.all([
                si.currentLoad(),
                si.cpuTemperature(),
                si.mem()
            ]);

            // 2. Create a CLEAN object (The "ViewModel")
            const cleanData = {
                cpu: Math.round(load.currentLoad),      // 23
                temp: Math.round(temp.main),            // 25
                ram: Math.round(mem.active / 1024 / 1024 / 1024), // GB used
                timestamp: Date.now()
            };

            // 3. Send only the clean string
            res.write(`data: ${JSON.stringify(cleanData)}\n\n`);

        } catch (err) {
            console.error(err);
            // Don't crash the stream on one bad read
        }
    }, 2000);

app.get('/system/stream', async (req,res) => {

    res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    });
    setInterval( async () => {
        try {
        const load = await si.currentLoad();
        const temp = await si.cpuTemperature();
        const dataObject = { load, temp };
        const jsonString = JSON.stringify(dataObject);
        const sseMessage = 'data: ' + jsonString + '\n\n'
        res.write(sseMessage)
        }catch (error) {
            // FIX 2: Do not use res.status() here, headers are already sent. 
            // Just end the stream or send a data error.
            res.end(); 
            clearInterval(intervalId);
        }
    }, 2000 )

    req.on('close', () => {
    clearInterval(intervalId);
    console.log('Client disconnected, stopping loop.');
    });
});

app.listen(3000,()=>{
    console.log('app listing')
});
