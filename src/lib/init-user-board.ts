import connectDB from "./db";
import { Board, Column } from "./models";
import column from "./models/column";
import jobApplication from "./models/job-application";

const DEFAULT_COLUMNS = [
  {
    name: "Applied",
    order: 0,
  },
  {
    name: "Interviewing",
    order: 1,
  },
  {
    name: "Offer",
    order: 2,
  },
  {
    name: "Rejected",
    order: 3,
  },
];

export async function initializeUserBoard(userId: string) {
  try {
    await connectDB();
    //Check If Board exist
    const existingBoard = await Board.findOne({ userId, name: "Job Hunt" });

    if (existingBoard) {
      return existingBoard;
    }

    //Create the Board
    const board = await Board.create({
      name: "Job Hunt",
      userId,
      columns: [],
    });

    //Create Default Columns
    const columns = await Promise.all(
      DEFAULT_COLUMNS.map((col) =>
        Column.create({
          name: col.name,
          order: col.order,
          boardId: board._id,
          jobApplication: [],
        }),
      ),
    );

    //Update the Board with New Column Ids
    board.columns = columns.map((col) => col._id);
    await board.save();

    return board;
    //
  } catch (err) {
    throw err;
  }
}
