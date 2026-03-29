const express = require('express');
const si = require('systeminformation');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

//const verifyKey = (req, res, next) => {
//  const key = req.headers['x-server-key'];
//  if (key !== process.env.SERVER_SECRET) return res.status(403).send('Forbidden');
//  next();
//};

// 1. STATIC ROUTE (Run once on load)
// Keeps the same 'res.json' logic we had before.
app.get('/system/static', async (req, res) => {
    try {
        // We only want hardware info here, not live stats
        const cpu = await si.cpu();
        const os = await si.osInfo();
        const mem = await si.mem();
        
        // Send as standard JSON (not a stream)
        res.json({ 
            cpuBrand: cpu.brand,
            osDistro: os.distro,
            totalRamGb: Math.round(mem.total / 1024 / 1024 / 1024)
        });
    } catch (err) {
        res.status(500).send(err.message);
    }finally{
        console.log('Static sent')
    }
});

// 2. STREAM ROUTE (Runs every 2 seconds)
app.get('/system/stream', async (req, res) => {
    // A. Setup Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // B. Start the Interval and capture the ID
    const intervalId = setInterval(async () => {
        try {
            // Fetch live data
            const [load, temp, mem] = await Promise.all([
                si.currentLoad(),
                si.cpuTemperature(),
                si.mem()
            ]);

            // Your Clean Data Logic (Moved here!)
            const cleanData = {
                cpu: Math.round(load.currentLoad),
                temp: Math.round(temp.main) || -1,
                ram: Math.round(mem.active / 1024 / 1024 / 1024),
                timestamp: Date.now()
            };

            // Write to stream
            res.write(`data: ${JSON.stringify(cleanData)}\n\n`);

        } catch (error) {
            console.error(error);
            // If reading fails, just kill the stream
            clearInterval(intervalId);
            res.end(); 
        }
    }, 2000);

    // C. Cleanup on disconnect
    req.on('close', () => {
        clearInterval(intervalId); // Now this variable actually exists!
        console.log('Client disconnected, stopping loop.');
    });
});
app.listen(3000,()=>{
    console.log('app listing')
});

