import S3Provider from './services/s3Service';

import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';

const app = express();

// Serve the index.html file
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Screenshot endpoint
app.get('/screenshot', async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const screenshot = await page.screenshot();
        await browser.close();

        res.set('Content-Type', 'image/png');
        res.send(screenshot);
    } catch (error) {
        console.error('Error taking screenshot:', error);
        res.status(500).send('Failed to generate screenshot');
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'views')));

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    const s3Provider = new S3Provider()
    s3Provider.listBuckets()
});
