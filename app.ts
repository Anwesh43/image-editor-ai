import { config } from "dotenv";
import express, { Express } from 'express'
import { getInstance } from './imageService'
import bodyParser from 'body-parser'
import path from 'path'

config()

console.log(process.env)
const app: Express = express()

const imageService = getInstance()

app.use(bodyParser.json({ limit: '50mb' }))

app.use(express.static(path.join(__dirname, 'public')))

app.post("/saveImage", (req: express.Request, res: express.Response) => {
    const imageData: string = req.body['imageData']
    try {
        const fileName = imageService.saveImage(imageData.split(",")[1])
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
        console.log("STARTING_TO_GENERATE_IMAGE")
        const response = await imageService.generateEdittedImage(imagePath, maskPath, prompt)
        console.log("RESPONSE", response.data)
        res.status(200).json({
            ...response
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            status: "error"
        })

    }
})

app.listen(process.env.port || '5000', () => {
    console.log("started the server")
})