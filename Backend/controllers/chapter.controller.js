import mongoose from "mongoose";
import { Chapter } from "../models/chapter.model.js";
import { Subject } from "../models/subject.model.js";
import { errorHandler } from "../utils/error.js";

export const addChapter = async (req, res, next) => {
  try {
    const { name, subjectId } = req.body;

    // Validate input fields
    if (!name?.trim() || !subjectId?.trim()) {
      return next(errorHandler(400, "Please fill all the fields"));
    }

    // Check if the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return next(errorHandler(404, "Subject not found"));
    }

    // Normalize the name (optional, e.g., lowercase and trim spaces)
    const normalizedName = name.trim().toLowerCase();

    // Check if the chapter already exists for the subject
    const existingChapter = await Chapter.findOne({
      name: normalizedName,
      subject: subjectId,
    });

    if (existingChapter) {
      return res.status(200).json({
        success: true,
        message: "Chapter already exists",
        chapter: existingChapter,
      });
    }

    // Create a new chapter
    const chapter = new Chapter({
      name: normalizedName,
      subject: subjectId,
    });

    // Save the chapter to the database
    await chapter.save();

    res.status(201).json({
      success: true,
      message: "Chapter added successfully",
      chapter,
    });
  } catch (error) {
    console.error("Error adding chapter:", error); // Log error for debugging
    next(errorHandler("An error occurred while adding the chapter", 500));
  }
};

export const getChaptersBySubjectId = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) {
      return next(errorHandler(400, "Please provide subject id"));
    }
    const chapters = await Chapter.aggregate([
      {
        $match: {
          subject: new mongoose.Types.ObjectId(subjectId),
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "chapters",
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          subject: 1,
        },
      },
    ]);

    if (!chapters.length) {
      return next(errorHandler(404, "No chapters found"));
    }

    res.status(200).json({
      success: true,
      chapters,
    });
  } catch (error) {}
};

export const getAllChapters = async (req, res, next) => {
  try {
    const chapters = await Chapter.find().select('_id name subject');;
    if (!chapters.length) {
      return next(errorHandler(404, "No chapters found"));
    }
    res.status(200).json({
      success: true,
      chapters,
    });
  } catch (error) {
    console.error("Error getting chapters:", error);
    return next(errorHandler("An error occurred while getting chapters", 500));
  }
};
