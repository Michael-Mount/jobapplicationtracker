"use server";

import { getSession } from "../auth/auth";
import connectDB from "../db";
import { Board, Column, JobApplicaiton } from "../models";
import { revalidatePath } from "next/cache";

interface JobApplicaitonData {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  columnId: string;
  boardId: string;
  tags?: string[];
  description?: string;
}

interface ColumnData {
  name: string;
  color: string;
  boardId: string;
}

//Create a Column
export async function createColumn(data: ColumnData) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unathorized" };
  }

  await connectDB();

  const { name, color, boardId } = data;

  if (!boardId || !name) {
    return { Error: "Missing Required Fields" };
  }

  //Verify if User has ownership of board
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id,
  });

  if (!board) {
    return { error: "Board Not Found" };
  }

  const maxOrder = (await Column.findOne({ boardId })
    .sort({ order: -1 })
    .select("order")
    .lean()) as { order: number } | null;

  const column = await Column.create({
    name,
    color,
    boardId,
    order: maxOrder ? maxOrder.order + 1 : 0,
  });

  await Board.findByIdAndUpdate(boardId, {
    $push: { columns: column._id },
  });
  revalidatePath("/dashboard");

  return { data: JSON.parse(JSON.stringify(column)) };
}

//Create a Job Applicaiton
export async function createJobApplicaiton(data: JobApplicaitonData) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unathorized" };
  }

  await connectDB();

  const {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    tags,
    description,
  } = data;

  if (!company || !position || !columnId || !boardId) {
    return { Error: "Missing Required Fields" };
  }

  //Verify if user has ownership of board
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id,
  });
  if (!board) {
    return { error: "Board Not Found" };
  }

  //Verify if column belogns to board
  const column = await Column.findOne({
    _id: columnId,
    boardId: boardId,
  });

  if (!column) {
    return { error: "Column not Found" };
  }

  const maxOrder = (await JobApplicaiton.findOne({ columnId })
    .sort({ order: -1 })
    .select("order")
    .lean()) as { order: number } | null;

  const jobApplication = await JobApplicaiton.create({
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    userId: session.user.id,
    tags: tags || [],
    description,
    status: "applied",
    order: maxOrder ? maxOrder.order + 1 : 0,
  });

  await Column.findByIdAndUpdate(columnId, {
    $push: { jobApplications: jobApplication._id },
  });

  revalidatePath("/dashboard");

  return { data: JSON.parse(JSON.stringify(jobApplication)) };
}

//Change the data in the Job application and make them drag-able
export async function updateJobApplication(
  id: string,
  updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    joburl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
  },
) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unathorized" };
  }

  const jobApplication = await JobApplicaiton.findById(id);

  if (!jobApplication) {
    return { error: "Job Applicaiton not found" };
  }

  if (jobApplication.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  const { columnId, order, ...otherUpdates } = updates;

  const updatesToApply: Partial<{
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    joburl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
  }> = otherUpdates;

  const currentColumnId = jobApplication.columnId.toString();
  const newColumnId = columnId?.toString();

  const isMovingToDifferentColumn =
    newColumnId && newColumnId !== currentColumnId;

  if (isMovingToDifferentColumn) {
    await Column.findByIdAndUpdate(currentColumnId, {
      $pull: { jobApplications: id },
    });

    const jobsInTargetColumn = await JobApplicaiton.find({
      columnId: newColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    let newOrderValue: number;

    if (order !== undefined && order !== null) {
      newOrderValue = order * 100;

      const jobsThatNeedToShift = jobsInTargetColumn.slice(order);
      for (const job of jobsThatNeedToShift) {
        await JobApplicaiton.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else {
      if (jobsInTargetColumn.length > 0) {
        const lastJobOrder =
          jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0;
        newOrderValue = lastJobOrder + 100;
      } else {
        newOrderValue = 0;
      }
    }

    updatesToApply.columnId = newColumnId;
    updatesToApply.order = newOrderValue;

    await Column.findByIdAndUpdate(newColumnId, {
      $push: { jobApplications: id },
    });
  } else if (order !== undefined && order !== null) {
    const otherJobsInColumn = await JobApplicaiton.find({
      columnId: currentColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    const currentJobOrder = jobApplication.order || 0;
    const currentPositionIndex = otherJobsInColumn.findIndex(
      (job) => job.order > currentJobOrder,
    );
    const oldPositionIndex =
      currentPositionIndex === -1
        ? otherJobsInColumn.length
        : currentPositionIndex;

    const newOrderValue = order * 100;

    if (order < oldPositionIndex) {
      const jobsToShiftDown = otherJobsInColumn.slice(order, oldPositionIndex);

      for (const job of jobsToShiftDown) {
        await JobApplicaiton.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else if (order > oldPositionIndex) {
      const jobsToShiftUp = otherJobsInColumn.slice(oldPositionIndex, order);
      for (const job of jobsToShiftUp) {
        const newOrder = Math.max(0, job.order - 100);
        await JobApplicaiton.findByIdAndUpdate(job._id, {
          $set: { order: newOrder },
        });
      }
    }

    updatesToApply.order = newOrderValue;
  }

  const updated = await JobApplicaiton.findByIdAndUpdate(id, updatesToApply, {
    new: true,
  });

  revalidatePath("/dashboard");

  return { data: JSON.parse(JSON.stringify(updated)) };
}

//Delete Job Application Card
export async function deleteJobApplication(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unathorized" };
  }

  const jobApplication = await JobApplicaiton.findById(id);

  if (!jobApplication) {
    return { error: "Job Application not Found" };
  }

  if (jobApplication.userId !== session.user.id) {
    return { error: "Unathorized" };
  }

  await Column.findByIdAndUpdate(jobApplication.columnId, {
    $pull: { jobApplication: id },
  });

  await JobApplicaiton.deleteOne({ _id: id });

  revalidatePath("/dashboard");

  return { success: true };
}

//Delete a Column
export async function deleteColumn(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const column = await Column.findById(id);

  if (!column) {
    return { error: "Column not found" };
  }

  const board = await Board.findOne({
    _id: column.boardId,
    userId: session.user.id,
  });

  if (!board) {
    return { error: "Unauthorized" };
  }

  await JobApplicaiton.deleteMany({
    columnId: column._id,
    userId: session.user.id,
  });

  await Column.deleteOne({
    _id: column._id,
  });

  await Board.updateOne(
    { _id: board._id },
    {
      $pull: {
        columns: column._id,
      },
    },
  );

  revalidatePath("/dashboard");

  return { success: true };
}
