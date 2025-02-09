import Colosseum from "./assets/Colosseum.avif";
import Machu_Picchu from "./assets/Machu_Picchu.avif";
import Petra_1 from "./assets/Petra_1.avif";
import Petra_2 from "./assets/Petra_2.avif";
import Taj_Mahal from "./assets/Taj_Mahal.avif";

export const transformRowAndCol = (row: number, col: number) => {
  return `${row}-${col}`;
};

export const getActualRowAndCol = (indx: number, gameSize: number): string => {
  const row = Math.ceil(indx / gameSize);
  const col = indx <= gameSize ? indx : indx - (row - 1) * gameSize;
  return transformRowAndCol(row, col);
};

export function shuffleGridArr(
  arr: IPuzzleGridItems[],
  updateCorrectTiles: (action: ECorrectTilesAction, item: string) => void,
  sizeOfGame: number
): IPuzzleGridItems[] {
  let j;
  let temp;

  const arrCopy = [...arr];

  for (let i = arrCopy.length - 1; i >= 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arrCopy[j];
    arrCopy[j] = arrCopy[i];
    arrCopy[i] = temp;

    const elCorrectPosition = arrCopy[i].id;
    const elActualPosition = getActualRowAndCol(i + 1, sizeOfGame);

    if (elCorrectPosition === elActualPosition) {
      updateCorrectTiles(ECorrectTilesAction.update, elActualPosition);
    }
  }

  return arrCopy;
}

const getCanvasHeightAndWidth = (
  maxAlfaWidth: number,
  maxAlfaHeight: number,
  aspectRatio: number,
  dpr: number,
  isImgWidthGreater: boolean
) => {
  let heightForWidthGreater = maxAlfaWidth / aspectRatio;
  const widthForWidthGreater =
    heightForWidthGreater > maxAlfaHeight
      ? maxAlfaHeight * aspectRatio
      : maxAlfaWidth;

  if (heightForWidthGreater > maxAlfaHeight) {
    heightForWidthGreater = maxAlfaHeight;
  }

  const canvasWidth =
    (isImgWidthGreater ? widthForWidthGreater : maxAlfaHeight / aspectRatio) *
    dpr;
  const canvasHeight =
    (isImgWidthGreater ? heightForWidthGreater : maxAlfaHeight) * dpr;

  return { canvasWidth, canvasHeight };
};

export const preparePuzzle = (
  file: File | string,
  sampleCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  gameFieldRef: React.MutableRefObject<HTMLDivElement | null>,
  gameSize: number,
  updateCorrectTiles: (action: ECorrectTilesAction, item: string) => void
): Promise<IPuzzleGridItems[]> => {
  const maxAlfaWidth = 700;
  const maxAlfaHeight = 500;

  return new Promise((resolve, reject) => {
    if (!sampleCanvasRef.current) {
      reject("Error no sampleCanvasRef.current");
    }
    if (sampleCanvasRef.current) {
      const ctx = sampleCanvasRef.current.getContext("2d");
      const img = new Image();

      if (typeof file === "string") {
        img.src = file;
      } else {
        img.src = URL.createObjectURL(file);
      }

      img.onload = function () {
        const imgPieces: IPuzzleGridItems[] = [];
        const imgWidth = img.width;
        const imgHeight = img.height;
        const isImgWidthGreater = imgWidth > imgHeight;
        const aspectRatio = isImgWidthGreater
          ? imgWidth / imgHeight
          : imgHeight / imgWidth;

        if (ctx && sampleCanvasRef.current) {
          ctx.clearRect(
            0,
            0,
            sampleCanvasRef.current.width,
            sampleCanvasRef.current.height
          );

          const dpr = window.devicePixelRatio || 1;
          const { canvasHeight, canvasWidth } = getCanvasHeightAndWidth(
            maxAlfaWidth,
            maxAlfaHeight,
            aspectRatio,
            dpr,
            isImgWidthGreater
          );

          sampleCanvasRef.current.width = canvasWidth;
          sampleCanvasRef.current.height = canvasHeight;

          if (gameFieldRef.current) {
            gameFieldRef.current.style.width = `${canvasWidth}px`;
            gameFieldRef.current.style.maxHeight = "fit-content";
            gameFieldRef.current.style.gridTemplateRows = `repeat(${gameSize}, 1fr)`;
            gameFieldRef.current.style.gridTemplateColumns = `repeat(${gameSize}, 1fr)`;
          }

          ctx.scale(dpr, dpr);
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

          const sliceWidth = canvasWidth / gameSize;
          const sliceHeight = canvasHeight / gameSize;

          for (let row = 0; row < gameSize; row++) {
            for (let col = 0; col < gameSize; col++) {
              // Create a temporary canvas for each slice
              const sliceCanvas = document.createElement("canvas");
              sliceCanvas.width = sliceWidth * dpr;
              sliceCanvas.height = sliceHeight * dpr;
              const sliceCtx = sliceCanvas.getContext("2d");

              if (sliceCtx) {
                sliceCtx.scale(dpr, dpr);
                sliceCtx.imageSmoothingEnabled = true;
                sliceCtx.imageSmoothingQuality = "high";
                sliceCtx.drawImage(
                  sampleCanvasRef.current,
                  col * sliceWidth,
                  row * sliceHeight,
                  sliceWidth,
                  sliceHeight,
                  0,
                  0,
                  sliceWidth,
                  sliceHeight
                );
              }

              imgPieces.push({
                id: transformRowAndCol(row + 1, col + 1),
                image: sliceCanvas.toDataURL("image/png"),
              });
            }
          }

          resolve(shuffleGridArr(imgPieces, updateCorrectTiles, gameSize));
        }
      };
    }
  });
};

export const selectTemplateOptions: ISelect<string>[] = [
  { value: Taj_Mahal, text: "Taj_Mahal" },
  { value: Petra_2, text: "Petra_2" },
  { value: Machu_Picchu, text: "Machu_Picchu" },
  { value: Colosseum, text: "Colosseum" },
  { value: Petra_1, text: "Petra_1" },
];

export const puzzleSizeSelectOptions: ISelect<number>[] = [
  { value: 3, text: "Size 3" },
  { value: 4, text: "Size 4" },
  { value: 5, text: "Size 5" },
  { value: 6, text: "Size 6" },
  { value: 7, text: "Size 7" },
  { value: 8, text: "Size 8" },
  { value: 9, text: "Size 9" },
  { value: 10, text: "Size 10" },
];

interface ISelect<T> {
  value: T;
  text: string;
}

export interface IPuzzleGridItems {
  id: string;
  image: string;
}

export enum ECorrectTilesAction {
  update = "UPDATE",
  delete = "DELETE",
}
