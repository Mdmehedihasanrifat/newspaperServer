import { supportedImageMimes } from "../config/filesystem";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { date } from "zod";

export const imageValidator = (size: number, mime: string): string | null => {
  if (bytesToMb(size) > 2) {
    return "Image must be less than 2MB";
  } else if (!supportedImageMimes.includes(mime)) {
    return "Image type should be img, jpg, png, etc.";
  }
  return null;
};

export const bytesToMb = (bytes: number): number => {
  return bytes / (1024 * 1024);
};

export const generateRandom = (): string => {
  return uuidv4();
};

// Ensure you have the correct type for imgName
export const getImageUrl = (imgName: string): string => {
  // Check if imgName is a valid URL (i.e., starts with 'http://' or 'https://')
  if (imgName.startsWith('http://') || imgName.startsWith('https://')) {
    return imgName; // Return the absolute URL directly
  }

  // Handle relative URL by combining it with the base URL
  const baseUrl = process.env.APP_URL || 'http://localhost:3000/';
  return `${baseUrl}news/${imgName}`;
};

export const getProfileImageUrl = (imgName: string): string => {
  return `${process.env.APP_URL}images/${imgName}`;
};
export const removeImage = (imgName: string): void => {
  const path = `${process.cwd()}/public/news/${imgName}`;
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
};
