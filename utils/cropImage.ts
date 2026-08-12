export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));

    image.setAttribute("crossOrigin", "anonymous");
    image.src = imageUrl;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotationInRadians = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotationInRadians) * width) +
      Math.abs(Math.sin(rotationInRadians) * height),

    height:
      Math.abs(Math.sin(rotationInRadians) * width) +
      Math.abs(Math.cos(rotationInRadians) * height),
  };
}

export async function getCroppedImage(
  imageUrl: string,
  pixelCrop: PixelCrop,
  rotation = 0
): Promise<File> {
  const image = await createImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas create nahi hua");
  }

  const rotatedSize = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = rotatedSize.width;
  canvas.height = rotatedSize.height;

  context.translate(
    rotatedSize.width / 2,
    rotatedSize.height / 2
  );

  context.rotate(getRadianAngle(rotation));

  context.translate(
    -image.width / 2,
    -image.height / 2
  );

  context.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedContext = croppedCanvas.getContext("2d");

  if (!croppedContext) {
    throw new Error("Crop canvas create nahi hua");
  }

  const outputSize = 1000;

  croppedCanvas.width = outputSize;
  croppedCanvas.height = outputSize;

  croppedContext.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Cropped image create nahi hui"));
          return;
        }

        const croppedFile = new File(
          [blob],
          `product-${Date.now()}.webp`,
          {
            type: "image/webp",
          }
        );

        resolve(croppedFile);
      },
      "image/webp",
      0.88
    );
  });
}