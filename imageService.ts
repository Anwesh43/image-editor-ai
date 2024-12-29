import { createReadStream, writeFileSync } from "fs"
import { OpenAI } from 'openai'
import { Images } from "openai/resources"

class ImageService {
    openai: OpenAI
    constructor() {
        this.openai = new OpenAI()
    }
    saveImage(imageStr: string): string {
        const imageName = `img_${new Date().getTime()}.png`
        const buffer: Buffer = Buffer.from(imageStr, 'base64')
        writeFileSync(imageName, buffer)
        return imageName
    }

    async generateEdittedImage(imagePath: string, maskPath: string, prompt: string) {
        const imageResponse: OpenAI.Images.ImagesResponse = await this.openai.images.edit({
            model: 'dall-e-2',
            image: createReadStream(imagePath),
            mask: createReadStream(maskPath),
            n: 1,
            size: '1024x1024',
            prompt,
        })
        return {
            data: imageResponse.data[0].b64_json,
            created: imageResponse.created
        }
    }
}

export default new ImageService()