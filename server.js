const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let cache = {
    indices: null,
    sectors: null,
    stocks: null,
    timestamp: 0
};

const CACHE_DURATION = 15000;

app.get('/api/indices', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.indices && now - cache.timestamp < CACHE_DURATION) {
            return res.json(cache.indices);
        }

        const response = await axios.get('https://hq.sinajs.cn/list=s_sh000001,s_sz399006,s_sh000688', {
            responseType: 'text'
        });

        const lines = response.data.split('\n');
        const results = {};
        
        lines.forEach(line => {
            if (line.startsWith('var hq_str_')) {
                const parts = line.split('=');
                const code = parts[0].replace('var hq_str_', '');
                const data = parts[1].replace(/"/g, '');
                results[code] = data;
            }
        });

        cache.indices = results;
        cache.timestamp = now;
        res.json(results);
    } catch (error) {
        console.error('Failed to fetch indices:', error.message);
        if (cache.indices) {
            res.json(cache.indices);
        } else {
            res.status(500).json({ error: 'Failed to fetch indices' });
        }
    }
});

app.get('/api/sectors', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.sectors && now - cache.timestamp < CACHE_DURATION) {
            return res.json(cache.sectors);
        }

        const [inflowRes, outflowRes] = await Promise.all([
            axios.get('https://push2.eastmoney.com/api/qt/clist/get', {
                params: {
                    pn: 1, pz: 5, po: 1, np: 1, fltt: 2, invt: 2,
                    ut: 'b2884a393a59ad64002292a3e90d46a5',
                    fid: 'f62', fs: 'm:90+t:3',
                    fields: 'f12,f14,f2,f3,f62'
                }
            }),
            axios.get('https://push2.eastmoney.com/api/qt/clist/get', {
                params: {
                    pn: 1, pz: 5, po: 0, np: 1, fltt: 2, invt: 2,
                    ut: 'b2884a393a59ad64002292a3e90d46a5',
                    fid: 'f62', fs: 'm:90+t:3',
                    fields: 'f12,f14,f2,f3,f62'
                }
            })
        ]);

        const result = {
            inflow: inflowRes.data,
            outflow: outflowRes.data
        };

        cache.sectors = result;
        cache.timestamp = now;
        res.json(result);
    } catch (error) {
        console.error('Failed to fetch sectors:', error.message);
        if (cache.sectors) {
            res.json(cache.sectors);
        } else {
            res.status(500).json({ error: 'Failed to fetch sectors' });
        }
    }
});

app.get('/api/stocks', async (req, res) => {
    try {
        const now = Date.now();
        if (cache.stocks && now - cache.timestamp < CACHE_DURATION) {
            return res.json(cache.stocks);
        }

        const [inflowRes, outflowRes] = await Promise.all([
            axios.get('https://push2.eastmoney.com/api/qt/clist/get', {
                params: {
                    pn: 1, pz: 10, po: 1, np: 1, fltt: 2, invt: 2,
                    ut: 'b2884a393a59ad64002292a3e90d46a5',
                    fid: 'f62',
                    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
                    fields: 'f12,f14,f2,f3,f62,f100'
                }
            }),
            axios.get('https://push2.eastmoney.com/api/qt/clist/get', {
                params: {
                    pn: 1, pz: 10, po: 0, np: 1, fltt: 2, invt: 2,
                    ut: 'b2884a393a59ad64002292a3e90d46a5',
                    fid: 'f62',
                    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048',
                    fields: 'f12,f14,f2,f3,f62,f100'
                }
            })
        ]);

        const result = {
            inflow: inflowRes.data,
            outflow: outflowRes.data
        };

        cache.stocks = result;
        cache.timestamp = now;
        res.json(result);
    } catch (error) {
        console.error('Failed to fetch stocks:', error.message);
        if (cache.stocks) {
            res.json(cache.stocks);
        } else {
            res.status(500).json({ error: 'Failed to fetch stocks' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});