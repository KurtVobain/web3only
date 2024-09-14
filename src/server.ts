import { URL } from "url"

import * as dotenv from "dotenv"
import express, { Request, Response } from "express"
import sanitize from "sanitize-filename"
import puppeteer from "puppeteer"
import path from "path"

import S3Provider from "./services/s3Service"

dotenv.config()
const app = express()

// Serve the index.html file
app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "views", "index.html"))
})

// Screenshot endpoint
app.get("/screenshot", async (req: Request, res: Response) => {
    const url = req.query.url as string
    let parsedUrl: URL
    try {
        parsedUrl = new URL(url)
    } catch (error) {
        return res.status(400).send("Invalid URL format")
    }

    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: "networkidle2" })
        const screenshotBuffer = (await page.screenshot({
            type: "png",
        })) as Buffer
        await browser.close()

        const imageBucketname = process.env.SCW_IMAGE_BUCKET_NAME || ""
        const sanitizedPath = sanitize(parsedUrl.hostname)
        const imageName = `screenshots/${sanitizedPath}_${Date.now()}.png`

        const s3Provider = new S3Provider()
        const uploadResult = await s3Provider.uploadImageToBucket(
            imageBucketname,
            imageName,
            screenshotBuffer
        )
        console.log(uploadResult)

        res.set("Content-Type", "image/png")
        res.send(screenshotBuffer)
    } catch (error) {
        console.error("Error taking screenshot:", error)
        res.status(500).send("Failed to generate screenshot")
    }
})

// Serve static files
app.use(express.static(path.join(__dirname, "views")))

// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000")
    // const s3Provider = new S3Provider()
    // s3Provider.listBuckets()
})
