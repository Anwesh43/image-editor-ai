import { createReadStream, Stats, statSync, writeFileSync } from "fs"
import { OpenAI } from 'openai'
import { Images } from "openai/resources"

const getFileSize = (imagePath: string) => {
    const fileData: Stats = statSync(imagePath)
    console.log(imagePath, fileData.size / (1024 * 1024))
}
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
        getFileSize(imagePath)
        getFileSize(maskPath)
        const params: OpenAI.Images.ImageEditParams = {
            model: 'dall-e-2',
            image: createReadStream(imagePath),
            mask: createReadStream(maskPath),
            n: 1,
            size: '512x512',
            prompt,
        };
        const imageResponse: OpenAI.Images.ImagesResponse = await this.openai.images.edit(params)
        console.log("IMAGE_RESPONSE", imageResponse)
        return {
            data: imageResponse.data[0].url,
            created: imageResponse.created
        }
    }
}

export const getInstance: () => ImageService = (): ImageService => {
    return new ImageService()
}

