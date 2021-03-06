import Jimp from "jimp";
import { within, logIfDebug } from "../util";

// includes white
function isRedditGrey({ r, g, b, a }) {
  return r >= 36 && within(r - g, 5) && within(r - b, 5) && a == 255;
}

function isRedditBrandOrange({ r, g, b, a }) {
  return r == 255 && g == 69 && b == 0 && a == 255;
}

function isRedditWatermark(image: Jimp, watermarkHeight: number): boolean {
  const imageWidth = image.getWidth();
  const imageHeight = image.getHeight();

  if (imageHeight < watermarkHeight) {
    return false;
  }

  const jpegPadding = 3;
  const watermarkTop = imageHeight - watermarkHeight + jpegPadding;
  const logoStart = Math.floor(imageWidth * 0.75);
  const logoEnd = imageWidth;

  let containsBrandColor = false; // this is to make sure we dont crop images with solid bars
  let error = 0;

  for (let y = watermarkTop; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));

      const inLogo = x >= logoStart && x < logoEnd;
      const isGrey = isRedditGrey(color);

      if (!inLogo && !isGrey) {
        console.log("failed reddit test on:", x, y, color);
        return false;
      }

      if (inLogo) {
        if (isRedditBrandOrange(color)) {
          containsBrandColor = true;
        } else if (!isGrey) {
          logIfDebug("accumulated error from:", x, y, color);
          error++;
        }
      }
    }
  }

  // expect some error from jpeg and color blending
  // needs to be dynamic due to watermark scaling
  const passed =
    containsBrandColor &&
    error < watermarkHeight * 9 &&
    error > watermarkHeight * 3;

  console.log(
    `${passed ? "passed" : "failed"} reddit test with error: ${error},`,
    ` contains brand color: ${containsBrandColor}`
  );

  return passed;
}

function findWatermarkY(image: Jimp): number {
  const imageHeight = image.getHeight();
  const watermarkHeight = Math.floor(imageHeight * 0.0736);

  if (isRedditWatermark(image, watermarkHeight)) {
    return imageHeight - watermarkHeight;
  }

  return -1;
}

export default findWatermarkY;
