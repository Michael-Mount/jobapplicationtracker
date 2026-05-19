"use client";

import { createColumn } from "@/lib/actions/job-applications";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Plus } from "lucide-react";

interface CreateColumnDialogProps {
  boardId: string;
}

const INITIAL_FORM_DATA = {
  name: "",
  color: "#2596be",
};

export default function CreateColumnDialog({
  boardId,
}: CreateColumnDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  async function handelSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      console.log(JSON.stringify({ ...formData }));
      const result = await createColumn({
        ...formData,
        boardId,
      });

      if (!result.error) {
        setFormData(INITIAL_FORM_DATA);
        setOpen(false);
      } else {
        console.log("Failed to Create Column", result.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className=" mb-4 justify-center text-muted-foreground border-dotted border-grey-800 bg-transparent hover:border-solid hover:border-primary" />
        }
      >
        <Plus className="w-4 h-4 " />
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a New Column</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handelSubmit}>
          <div className="space-y-4">
            <div className="space-y-4">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Label htmlFor="color">Color </Label>
              <HexColorPicker
                color={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
              />
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" style={{ backgroundColor: formData.color }}>
              Add New Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
