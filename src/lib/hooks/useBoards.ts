"use client";

import { useEffect, useState } from "react";
import { Board, Column } from "../models/models.type";

export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(() => initialBoard || null);
  const [columns, setColumns] = useState<Column[]>(
    () => initialBoard?.columns || [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBoard(initialBoard || null);
    setColumns(initialBoard?.columns || []);
  }, [initialBoard]);

  async function moveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    // later
  }

  return { board, columns, error, moveJob };
}
