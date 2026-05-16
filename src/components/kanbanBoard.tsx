"use client";

import { Board, Column } from "@/lib/models/models.type";
import {
  Award,
  Calendar,
  CheckCircle2,
  Mic,
  MoreVertical,
  Trash2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import CreateJobApplicationDialog from "./CreateJobApplicationDialog";

interface KanbanBoardProps {
  board: Board;
  userId: string;
}

interface ColCongif {
  color: string;
  icon: React.ReactNode;
}

const COLUMN_CONFIG: Array<ColCongif> = [
  {
    color: "bg-cyan-500",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    color: "bg-green-500",
    icon: <Mic className="h-4 w-4" />,
  },
  {
    color: "bg-yellow-500",
    icon: <Award className="h-4 w-4" />,
  },
  {
    color: "bg-red-500",
    icon: <XCircle className="h-4 w-4" />,
  },
];

function DroppableColumn({
  column,
  config,
  boardId,
}: {
  column: Column;
  config: ColCongif;
  boardId: string;
}) {
  return (
    <Card className="min-w-75 shrink-0 shadow-md p-0">
      <CardHeader
        className={`${config.color} text-white rounded-t-lg pb-3 pt-3`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <CardTitle className="text-white text-base font-semibold">
              {column.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-4 bg-gray-50/50 min-h[400px] rounded-b-lg">
        <CreateJobApplicationDialog columnId={column._id} boardId={boardId} />
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ board, userId }: KanbanBoardProps) {
  const columns = board.columns;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col, index) => {
        const config = COLUMN_CONFIG[index] || {
          color: "bg-gray-500",
          icon: <Calendar className="h-4 w-4" />,
        };

        return (
          <DroppableColumn
            key={col._id}
            column={col}
            config={config}
            boardId={board._id}
          />
        );
      })}
    </div>
  );
}
