"use server";

import { connect } from "http2";
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
