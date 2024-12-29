




class ImagePathStore {

    originalImage: string
    maskedImage: string

    setOriginalImage(image: string) {
        this.originalImage = image
    }

    setMaskedImage(image: string) {
        this.maskedImage = image
    }
}

const imagePathStore = new ImagePathStore()

class ImageServiceClient {

    async saveImage(imageData: string) {
        return fetch('http://localhost:5000/saveImage', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                imageData
            })
        }).then((res) => res.json())
    }

    async editImage(prompt: string) {
        console.log("REQ", {
            prompt,
            imagePath: imagePathStore.originalImage,
            maskPath: imagePathStore.maskedImage
        })
        return fetch('http://localhost:5000/editImage', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                imagePath: imagePathStore.originalImage,
                maskPath: imagePathStore.maskedImage
            })
        }).then((res) => res.json())
    }
}
const imageServiceClient = new ImageServiceClient()

const getById = (id: string) => document.getElementById(id)

interface HTMLCustomFileInput extends HTMLInputElement {
    files: FileList
}
const handleFileReader = (cb: (data: string | ArrayBuffer | null) => void) => {
    const fileInput = getById('fileinput') as HTMLInputElement
    fileInput.onchange = (e) => {
        const inputEvent = e as InputEvent
        const target = inputEvent.target as HTMLCustomFileInput
        // if (inputEvent.type === 'file') {

        // }
        const fileReader = new FileReader()
        fileReader.readAsDataURL(target.files[0])
        fileReader.onloadend = () => {
            console.log("FR", fileReader.result)
            cb(fileReader.result)
        }
        console.log(target.files)
    }
}

class Point {
    constructor(public x: number, public y: number) {

    }
}
class MaskPath {

    points: Point[] = []
    started: boolean = false

    start(point: Point) {
        if (!this.started) {
            this.points = []
            this.started = true
            this.addPoint(point)
        }
    }
    addPoint(point: Point) {
        if (this.started) {
            this.points.push(point)
        }
    }

    end(point: Point) {
        if (this.started) {
            this.addPoint(point)
            this.started = false
        }
    }

    reset() {
        this.points = []
        this.started = false
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.points.length === 0) {
            return
        }
        if (this.started) {
            context.fillStyle = '#000000'
            context.beginPath()
            this.points.forEach((point: Point, i: number) => {
                if (i === 0) {
                    context.moveTo(point.x, point.y)
                } else {
                    context.lineTo(point.x, point.y)
                }
            })
            context.stroke()
        } else {
            let minX: number = 513, maxX: number = 0, minY: number = 513, maxY: number = 0
            this.points.forEach(({ x, y }) => {
                minX = Math.min(x, minX)
                minY = Math.min(y, minY)
                maxX = Math.max(x, maxX)
                maxY = Math.max(y, maxY)
            })
            console.log(minX + "," + maxX + ", " + minY + " ," + maxY)
            for (let i = minX; i <= maxX; i++) {
                for (let j = minY; j <= maxY; j++) {
                    context.clearRect(i, j, 1, 1)
                }
            }
        }
    }

    createMask(context: CanvasRenderingContext2D, w: number, h: number) {
        if (this.started) {
            return
        }


        for (let point of this.points) {

            const imageData: ImageData = context.getImageData(point.x, point.y, 1, 1)

            imageData.data[0] = 0;
            imageData.data[1] = 0;
            imageData.data[2] = 0;
            imageData.data[3] = 255;
            console.log("PIXELS", imageData.data)
            context.fillStyle = '#000000'
            context.fillRect(point.x, point.y, 1, 1)
        }

    }

}

class InputCanvasHandler {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D | null
    image: CanvasImageSource
    maskPath: MaskPath = new MaskPath()
    imageLoaded = false

    constructor(id: string) {
        this.canvas = getById(id) as HTMLCanvasElement
        this.context = this.canvas.getContext('2d')
        this.handleMouseEvents()
    }

    setImage(imageStr: string) {
        this.image = new Image(this.canvas.width, this.canvas.height)
        this.image.src = imageStr
        this.image.onload = () => {
            this.imageLoaded = true
            this.maskPath.reset()
            this.draw()
            imageServiceClient.saveImage(this.canvas.toDataURL('image/png', 0.3)).then((data) => {
                console.log(data)
                console.log(data.fileName)
                imagePathStore.setOriginalImage(data.fileName)
            })
        }
    }

    draw() {
        if (this.context && this.imageLoaded) {
            //console.log("Coming here", this.image)
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height)
            this.maskPath.draw(this.context)
        }
    }

    handleMouseEvents() {
        this.canvas.onmousedown = (e: MouseEvent) => {
            if (this.imageLoaded) {
                this.maskPath.start(new Point(e.offsetX, e.offsetY))
                this.draw()
            }
        }

        this.canvas.onmousemove = (e: MouseEvent) => {
            if (this.imageLoaded) {
                this.maskPath.addPoint(new Point(e.offsetX, e.offsetY))
                this.draw()
            }
        }

        this.canvas.onmouseup = (e: MouseEvent) => {
            if (this.imageLoaded) {
                this.maskPath.end(new Point(e.offsetX, e.offsetY))
                this.draw()
                if (this.context) {
                    //this.maskPath.createMask(this.context, this.canvas.width, this.canvas.height)

                    imageServiceClient.saveImage(this.canvas.toDataURL('image/png', 0.3)).then((data) => {
                        console.log(data)
                        console.log(data.fileName)
                        imagePathStore.setMaskedImage(data.fileName)
                    })
                    console.log("NEW_PIXEL", this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data)
                }


            }
        }
    }

    getMaskedImage(): string {
        return this.canvas.toDataURL()
    }
}

const inputCanvasHandler = new InputCanvasHandler('inputImage')

handleFileReader((data: string | ArrayBuffer | null) => {
    if (data && typeof data === 'string') {
        console.log("Setting image")
        inputCanvasHandler.setImage(data)

        // imageServiceClient.saveImage(data).then((data) => {
        //     console.log(data)
        //     console.log(data.fileName)
        //     imagePathStore.setOriginalImage(data.fileName)
        // })
    }
})

const handlePromptSubmission = () => {
    const promptArea = getById('promptArea') as HTMLTextAreaElement
    const btn = getById('submit')
    if (btn) {
        btn.onclick = async () => {
            if (!promptArea.value) {
                alert("Please Enter a Prompt")
                return
            }
            imageServiceClient.editImage(promptArea.value).then((response) => {
                const data = response.data
                inputCanvasHandler.setImage(data)
                const outputImg = getById('outputImage') as HTMLImageElement
                // outputImg.src = data
                // outputImg.onload = () => {
                //     alert('Finished generating new image')
                // }
            })
        }
    }
}

handlePromptSubmission()