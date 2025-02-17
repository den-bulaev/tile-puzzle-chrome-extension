import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ECorrectTilesAction,
  IPuzzleGridItems,
  preparePuzzle,
  getPuzzleSizeSelectOptions,
  selectTemplateOptions,
  transformRowAndCol,
} from "./utils";
import { useFireworks } from "./customHooks/useFireworks";
import Select from "./components/Select/Select";

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

  const puzzleSizeSelectOptions = useMemo(
    () => getPuzzleSizeSelectOptions(),
    []
  );

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

      if (updatedTiles.size === gameSize * gameSize && launchFireworks) {
        launchFireworks();
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
      gameSize,
      updateCorrectTiles
    ).then((puzzleData) => {
      setGrid(puzzleData);
    });
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
        +e.target.value,
        updateCorrectTiles
      ).then((puzzleData) => {
        setGrid(puzzleData);
      });
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

    preparePuzzle(
      targetVal,
      sampleCanvasRef,
      gameFieldRef,
      gameSize,
      updateCorrectTiles
    ).then((puzzleData) => {
      setGrid(puzzleData);
    });

    imageFile.current = targetVal;
  };

  return (
    <div className="wrapper">
      <div className="toolbar" role="toolbar">
        <div className="toolbar_item">
          <label htmlFor="file-upload" className="prime-btn">
            {chrome.i18n.getMessage("choosePicture")}
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
          <Select
            value={templateSelectValue.current}
            handleChange={handleChangeTemplateSelect}
            options={selectTemplateOptions}
            defaultOptionText={chrome.i18n.getMessage("picture")}
          />
        </div>

        <label
          htmlFor="show-template"
          className="toolbar_item show-template-checkbox_label"
        >
          {`${chrome.i18n.getMessage("sample")}:`}
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
          <Select
            value={String(gameSize)}
            handleChange={handleChangePuzzleSize}
            options={puzzleSizeSelectOptions}
            defaultOptionText={chrome.i18n.getMessage("selectSize")}
          />
        </div>

        <div className="toolbar_item tiles-counter">
          {`${chrome.i18n.getMessage("score")}: ${
            correctTiles.size
          } ${chrome.i18n.getMessage("from")} ${gameSize * gameSize}`}
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
