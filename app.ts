import { config } from "dotenv";
import express, { Express } from 'express'
import imageService from './imageService'
import bodyParser from 'body-parser'
import path from 'path'
config()

const app: Express = express()


app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')))

app.post("/saveImage", (req: express.Request, res: express.Response) => {
    const imageData: string = req.body['imageData']
    try {
        const fileName = imageService.saveImage(imageData)
        res.status(200).json({
            status: 'success',
            fileName,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            status: 'error'
        })
    }
})

app.post('/editImage', async (req: express.Request, res: express.Response) => {
    const imagePath = req.body['imagePath']
    const maskPath = req.body['maskPath']
    const prompt = req.body["prompt"]
    try {
        const response = await imageService.generateEdittedImage(imagePath, maskPath, prompt)
        console.log("RESPONSE", response.data)
        res.status(200).json({
            ...response
        })
    } catch (error) {
        console.error(error)

    }
})

app.listen(process.env.port || '5000', () => {
    console.log("started the server")
})