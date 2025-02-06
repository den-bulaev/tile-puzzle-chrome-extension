import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ECorrectTilesAction,
  getActualRowAndCol,
  IPuzzleGridItems,
  preparePuzzle,
  puzzleSizeSelectOptions,
  selectTemplateOptions,
  transformRowAndCol,
} from "./utils";
import { useFireworks } from "./customHooks/useFireworks";

function App() {
  const [grid, setGrid] = useState<IPuzzleGridItems[]>([]);
  const [correctTiles, setCorrectTiles] = useState(new Set<string>());
  const [gameSize, setGameSize] = useState(3);

  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameFieldRef = useRef<HTMLDivElement | null>(null);
  const fireworkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageFile = useRef<File | string>("");
  const templateSelectValue = useRef<string>("");

  let draggedTile: (EventTarget & HTMLDivElement) | null = null;
  let targetTile: (EventTarget & HTMLDivElement) | null = null;
  let draggedFrom = "";

  const { launchFireworks, stopFireworks } =
    useFireworks(fireworkCanvasRef) || {};

  useEffect(() => {
    if (stopFireworks) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopFireworks]);

  useEffect(() => {
    if (grid.length) {
      grid.forEach((element, indx) => {
        const elCorrectPosition = element.id;
        const elActualPosition = getActualRowAndCol(indx + 1, gameSize);

        if (elCorrectPosition === elActualPosition) {
          updateCorrectTiles(ECorrectTilesAction.update, elActualPosition);
        }
      });
    }
  }, [grid]);

  useEffect(() => {
    if (correctTiles.size === gameSize * gameSize) {
      if (typeof launchFireworks === "function") {
        launchFireworks();
      }
    }
  }, [correctTiles]);

  const handleVisibilityChange = () => {
    if (!document.hidden && stopFireworks) {
      stopFireworks();
    }
  };

  const updateCorrectTiles = (action: ECorrectTilesAction, item: string) => {
    setCorrectTiles((prev) => {
      const updatedTiles = new Set(prev);

      if (action === ECorrectTilesAction.update) {
        updatedTiles.add(item);
      } else {
        if (updatedTiles.has(item)) {
          updatedTiles.delete(item);
        }
      }

      return updatedTiles;
    });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files.length) {
      return;
    }

    if (stopFireworks) {
      stopFireworks();
    }

    templateSelectValue.current = "";
    setGrid([]);
    setCorrectTiles(new Set());

    imageFile.current = event.target.files[0];

    preparePuzzle(
      imageFile.current,
      sampleCanvasRef,
      gameFieldRef,
      gameSize
    ).then((puzzleData) => setGrid(puzzleData));
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    draggedTile = event.currentTarget;
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    targetTile = event.currentTarget;
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!draggedTile || !targetTile) {
      return;
    }

    targetTile = event.currentTarget;

    const parent = draggedTile.parentNode;

    if (parent) {
      const next1 = draggedTile.nextSibling;
      const next2 = targetTile.nextSibling;

      parent.insertBefore(draggedTile, next2);
      parent.insertBefore(targetTile, next1);
    }

    if (draggedFrom) {
      updateCorrectTiles(
        targetTile.id === draggedFrom
          ? ECorrectTilesAction.update
          : ECorrectTilesAction.delete,
        targetTile.id
      );

      draggedFrom = "";
    }

    targetTile = null;
  };

  const getRowAndCol = (e: React.DragEvent<HTMLDivElement>) => {
    let res = "";

    if (draggedTile && gameFieldRef.current) {
      const gridRect = gameFieldRef.current.getBoundingClientRect();

      const offsetX = e.clientX - gridRect.left;
      const offsetY = e.clientY - gridRect.top;

      const cellWidth = gridRect.width / gameSize;
      const cellHeight = gridRect.height / gameSize;

      const col = Math.floor(offsetX / cellWidth) + 1;
      const row = Math.floor(offsetY / cellHeight) + 1;

      res = transformRowAndCol(row, col);
    }

    return res;
  };

  const handleDragOverGetStartPosition = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    const rowAndCol = getRowAndCol(e);

    if (!draggedFrom) {
      draggedFrom = rowAndCol;
    }
  };

  const handleDropGetFinishPosition = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rowAndCol = getRowAndCol(e);

    if (!draggedTile || !gameFieldRef.current) {
      return;
    }

    updateCorrectTiles(
      draggedTile.id === rowAndCol
        ? ECorrectTilesAction.update
        : ECorrectTilesAction.delete,
      draggedTile.id
    );

    draggedTile = null;
  };

  const handleChangeIsTemplateVisible = (e: ChangeEvent<HTMLInputElement>) => {
    if (!sampleCanvasRef.current) {
      return;
    }

    if (e.target.checked) {
      sampleCanvasRef.current.style.visibility = "visible";
    } else {
      sampleCanvasRef.current.style.visibility = "hidden";
    }
  };

  const handleChangePuzzleSize = (e: ChangeEvent<HTMLSelectElement>) => {
    if (stopFireworks) {
      stopFireworks();
    }

    setGrid([]);
    setCorrectTiles(new Set());
    setGameSize(+e.target.value);

    if (imageFile.current) {
      preparePuzzle(
        imageFile.current,
        sampleCanvasRef,
        gameFieldRef,
        +e.target.value
      ).then((res) => setGrid(res));
    }
  };

  const handleChangeTemplateSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const targetVal = e.target.value;

    if (!targetVal) {
      return;
    }

    if (stopFireworks) {
      stopFireworks();
    }

    setGrid([]);
    setCorrectTiles(new Set());

    templateSelectValue.current = targetVal;

    preparePuzzle(targetVal, sampleCanvasRef, gameFieldRef, gameSize).then(
      (res) => {
        setGrid(res);
      }
    );

    imageFile.current = targetVal;
  };

  return (
    <div className="wrapper">
      <div className="toolbar" role="toolbar">
        <div className="toolbar_item">
          <label htmlFor="file-upload" className="prime-btn">
            Choose File
          </label>
          <input
            id="file-upload"
            className="picture-loader"
            type="file"
            accept="image/*"
            onClick={(e) => (e.currentTarget.value = "")}
            onChange={handleImageUpload}
          />
        </div>

        <div className="toolbar_item">
          <select
            className="select"
            onChange={handleChangeTemplateSelect}
            value={templateSelectValue.current}
          >
            <option className="select_default-option" value="">
              Select template
            </option>
            {selectTemplateOptions.map((item) => (
              <option value={item.value} key={item.text}>
                {item.text}
              </option>
            ))}
          </select>
        </div>

        <label
          htmlFor="show-template"
          className="toolbar_item show-template-checkbox_label"
        >
          Sample:
          <input
            type="checkbox"
            id="show-template"
            className="show-template-checkbox"
            defaultChecked={false}
            onChange={handleChangeIsTemplateVisible}
            disabled={!grid.length}
          />
        </label>

        <div className="toolbar_item">
          <select
            className="select"
            onChange={handleChangePuzzleSize}
            value={gameSize}
          >
            <option className="select_default-option" value="">
              Select size
            </option>
            {puzzleSizeSelectOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.text}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar_item tiles-counter">
          {`Score: ${correctTiles.size} from ${gameSize * gameSize}`}
        </div>
      </div>

      <div className="game">
        <canvas className="sample-canvas" ref={sampleCanvasRef}></canvas>
        <canvas className="firework-canvas" ref={fireworkCanvasRef}></canvas>
        <div
          className="game_field"
          ref={gameFieldRef}
          onDragOver={handleDragOverGetStartPosition}
          onDrop={handleDropGetFinishPosition}
        >
          {grid.map((piece) => (
            <div
              key={piece?.id}
              id={piece?.id}
              draggable="true"
              className="game_item"
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {piece && (
                <img
                  src={piece.image}
                  alt="image piece"
                  className="game_item-image"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
